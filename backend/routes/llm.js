import { Router } from "express";
import { consumeQuota } from "../store.js";
import { configuredKey, geminiChatModelList, geminiDeltaText, geminiModelList, geminiOutputTokens, readSseDataLine, rememberGeminiModel, shouldTryNextGeminiModel } from "../llmModels.js";

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
  return geminiDeltaText(body).trim();
}

function geminiContents(messages) {
  return (Array.isArray(messages) ? messages : []).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
  }));
}

function generationConfig(maxTokens, temperature, withThinkingOff, chat) {
  const config = {
    maxOutputTokens: geminiOutputTokens(maxTokens, chat),
    temperature: Number.isFinite(temperature) ? temperature : 0.7,
    responseMimeType: "application/json",
  };
  if (withThinkingOff) config.thinkingConfig = { thinkingBudget: 0 };
  return config;
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

async function callGeminiModel(key, model, system, messages, maxTokens, temperature, withThinkingOff, chat = false) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system || "" }] },
      contents: geminiContents(messages),
      generationConfig: generationConfig(maxTokens, temperature, withThinkingOff, chat),
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

async function callGemini(system, messages, maxTokens, temperature, chat = false) {
  const key = geminiKey();
  if (!key) return { ok: false, skip: true };
  let last = { ok: false, skip: false };
  const models = chat ? geminiChatModelList() : geminiModelList();
  for (const model of models) {
    let result = await callGeminiModel(key, model, system, messages, maxTokens, temperature, true, chat);
    if (!result.ok && result.status === 400) {
      result = await callGeminiModel(key, model, system, messages, maxTokens, temperature, false, chat);
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

    const { system, messages, max_tokens, temperature, chat } = req.body ?? {};
    const temp = Number(temperature);
    const wantChat = Boolean(chat);
    const claude = wantChat ? { ok: false, skip: true } : await callClaude(system, messages, max_tokens, temp);
    if (claude.ok) {
      res.json(claude.body);
      return;
    }
    const gemini = await callGemini(system, messages, max_tokens, temp, wantChat);
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

async function openGeminiSse(key, model, system, messages, maxTokens, temperature, withThinkingOff) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system || "" }] },
      contents: geminiContents(messages),
      generationConfig: generationConfig(maxTokens, temperature, withThinkingOff, true),
    }),
  });
}

async function pipeGeminiSse(googleRes, clientRes) {
  const reader = googleRes.body?.getReader();
  if (!reader) return false;
  const decoder = new TextDecoder();
  let buf = "";
  let sent = false;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split(/\r?\n/);
    buf = lines.pop() || "";
    for (const line of lines) {
      const text = readSseDataLine(line);
      if (!text) continue;
      sent = true;
      clientRes.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
  }
  const tail = readSseDataLine(buf);
  if (tail) {
    sent = true;
    clientRes.write(`data: ${JSON.stringify({ text: tail })}\n\n`);
  }
  return sent;
}

router.post("/stream", async (req, res) => {
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
    const key = geminiKey();
    let last = { ok: false, status: 502 };

    if (key) {
      for (const model of geminiChatModelList()) {
        let googleRes = await openGeminiSse(key, model, system, messages, max_tokens, temp, true);
        if (!googleRes.ok && googleRes.status === 400) {
          googleRes = await openGeminiSse(key, model, system, messages, max_tokens, temp, false);
        }
        if (!googleRes.ok) {
          last = { ok: false, status: googleRes.status };
          if (!shouldTryNextGeminiModel(googleRes.status)) break;
          continue;
        }
        rememberGeminiModel(model);
        res.status(200);
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders?.();
        await pipeGeminiSse(googleRes, res);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }
    }

    const gemini = await callGemini(system, messages, max_tokens, temp, true);
    if (gemini.ok) {
      const text = gemini.body?.content?.[0]?.text || "";
      res.status(200);
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    res.status(last.status || gemini.status || 502).json({ error: "LLM_UNAVAILABLE" });
  } catch (error) {
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
