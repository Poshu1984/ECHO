import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickFresh, rememberKey } from "./vary.js";
import { micErrorKey } from "./speech.js";
import { vocabPrompt, examplePrompt, scenePrompt, examPrompt, readingPrompt } from "./prompts.js";
import { t } from "./i18n.js";
import { inferScene, formatClock } from "./story.js";
import { pickGoogleVoice } from "./tts.js";
import { TUTORS } from "./content.js";
import { beatsOf, joinBeats, timesEstimated, sentenceRange } from "./beats.js";

describe("pickFresh", () => {
  it("skips seen keys then wraps", () => {
    const items = [{ word: "a" }, { word: "b" }, { word: "c" }];
    const first = pickFresh(items, ["a", "b"], (x) => x.word);
    assert.equal(first.word, "c");
    const wrapped = pickFresh(items, ["a", "b", "c"], (x) => x.word);
    assert.ok(["a", "b", "c"].includes(wrapped.word));
  });
});

describe("rememberKey", () => {
  it("caps and skips empty", () => {
    let seen = [];
    for (let i = 0; i < 30; i += 1) seen = rememberKey(seen, `k${i}`, 24);
    assert.equal(seen.length, 24);
    assert.equal(seen[0], "k6");
    assert.deepEqual(rememberKey(["a"], ""), ["a"]);
  });
});

describe("micErrorKey", () => {
  it("maps permission and missing mic", () => {
    assert.equal(micErrorKey({ error: "not-allowed" }), "micDenied");
    assert.equal(micErrorKey({ name: "NotFoundError" }), "micError");
    assert.equal(micErrorKey({ error: "network" }), "micError");
    assert.equal(micErrorKey({ error: "aborted" }), "");
  });
});

describe("labels", () => {
  it("uses learner-facing Chinese instead of jack-in copy", () => {
    assert.equal(t("zh", "logout"), "登出");
    assert.equal(t("zh", "send"), "送出");
    assert.equal(t("zh", "startChat"), "開始對話");
    assert.equal(t("zh", "login"), "登入");
    assert.equal(t("en", "logout"), "Log out");
    assert.equal(t("zh", "mic"), "語音回覆");
    assert.equal(t("zh", "chatFail"), "對話連不上。先從朗讀或單字練習。");
    assert.equal(t("en", "chatFail"), "Chat is unavailable. Try reading or words first.");
    assert.equal(t("zh", "ttsOk"), "雲端語音已連上 Google Cloud。");
    assert.match(t("zh", "ttsOff"), /雲端語音/);
  });
});

describe("prompts", () => {
  it("asks the model to avoid repeats", () => {
    const lang = { name: "English" };
    const level = { id: "B1", toeic: "550-784", ielts: "4.0-5.0" };
    assert.match(vocabPrompt(lang, level, ["deadline"]), /deadline/);
    assert.match(examplePrompt(lang, level, ["Hello"]), /Hello/);
    assert.match(scenePrompt(lang, level, ["Airport"]), /Airport/);
    assert.match(examPrompt(lang, level, ["until"]), /until/);
    assert.match(readingPrompt(lang, level), /hook_zh/);
    assert.match(readingPrompt(lang, level), /scene/);
  });
});

describe("story scene", () => {
  it("infers rain from the text and formats the clock", () => {
    assert.equal(inferScene({ scene: "rain" }), "rain");
    assert.equal(inferScene({ title: "Rainy taxi", sentences: [{ text: "The wipers dragged rain." }] }), "rain");
    assert.equal(inferScene({ title: "Office notes", sentences: [{ text: "The meeting ran long." }] }), "office");
    assert.equal(formatClock(29), "0:29");
    assert.equal(formatClock(75.4), "1:15");
  });
});

describe("beats", () => {
  it("splits english words and joins them back", () => {
    const tokens = beatsOf("I missed the first bus.", "en");
    assert.deepEqual(tokens, ["I", "missed", "the", "first", "bus."]);
    assert.equal(joinBeats(tokens, "en"), "I missed the first bus.");
  });

  it("estimates increasing time ranges", () => {
    const times = timesEstimated(["a", "bb", "ccc"], 6);
    assert.equal(times.length, 3);
    assert.equal(times[0].start, 0);
    assert.ok(times[0].end < times[1].end);
    assert.equal(times[2].end, 6);
  });

  it("maps sentence token ranges", () => {
    const sentences = [{ tokens: ["a", "b"] }, { tokens: ["c"] }];
    assert.deepEqual(sentenceRange(sentences, 0), [0, 1]);
    assert.deepEqual(sentenceRange(sentences, 1), [2, 2]);
  });
});

describe("google tutors", () => {
  const voices = [
    { name: "en-US-Neural2-C", ssmlGender: "FEMALE", languageCodes: ["en-US"] },
    { name: "en-US-Neural2-F", ssmlGender: "FEMALE", languageCodes: ["en-US"] },
    { name: "en-US-Neural2-H", ssmlGender: "FEMALE", languageCodes: ["en-US"] },
    { name: "en-US-Neural2-D", ssmlGender: "MALE", languageCodes: ["en-US"] },
    { name: "en-US-Neural2-J", ssmlGender: "MALE", languageCodes: ["en-US"] },
    { name: "en-US-Neural2-A", ssmlGender: "MALE", languageCodes: ["en-US"] },
    { name: "en-US-Chirp-HD-F", ssmlGender: "FEMALE", languageCodes: ["en-US"] },
  ];

  it("lists three female and three male teachers", () => {
    assert.equal(TUTORS.length, 6);
    assert.equal(TUTORS.filter((x) => x.gender === "f").length, 3);
    assert.equal(TUTORS.filter((x) => x.gender === "m").length, 3);
    assert.equal(new Set(TUTORS.map((x) => x.voices.en)).size, 6);
  });

  it("picks each teacher's preferred Neural2 voice", () => {
    for (const tutor of TUTORS) {
      const hit = pickGoogleVoice(voices, tutor, "en-US");
      assert.equal(hit.name, tutor.voices.en);
    }
  });
});
