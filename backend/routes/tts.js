import { Router } from "express";
import { assertQuota, consumeQuota } from "../store.js";

const router = Router();
// Base URL override exists only so the API tests can point at a local mock.
const TTS_ROOT = (process.env.TTS_API_BASE || "https://texttospeech.googleapis.com").replace(/\/$/, "");
const TTS_V1 = `${TTS_ROOT}/v1`;
const TTS_BETA = `${TTS_ROOT}/v1beta1`;

// Sentence-parts synthesis limits (one quota unit per request).
export const PARTS_MAX = 16;
export const PARTS_MAX_CHARS = 5000;
const VOICE_NAME = /^[a-z]{2,3}-[A-Z]{2}-(Chirp3-HD|Neural2|Wavenet|Standard)-[A-Za-z0-9]+$/;
const partCache = new Map();
const PART_CACHE_MAX = 400;

function cacheGet(key) {
  const hit = partCache.get(key);
  if (!hit) return null;
  partCache.delete(key);
  partCache.set(key, hit);
  return hit;
}

function cacheSet(key, value) {
  partCache.set(key, value);
  while (partCache.size > PART_CACHE_MAX) partCache.delete(partCache.keys().next().value);
}

function apiKey() {
  const key = (process.env.GOOGLE_TTS_API_KEY || "").trim();
  if (!key || key === "your_key_here") return "";
  return key;
}

function requireApiKey(res) {
  const key = apiKey();
  if (!key) {
    res.status(500).json({
      error: "GOOGLE_TTS_API_KEY is not configured on the server",
    });
    return null;
  }
  return key;
}

async function postGoogle(base, key, googleBody) {
  const url = new URL(`${base}/text:synthesize`);
  url.searchParams.set("key", key);
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(googleBody),
  });
}

async function readJsonResponse(googleRes) {
  const text = await googleRes.text();
  try {
    return { status: googleRes.status, body: JSON.parse(text) };
  } catch {
    return { status: googleRes.status, body: { error: text || "Unknown error from TTS service" } };
  }
}

let statusMemo = { at: 0, body: null };

router.get("/status", async (_req, res) => {
  const key = apiKey();
  if (!key) {
    res.json({ ok: false, configured: false, voices: 0 });
    return;
  }
  if (statusMemo.body && Date.now() - statusMemo.at < 60 * 1000) {
    res.json(statusMemo.body);
    return;
  }
  try {
    const url = new URL(`${TTS_V1}/voices`);
    url.searchParams.set("languageCode", "en-US");
    url.searchParams.set("key", key);
    const googleRes = await fetch(url);
    const { body } = await readJsonResponse(googleRes);
    const voices = Array.isArray(body?.voices) ? body.voices.length : 0;
    const result = { ok: googleRes.ok && voices > 0, configured: true, voices };
    if (result.ok) statusMemo = { at: Date.now(), body: result };
    res.json(result);
  } catch {
    res.json({ ok: false, configured: true, voices: 0 });
  }
});

const voiceCache = new Map();

