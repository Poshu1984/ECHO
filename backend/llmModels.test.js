import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { configuredKey, geminiModelList, shouldTryNextGeminiModel } from "./llmModels.js";

describe("llmModels", () => {
  it("skips placeholder keys", () => {
    const prevG = process.env.GOOGLE_GEMINI_API_KEY;
    const prevT = process.env.GOOGLE_TTS_API_KEY;
    process.env.GOOGLE_GEMINI_API_KEY = "your_key_here";
    process.env.GOOGLE_TTS_API_KEY = "AIzaSyDummyKeyForTests1234567";
    assert.equal(configuredKey("GOOGLE_GEMINI_API_KEY"), "");
    assert.equal(configuredKey("GOOGLE_GEMINI_API_KEY", "GOOGLE_TTS_API_KEY"), "AIzaSyDummyKeyForTests1234567");
    process.env.GOOGLE_GEMINI_API_KEY = prevG;
    process.env.GOOGLE_TTS_API_KEY = prevT;
  });

  it("skips retired flash models and keeps a live fallback", () => {
    const list = geminiModelList("gemini-2.0-flash");
    assert.equal(list.includes("gemini-2.0-flash"), false);
    assert.equal(list[0], "gemini-3.5-flash");
    assert.ok(list.includes("gemini-3.6-flash"));
  });

  it("retries the next model after 404 or overload", () => {
    assert.equal(shouldTryNextGeminiModel(404), true);
    assert.equal(shouldTryNextGeminiModel(503), true);
    assert.equal(shouldTryNextGeminiModel(400), false);
  });
});
