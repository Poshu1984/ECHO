import { Router } from "express";
import { consumeQuota } from "../store.js";

const router = Router();
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

function envKey(name) {
  const v = (process.env[name] || "").trim();
  if (!v || v === "your_key_here") return "";
  return v;
}

function anthropicKey() {
  return envKey("ANTHROPIC_API_KEY");
}

function geminiKey() {
  return envKey("GOOGLE_GEMINI_API_KEY") || envKey("GOOGLE_TTS_API_KEY");
}

function toAnthropicShape(text) {
  return { content: [{ type: "text", text }], provider: "gemini" };
}

async function callClaude(system, messages, maxTokens, temperature) {
  const key = anthropicKey();
  if (!key) return { ok: false, skip: true };
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: maxTokens || 1200,
      temperature: Number.isFinite(temperature) ? temperature : 0.7,
      system: system || "",
      messages: Array.isArray(messages) ? messages : [],
    }),
  });
  const raw = await res.text();
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    body = { error: raw || "Claude parse error" };
  }
  if (!res.ok) return { ok: false, status: res.status, body };
  body.provider = "claude";
  return { ok: true, body };
}

async function callGemini(system, messages, maxTokens, temperature) {
  const key = geminiKey();
  if (!key) return { ok: false, skip: true };
  const model = process.env.GOOGLE_GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const contents = (Array.isArray(messages) ? messages : []).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
  }));
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system || "" }] },
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens || 1200,
        temperature: Number.isFinite(temperature) ? temperature : 0.7,
      },
    }),
  });
  const raw = await res.text();
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    body = { error: raw || "Gemini parse error" };
  }
  if (!res.ok) return { ok: false, status: res.status, body };
  const text = (body.candidates || [])
    .flatMap((c) => c.content?.parts || [])
    .map((p) => p.text || "")
    .join("\n");
  if (!text.trim()) return { ok: false, status: 502, body: { error: "Empty Gemini response" } };
  return { ok: true, body: toAnthropicShape(text) };
}

router.post("/messages", async (req, res) => {
  try {
    if (!anthropicKey() && !geminiKey()) {
      res.status(500).json({ error: "No LLM key configured (Claude or Gemini)" });
      return;
    }
    try {
      consumeQuota(req.auth.sub, "llm");
    } catch (error) {
      if (error.message === "QUOTA_EXCEEDED") {
        res.status(429).json({ error: "QUOTA_EXCEEDED", kind: "llm" });
        return;
      }
      throw error;
    }

    const { system, messages, max_tokens, temperature } = req.body ?? {};
    const temp = Number(temperature);
    const claude = await callClaude(system, messages, max_tokens, temp);
    if (claude.ok) {
      res.json(claude.body);
      return;
    }
    const gemini = await callGemini(system, messages, max_tokens, temp);
    if (gemini.ok) {
      res.json(gemini.body);
      return;
    }
    res.status(claude.status || gemini.status || 502).json({
      error: "LLM_UNAVAILABLE",
      claude: claude.body || claude.skip,
      gemini: gemini.body || gemini.skip,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
