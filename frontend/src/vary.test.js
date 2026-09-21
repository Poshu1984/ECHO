import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickFresh, rememberKey } from "./vary.js";
import { micErrorKey } from "./speech.js";
import { vocabPrompt, examplePrompt, scenePrompt, examPrompt, readingPrompt, parseModelJson, parseChatPayload, chatPrompt, toLlmMessages, translatePrompt } from "./prompts.js";
import { t } from "./i18n.js";
import { inferScene, formatClock, liveSentence } from "./story.js";
import { pickGoogleVoice, cachedVoices } from "./tts.js";
import { EXAMS, TUTORS, UNLOCKS, LEVELS, examItemsFor, itemLevel, levelById, levelEquivLine, levelOptionLabel, examStyleLine } from "./content.js";
import { beatsOf, joinBeats, timesEstimated, sentenceRange } from "./beats.js";
import { MASTERY_CAP, MASTERY_MIN, recordAttempt, statsFor } from "./mastery.js";
import { attachExamMeta, attachVocabQuiz, examAnswerIndex, pickSimilar, quizAnswer, quizOptions } from "./quiz.js";
import { guessLang, lookupBeats, lookupLocal, pairLang, parseTranslatePayload, speechOf, spokenSide } from "./translate.js";

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
    assert.equal(micErrorKey({ name: "NotReadableError" }), "micBusy");
  });
});

describe("labels", () => {
  it("uses learner-facing Chinese instead of jack-in copy", () => {
    assert.equal(t("zh", "logout"), "登出");
    assert.equal(t("zh", "send"), "送出");
    assert.equal(t("zh", "startChat"), "開始對話");
    assert.equal(t("zh", "login"), "登入");
    assert.match(t("zh", "authOffline"), /登入服務/);
    assert.equal(t("en", "logout"), "Log out");
    assert.equal(t("zh", "holdMic"), "按住說話");
    assert.equal(t("zh", "listeningHold"), "放開送出");
    assert.match(t("zh", "micBtHint"), /藍牙/);
    assert.equal(t("en", "holdMic"), "Hold to talk");
    assert.equal(t("zh", "chatFail"), "對話連不上。先從朗讀或單字練習。");
    assert.equal(t("en", "chatFail"), "Chat is unavailable. Try reading or words first.");
    assert.equal(t("zh", "ttsOk"), "雲端語音已連上 Google Cloud。");
    assert.match(t("zh", "ttsOff"), /雲端語音/);
    assert.equal(t("zh", "pickFirst"), "請先選一個答案");
    assert.equal(t("zh", "answerIs"), "正確：");
    assert.equal(t("zh", "reason"), "原因：");
    assert.equal(t("zh", "accuracy"), "正確率");
    assert.equal(t("zh", "drillTag"), "再練");
    assert.equal(t("zh", "mastered"), "已達標");
    assert.equal(t("en", "pickFirst"), "Pick an option first");
    assert.equal(t("zh", "translate"), "翻譯");
    assert.equal(t("zh", "lookup"), "查詢");
    assert.equal(t("en", "translate"), "Translate");
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
    assert.match(examPrompt(lang, level, [], "look-forward-to"), /look-forward-to/);
    assert.match(examPrompt(lang, level), /"why"/);
    assert.match(examPrompt(lang, level), /"tag"/);
    assert.match(vocabPrompt(lang, level), /"why"/);
    assert.match(examplePrompt(lang, level), /"tag"/);
    assert.match(scenePrompt(lang, level), /"why"/);
    assert.match(readingPrompt(lang, level), /hook_zh/);
    assert.match(readingPrompt(lang, level), /scene/);
    const en = { code: "en", name: "English" };
    assert.match(translatePrompt(en, level, "deadline"), /deadline/);
    assert.match(translatePrompt(en, level, "deadline"), /ONE best equivalent/);
    assert.match(translatePrompt({ code: "zh", name: "中文" }, level, "期限"), /English/);
  });

  it("repairs messy model json and prefixes assistant-first chat", () => {
    const parsed = parseModelJson('note { "reply": "Hi", "reply_zh": "嗨", }');
    assert.equal(parsed.reply, "Hi");
    const history = toLlmMessages([
      { role: "ai", text: "How are you?" },
      { role: "me", text: "I am fine." },
    ]);
    assert.equal(history[0].role, "user");
    assert.equal(history[1].role, "assistant");
    assert.equal(history[2].role, "user");
    assert.equal(history[2].content, "I am fine.");
  });

  it("requires a spoken reply and keeps chat answers short", () => {
    const parsed = parseChatPayload('{"reply":"How is your morning going?","reply_zh":"你早上過得如何？","corrections":[]}');
    assert.equal(parsed.reply, "How is your morning going?");
    assert.throws(() => parseChatPayload('{"reply_zh":"沒有英文"}'), /EMPTY_REPLY/);
    const lang = { name: "English" };
    const level = { id: "B1", toeic: "550-784", ielts: "4.0-5.0" };
    assert.match(chatPrompt({ name: "Audrey" }, lang, level), /1-2 short spoken/);
  });
});

