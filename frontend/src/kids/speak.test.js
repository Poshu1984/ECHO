import test from "node:test";
import assert from "node:assert/strict";
import { pickJapaneseVoice } from "./speak.js";

test("prefers an on-device Japanese voice", () => {
  const voices = [
    { name: "Google 日本語", lang: "ja-JP", localService: false },
    { name: "Kyoko", lang: "ja-JP", localService: true },
    { name: "Samantha", lang: "en-US", localService: true },
  ];
  assert.equal(pickJapaneseVoice(voices).name, "Kyoko");
});

test("falls back to a network Japanese voice, then null", () => {
  assert.equal(pickJapaneseVoice([{ name: "G", lang: "ja_JP", localService: false }]).name, "G");
  assert.equal(pickJapaneseVoice([{ name: "S", lang: "en-US", localService: true }]), null);
  assert.equal(pickJapaneseVoice(undefined), null);
});