router.get("/voices", async (req, res) => {
  try {
    const key = requireApiKey(res);
    if (!key) return;

    const languageCode = req.query.languageCode || "";
    const cacheKey = languageCode || "*";
    const hit = voiceCache.get(cacheKey);
    if (hit && Date.now() - hit.at < 10 * 60 * 1000) {
      res.json(hit.body);
      return;
    }
    const url = new URL(`${TTS_V1}/voices`);
    if (languageCode) url.searchParams.set("languageCode", languageCode);
    url.searchParams.set("key", key);

    const googleRes = await fetch(url);
    const { status, body } = await readJsonResponse(googleRes);
    if (googleRes.ok) voiceCache.set(cacheKey, { at: Date.now(), body });
    res.status(status).json(body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/synthesize", async (req, res) => {
  try {
    const key = requireApiKey(res);
    if (!key) return;
    try {
      assertQuota(req.auth.sub, "tts");
    } catch (error) {
      if (error.message === "QUOTA_EXCEEDED") {
        res.status(429).json({ error: "QUOTA_EXCEEDED", kind: "tts" });
        return;
      }
      throw error;
    }
    const incoming = req.body ?? {};
    const wantMarks = Boolean(incoming.marks);
    const googleBody =
      incoming.ssml && !incoming.input
        ? {
            input: { ssml: incoming.ssml },
            voice: incoming.voice,
            audioConfig: incoming.audioConfig,
          }
        : { ...incoming };
    delete googleBody.enableTimePointing;
    delete googleBody.ssml;
    delete googleBody.marks;

    let parsed;
    if (wantMarks) {
      const betaRes = await postGoogle(TTS_BETA, key, {
        ...googleBody,
        enableTimePointing: ["SSML_MARK"],
      });
      parsed = await readJsonResponse(betaRes);
      if (!betaRes.ok) {
        const v1Res = await postGoogle(TTS_V1, key, googleBody);
        parsed = await readJsonResponse(v1Res);
      }
    } else {
      const v1Res = await postGoogle(TTS_V1, key, googleBody);
      parsed = await readJsonResponse(v1Res);
    }

    if (parsed.status !== 200) {
      res.status(parsed.status).json(parsed.body);
      return;
    }
    try {
      consumeQuota(req.auth.sub, "tts");
    } catch (error) {
      if (error.message === "QUOTA_EXCEEDED") {
        res.status(429).json({ error: "QUOTA_EXCEEDED", kind: "tts" });
        return;
      }
      throw error;
    }
    res.status(200).json(parsed.body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Synthesize several sentences in parallel and return one clip per sentence.
// The client joins them into one track, so playback starts after the
// slowest single sentence instead of the whole passage, and every sentence
// boundary is exact even for voices without word timepoints (Chirp 3: HD).
router.post("/synthesize-parts", async (req, res) => {
  try {
    const key = requireApiKey(res);
    if (!key) return;
    const body = req.body ?? {};
    const parts = Array.isArray(body.parts) ? body.parts.map((p) => String(p ?? "")) : [];
    const voice = body.voice || {};
    const languageCode = String(voice.languageCode || "");
    const name = String(voice.name || "");
    const rate = Number(body.audioConfig?.speakingRate ?? 1);
    if (!parts.length || parts.length > PARTS_MAX || parts.some((p) => !p.trim())) {
      res.status(400).json({ error: "INVALID_PARTS" });
      return;
    }
    if (parts.reduce((n, p) => n + p.length, 0) > PARTS_MAX_CHARS) {
      res.status(400).json({ error: "TOO_LONG" });
      return;
    }
    if (!VOICE_NAME.test(name) || !/^[a-z]{2,3}-[A-Z]{2}$/.test(languageCode) || !name.startsWith(languageCode)) {
      res.status(400).json({ error: "INVALID_VOICE" });
      return;
    }
    if (!Number.isFinite(rate) || rate < 0.5 || rate > 1.6) {
      res.status(400).json({ error: "INVALID_RATE" });
      return;
    }
    try {
      assertQuota(req.auth.sub, "tts");
    } catch (error) {
      if (error.message === "QUOTA_EXCEEDED") {
        res.status(429).json({ error: "QUOTA_EXCEEDED", kind: "tts" });
        return;
      }
      throw error;
    }
    const started = Date.now();
    let cached = 0;
    const results = await Promise.all(parts.map(async (text) => {
      const cacheKey = `${name}|${rate}|${text}`;
      const hit = cacheGet(cacheKey);
      if (hit) {
        cached += 1;
        return { status: 200, audioContent: hit };
      }
      const googleRes = await postGoogle(TTS_V1, key, {
        input: { text },
        voice: { languageCode, name },
        audioConfig: { audioEncoding: "MP3", speakingRate: rate },
      });
      const parsed = await readJsonResponse(googleRes);
      if (parsed.status === 200 && parsed.body?.audioContent) {
        cacheSet(cacheKey, parsed.body.audioContent);
        return { status: 200, audioContent: parsed.body.audioContent };
      }
      return { status: parsed.status || 502, error: parsed.body };
    }));
    const failed = results.find((r) => r.status !== 200);
    console.log(`[tts] parts=${parts.length} cached=${cached} voice=${name} ms=${Date.now() - started} status=${failed ? failed.status : 200}`);
    if (failed) {
      res.status(failed.status).json(failed.error || { error: "TTS_FAILED" });
      return;
    }
    if (cached < parts.length) {
      try {
        consumeQuota(req.auth.sub, "tts");
      } catch (error) {
        if (error.message === "QUOTA_EXCEEDED") {
          res.status(429).json({ error: "QUOTA_EXCEEDED", kind: "tts" });
          return;
        }
        throw error;
      }
    }
    res.json({ parts: results.map((r) => ({ audioContent: r.audioContent })) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
