import { Router } from "express";
import { assertQuota, consumeQuota } from "../store.js";

const router = Router();
const TTS_V1 = "https://texttospeech.googleapis.com/v1";
const TTS_BETA = "https://texttospeech.googleapis.com/v1beta1";

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

router.get("/status", async (_req, res) => {
  const key = apiKey();
  if (!key) {
    res.json({ ok: false, configured: false, voices: 0 });
    return;
  }
  try {
    const url = new URL(`${TTS_V1}/voices`);
    url.searchParams.set("languageCode", "en-US");
    url.searchParams.set("key", key);
    const googleRes = await fetch(url);
    const { body } = await readJsonResponse(googleRes);
    const voices = Array.isArray(body?.voices) ? body.voices.length : 0;
    res.json({
      ok: googleRes.ok && voices > 0,
      configured: true,
      voices,
    });
  } catch {
    res.json({ ok: false, configured: true, voices: 0 });
  }
});

router.get("/voices", async (req, res) => {
  try {
    const key = requireApiKey(res);
    if (!key) return;

    const languageCode = req.query.languageCode || "";
    const url = new URL(`${TTS_V1}/voices`);
    if (languageCode) url.searchParams.set("languageCode", languageCode);
    url.searchParams.set("key", key);

    const googleRes = await fetch(url);
    const { status, body } = await readJsonResponse(googleRes);
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

export default router;
