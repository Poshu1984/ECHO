import { Router } from "express";
import { consumeQuota } from "../store.js";
import { configuredKey, geminiModelList, rememberGeminiModel, shouldTryNextGeminiModel } from "../llmModels.js";

const router = Router();
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

function anthropicKey() {
  return configuredKey("ANTHROPIC_API_KEY");
}

function geminiKey() {
  return configuredKey("GOOGLE_GEMINI_API_KEY", "GOOGLE_TTS_API_KEY");
}

function toAnthropicShape(text) {
  return { content: [{ type: "text", text }], provider: "gemini" };
}

function geminiText(body) {
  return (body?.candidates || [])
    .flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text || "")
    .join("\n")
    .trim();
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

async function callGeminiModel(key, model, system, messages, maxTokens, temperature, withThinkingOff) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const contents = (Array.isArray(messages) ? messages : []).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
  }));
  const generationConfig = {
    maxOutputTokens: Math.max(maxTokens || 1200, 1024),
    temperature: Number.isFinite(temperature) ? temperature : 0.7,
    responseMimeType: "application/json",
  };
  if (withThinkingOff) generationConfig.thinkingConfig = { thinkingBudget: 0 };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system || "" }] },
      contents,
      generationConfig,
    }),
  });
  const raw = await res.text();
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    body = { error: raw || "Gemini parse error" };
  }
  if (!res.ok) return { ok: false, status: res.status, body, model };
  const text = geminiText(body);
  if (!text) return { ok: false, status: 502, body: { error: "Empty Gemini response", model }, model };
  return { ok: true, body: toAnthropicShape(text), model };
}

async function callGemini(system, messages, maxTokens, temperature) {
  const key = geminiKey();
  if (!key) return { ok: false, skip: true };
  let last = { ok: false, skip: false };
  for (const model of geminiModelList()) {
    let result = await callGeminiModel(key, model, system, messages, maxTokens, temperature, true);
    if (!result.ok && result.status === 400) {
      result = await callGeminiModel(key, model, system, messages, maxTokens, temperature, false);
    }
    if (result.ok) {
      rememberGeminiModel(model);
      return result;
    }
    last = result;
    if (!shouldTryNextGeminiModel(result.status)) return result;
  }
  return last;
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
