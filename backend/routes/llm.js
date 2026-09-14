import { Router } from "express";
import { consumeQuota } from "../store.js";

const router = Router();
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

router.post("/messages", async (req, res) => {
  try {
    const key = (process.env.ANTHROPIC_API_KEY || "").trim();
    if (!key || key === "your_key_here") {
      res.status(500).json({
        error: "ANTHROPIC_API_KEY is not configured on the server",
      });
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

    const { system, messages, max_tokens } = req.body ?? {};
    const anthropicRes = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: max_tokens || 1200,
        system: system || "",
        messages: Array.isArray(messages) ? messages : [],
      }),
    });

    const text = await anthropicRes.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: text || "Unknown error from LLM service" };
    }
    res.status(anthropicRes.status).json(body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
