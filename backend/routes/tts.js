import { Router } from "express";
import { assertQuota, consumeQuota } from "../store.js";

const router = Router();
const TTS_BASE = "https://texttospeech.googleapis.com/v1";

function requireApiKey(res) {
  const key = (process.env.GOOGLE_TTS_API_KEY || "").trim();
  if (!key || key === "your_key_here") {
    res.status(500).json({
      error: "GOOGLE_TTS_API_KEY is not configured on the server",
    });
    return null;
  }
  return key;
}

async function forwardGoogleResponse(googleRes, res) {
  const text = await googleRes.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { error: text || "Unknown error from TTS service" };
  }
  res.status(googleRes.status).json(body);
}

router.get("/voices", async (req, res) => {
  try {
    const key = requireApiKey(res);
    if (!key) return;

    const languageCode = req.query.languageCode || "";
    const url = new URL(`${TTS_BASE}/voices`);
    if (languageCode) url.searchParams.set("languageCode", languageCode);
    url.searchParams.set("key", key);

    const googleRes = await fetch(url);
    await forwardGoogleResponse(googleRes, res);
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

    const url = new URL(`${TTS_BASE}/text:synthesize`);
    url.searchParams.set("key", key);

    const googleRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(googleBody),
    });
    if (!googleRes.ok) {
      await forwardGoogleResponse(googleRes, res);
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
    await forwardGoogleResponse(googleRes, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