describe("story scene", () => {
  it("infers rain from the text and formats the clock", () => {
    assert.equal(inferScene({ scene: "rain" }), "rain");
    assert.equal(inferScene({ title: "Rainy taxi", sentences: [{ text: "The wipers dragged rain." }] }), "rain");
    assert.equal(inferScene({ title: "Office notes", sentences: [{ text: "The meeting ran long." }] }), "office");
    assert.equal(formatClock(29), "0:29");
    assert.equal(formatClock(75.4), "1:15");
    const live = liveSentence({
      sentences: [
        { text: "One two.", tokens: ["One", "two."] },
        { text: "Three.", tokens: ["Three."] },
      ],
    }, 2);
    assert.equal(live.index, 1);
    assert.equal(live.sentence.text, "Three.");
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

  it("reuses a cached voice list instead of refetching", async () => {
    let calls = 0;
    const loader = async () => {
      calls += 1;
      return { voices };
    };
    const first = await cachedVoices("en-US-cache-test", loader);
    const second = await cachedVoices("en-US-cache-test", loader);
    assert.equal(calls, 1);
    assert.equal(first[0].name, "en-US-Neural2-C");
    assert.equal(second.length, first.length);
  });
});

const memory = {};
globalThis.localStorage = {
  getItem: (key) => (Object.hasOwn(memory, key) ? memory[key] : null),
  setItem: (key, value) => { memory[key] = String(value); },
  removeItem: (key) => { delete memory[key]; },
};

describe("mastery", () => {
  it("tracks weak tags and waits for eight attempts before 95%", () => {
    let store = {};
    for (let i = 0; i < 7; i += 1) store = recordAttempt("en", "exams", "look-forward-to", true, store);
    let stats = statsFor("en", "exams", store);
    assert.equal(stats.total, 7);
    assert.equal(stats.met, false);

    store = recordAttempt("en", "exams", "look-forward-to", false, store);
    stats = statsFor("en", "exams", store);
    assert.equal(stats.hits, 7);
    assert.equal(stats.total, 8);
    assert.equal(stats.weakTag, "look-forward-to");
    assert.equal(stats.met, false);
  });

  it("marks 19/20 as mastered and keeps only 40 rows", () => {
    let store = {};
    for (let i = 0; i < 19; i += 1) store = recordAttempt("en", "vocab", "work", true, store);
    store = recordAttempt("en", "vocab", "work", false, store);
    assert.equal(statsFor("en", "vocab", store).hits, 19);
    assert.equal(statsFor("en", "vocab", store).total, 20);
    assert.equal(statsFor("en", "vocab", store).met, true);
    assert.equal(statsFor("en", "vocab", store).weakTag, "");

    store = {};
    for (let i = 0; i < 18; i += 1) store = recordAttempt("en", "examples", "cafe", true, store);
    store = recordAttempt("en", "examples", "cafe", false, store);
    store = recordAttempt("en", "examples", "cafe", false, store);
    assert.equal(statsFor("en", "examples", store).met, false);
    assert.equal(statsFor("en", "examples", store).weakTag, "cafe");

    store = {};
    for (let i = 0; i < 41; i += 1) store = recordAttempt("en", "scenes", "cafe", i !== 20, store);
    assert.equal(store["en:scenes"].length, MASTERY_CAP);
    assert.equal(store["en:scenes"][0].correct, true);
  });
});

describe("quiz stay and similar items", () => {
  it("keeps the same exam item after a miss and picks a similar tag next", () => {
    const first = attachExamMeta(EXAMS.en.items.find((row) => row.tag === "look-forward-to"));
    const q = first.q;
    const store = recordAttempt("en", "exams", first.tag, false, {});
    assert.equal(first.q, q);
    assert.equal(quizAnswer(first), first.a);
    assert.ok(quizOptions(first).includes("to hearing") || quizOptions(first).includes("to seeing") || quizOptions(first).includes("to receiving"));
    assert.equal(statsFor("en", "exams", store).weakTag, "look-forward-to");

    const next = pickSimilar(EXAMS.en.items, [first.q], (row) => row.q, "look-forward-to");
    assert.equal(next.tag, "look-forward-to");
    assert.notEqual(next.q, first.q);
    const again = pickSimilar(EXAMS.en.items, [first.q, next.q, "I look forward _____ your reply."], (row) => row.q, "look-forward-to");
    assert.equal(again.tag, "look-forward-to");
    assert.notEqual(again.q, "I look forward _____ your reply.");
  });

  it("hides the vocab meaning until a quiz is attached", () => {
    const bank = [
      { word: "deadline", hint: "最後期限", tag: "work" },
      { word: "refund", hint: "退款", tag: "money" },
      { word: "commute", hint: "通勤", tag: "travel" },
      { word: "allergy", hint: "過敏", tag: "health" },
    ];
    const quiz = attachVocabQuiz(bank[0], bank);
    assert.equal(quizOptions(quiz).length, 4);
    assert.equal(quizOptions(quiz)[quizAnswer(quiz)], "最後期限");
    assert.match(quiz.why, /deadline/);
    assert.equal(MASTERY_MIN, 8);
  });

  it("accepts a letter or option text as the exam answer", () => {
    const byText = attachExamMeta({
      q: "I look forward _____ you.",
      options: ["to see", "to seeing", "seeing", "see"],
      a: "to seeing",
      tag: "look-forward-to",
    });
    assert.equal(examAnswerIndex(byText), 1);
    assert.equal(byText.a, 1);
    assert.equal(examAnswerIndex({ options: ["off", "on", "up"], a: "B" }), 1);
  });
});

describe("translate lookup", () => {
  const english = { code: "en", name: "English", speech: "en-US" };
  const chinese = { code: "zh", name: "中文", speech: "zh-TW" };

  it("pairs Chinese study with English and maps speech codes", () => {
    assert.equal(pairLang(chinese).code, "en");
    assert.equal(pairLang(english).code, "en");
    assert.equal(speechOf("zh"), "zh-TW");
    assert.equal(speechOf("ja"), "ja-JP");
    assert.equal(guessLang("期限"), "zh");
    assert.equal(guessLang("こんにちは"), "ja");
    assert.equal(UNLOCKS.some((row) => row.id === "translate" && row.xp === 0), true);
  });

  it("looks up local vocab in both directions and speaks the learning side", () => {
    const fromEn = lookupLocal("deadline", english);
    assert.equal(fromEn.query, "deadline");
    assert.equal(fromEn.query_lang, "en");
    assert.equal(fromEn.translation, "最後期限");
    assert.equal(fromEn.translation_lang, "zh");
    assert.match(fromEn.example, /deadline/i);
    const speakEn = spokenSide(fromEn, english);
    assert.equal(speakEn.code, "en");
    assert.equal(speakEn.text, "deadline");

    const fromZh = lookupLocal("最後期限", english);
    assert.equal(fromZh.translation, "deadline");
    assert.equal(fromZh.translation_lang, "en");
    const speakZh = spokenSide(fromZh, english);
    assert.equal(speakZh.text, "deadline");
    assert.equal(speakZh.code, "en");
    assert.deepEqual(lookupBeats("最後期限", "zh"), ["最後期限"]);
    assert.ok(lookupBeats("The deadline is tonight.", "en").length > 1);
  });

  it("parses model json and rejects empty lookups", () => {
    const parsed = parseTranslatePayload({
      query: "receipt",
      query_lang: "en",
      translation: "收據",
      translation_lang: "zh",
      example: "Could I have a receipt, please?",
      example_zh: "可以給我收據嗎？",
      why: "付錢後要收據。",
    }, english);
    assert.equal(parsed.query, "receipt");
    assert.equal(parsed.translation, "收據");
    assert.throws(() => parseTranslatePayload({ query: "x" }, english), /EMPTY_TRANSLATE/);
  });
});

describe("exam levels", () => {
  it("offers Bridge through C2 with IELTS 7.5+ and other boards", () => {
    assert.deepEqual(LEVELS.map((row) => row.id), ["Bridge", "A2", "B1", "B2", "C1", "C2"]);
    const c1 = levelById("C1");
    assert.equal(c1.cefr, "C1");
    assert.equal(c1.ielts, "7.0-8.0");
    assert.match(c1.ielts, /7\.0/);
    assert.equal(levelById("C2").ielts, "8.5-9.0");
    const bridge = levelById("Bridge");
    assert.equal(bridge.cefr, "A1");
    assert.equal(bridge.toeicBridge, "30-60");
    assert.match(levelOptionLabel(bridge), /TOEIC Bridge/);
    assert.match(levelOptionLabel(c1), /IELTS 7\.0-8\.0/);
    const enLine = levelEquivLine(c1, "en");
    assert.match(enLine, /IELTS 7\.0-8\.0/);
    assert.match(enLine, /TOEIC 945-990/);
    assert.match(enLine, /TOEFL 87-109/);
    assert.match(enLine, /Cambridge C1/);
    assert.match(enLine, /JLPT N1/);
    assert.match(enLine, /DELF\/DALF C1/);
    assert.match(enLine, /TOPIK 5-6/);
    assert.match(enLine, /DELE C1/);
    assert.match(enLine, /TOCFL 5/);
    const jaLine = levelEquivLine(c1, "ja");
    assert.ok(jaLine.indexOf("JLPT") < jaLine.indexOf("IELTS"));
  });

  it("filters fallback quizzes by level and asks C1 prompts for IELTS 7.5", () => {
    const bridge = examItemsFor("en", "Bridge");
    assert.ok(bridge.every((item) => itemLevel(item) === "Bridge"));
    assert.ok(bridge.some((item) => item.tag === "be-am"));
    const c1 = examItemsFor("en", "C1");
    assert.ok(c1.every((item) => itemLevel(item) === "C1"));
    assert.ok(c1.some((item) => item.tag === "subjunctive-insist"));
    const c2 = examItemsFor("en", "C2");
    assert.ok(c2.every((item) => itemLevel(item) === "C2"));
    const lang = { code: "en", name: "English", exam: "IELTS / TOEIC / TOEFL / Cambridge" };
    const prompt = examPrompt(lang, levelById("C1"));
    assert.match(prompt, /IELTS 7\.0-8\.0/);
    assert.match(prompt, /7\.5 or above/);
    assert.match(examStyleLine(levelById("Bridge"), lang), /TOEIC Bridge/);
    assert.equal(itemLevel({ tag: "look-forward-to" }), "B2");
  });
});
