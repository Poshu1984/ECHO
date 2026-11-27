import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { ALL_KANA, KANA_ROWS, KANA_TIPS, LOOKALIKES, kanaByChar, lookalikesOf } from "./kidsHiragana.js";
import { BANDS, answer, buildQuiz, currentOf, isUnlocked, learnedPool, optionsFor, reviewPicks, startRound, starsFor } from "./kidsQuiz.js";
import { KIDS_KEY, clearProgress, emptyProgress, loadProgress, recordRound, sanitizeProgress, saveProgress, totalStars, withBand } from "./kidsProgress.js";
import { audioPlan, fileFor, kanaFileId, pickJaVoice, pickZhVoice } from "./kidsVoice.js";
import { t } from "./i18n.js";

function seeded(seed = 7) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    map,
  };
}

const GOJUON = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";

describe("kids hiragana curriculum", () => {
  it("covers exactly the 46 basic hiragana in gojūon order", () => {
    assert.equal(ALL_KANA.length, 46);
    assert.equal(ALL_KANA.map((k) => k.k).join(""), GOJUON);
    assert.equal(new Set(ALL_KANA.map((k) => k.k)).size, 46);
    assert.equal(KANA_ROWS.length, 10);
  });

  it("uses modified Hepburn romaji for the irregular kana", () => {
    const r = (ch) => kanaByChar(ch).r;
    assert.equal(r("し"), "shi");
    assert.equal(r("ち"), "chi");
    assert.equal(r("つ"), "tsu");
    assert.equal(r("ふ"), "fu");
    assert.equal(r("ん"), "n");
    assert.equal(r("を"), "o");
  });

  it("gives every kana a picture word that really contains it at the marked spot", () => {
    for (const kana of ALL_KANA) {
      assert.ok(kana.word.length >= 1, kana.k);
      assert.equal([...kana.word][kana.at], kana.k, `${kana.k} in ${kana.word}`);
      assert.ok(kana.pic && kana.zh && kana.en, kana.k);
      assert.ok(/^[ぁ-ゖー]+$/.test(kana.word), `${kana.word} is hiragana only`);
    }
  });

  it("never pretends ん starts a word", () => {
    assert.notEqual(kanaByChar("ん").at, 0);
  });

  it("keeps pronunciation tips and look-alikes inside the 46 kana", () => {
    for (const ch of Object.keys(KANA_TIPS)) {
      assert.ok(kanaByChar(ch), ch);
      assert.ok(KANA_TIPS[ch].zh && KANA_TIPS[ch].en, ch);
    }
    for (const pair of LOOKALIKES) {
      assert.equal(pair.length, 2);
      for (const ch of pair) assert.ok(kanaByChar(ch), ch);
    }
    assert.deepEqual(lookalikesOf("ぬ"), ["め"]);
  });
});

describe("kids quiz engine", () => {
  it("only draws options from kana the child has already met", () => {
    assert.deepEqual(learnedPool("a"), ["あ", "い", "う", "え", "お"]);
    const rng = seeded(3);
    for (let i = 0; i < 50; i += 1) {
      const opts = optionsFor("か", learnedPool("ka"), 3, rng);
      assert.equal(opts.length, 3);
      assert.ok(opts.includes("か"));
      assert.equal(new Set(opts).size, 3);
      for (const o of opts) assert.ok(learnedPool("ka").includes(o));
    }
  });

  it("prefers a learned look-alike as the distractor", () => {
    const pool = learnedPool("ma");
    for (let i = 0; i < 20; i += 1) {
      assert.deepEqual([...optionsFor("ぬ", pool, 2, seeded(i + 1))].sort(), ["ぬ", "め"].sort());
    }
    // め is not learned yet in row な, so the look-alike can't leak in early.
    const early = learnedPool("na");
    assert.ok(!early.includes("め"));
    for (let i = 0; i < 20; i += 1) assert.ok(!optionsFor("ぬ", early, 3, seeded(i + 1)).includes("め"));
  });

  it("uses 2 choices for 3–6 and 3 for 7–12", () => {
    const little = buildQuiz("ka", emptyProgress(), "little", seeded(1));
    const big = buildQuiz("ka", emptyProgress(), "big", seeded(1));
    assert.ok(little.every((q) => q.options.length === BANDS.little.choices));
    assert.ok(big.every((q) => q.options.length === BANDS.big.choices));
  });

  it("asks every kana of the row once, plus review from earlier rows", () => {
    const quiz = buildQuiz("sa", emptyProgress(), "big", seeded(2));
    const row = KANA_ROWS.find((r) => r.id === "sa").kana.map((k) => k.k);
    assert.deepEqual(quiz.slice(0, 5).map((q) => q.target).sort(), [...row].sort());
    assert.equal(quiz.length, 5 + BANDS.big.review);
    for (const q of quiz.slice(5)) assert.ok(!row.includes(q.target));
    assert.equal(buildQuiz("a", emptyProgress(), "big").length, 5, "first row has nothing to review");
  });

  it("reviews the kana the child misses most", () => {
    const progress = sanitizeProgress({ kana: { "お": { hit: 0, miss: 4 }, "あ": { hit: 5, miss: 0 } } });
    for (let i = 0; i < 10; i += 1) {
      assert.deepEqual(reviewPicks("ka", progress, 1, seeded(i + 1)), ["お"]);
    }
  });

  it("keeps the child on a question after a wrong tap and asks it again later", () => {
    let s = startRound([{ target: "あ", options: ["あ", "お"] }, { target: "い", options: ["い", "こ"] }]);
    let r = answer(s, "お");
    assert.equal(r.correct, false);
    s = r.state;
    assert.equal(currentOf(s).target, "あ");
    assert.deepEqual(s.wrongPicks, ["お"]);
    assert.equal(s.queue.length, 3);
    // Tapping the same wrong card again changes nothing.
    assert.equal(answer(s, "お").state, s);
    r = answer(s, "あ");
    assert.equal(r.correct, true);
    s = r.state;
    assert.equal(currentOf(s).target, "い");
    s = answer(s, "い").state;
    assert.equal(currentOf(s).target, "あ", "missed kana comes back at the end");
    s = answer(s, "あ").state;
    assert.equal(s.done, true);
    assert.equal(s.firstTry, 1);
    assert.equal(starsFor(s), 1);
  });

  it("requeues a missed kana only once", () => {
    let s = startRound([{ target: "う", options: ["う", "ら", "え"] }]);
    s = answer(s, "ら").state;
    s = answer(s, "え").state;
    assert.equal(s.queue.length, 2);
    s = answer(s, "う").state;
    s = answer(s, "ら").state;
    assert.equal(s.queue.length, 2, "missing the retry again adds nothing more");
    s = answer(s, "う").state;
    assert.equal(s.done, true);
  });

  it("gives 3 stars for a clean round and always at least 1 for finishing", () => {
    let s = startRound(buildQuiz("a", emptyProgress(), "little", seeded(5)));
    while (!s.done) s = answer(s, currentOf(s).target).state;
    assert.equal(starsFor(s), 3);
    assert.equal(starsFor(startRound([])), 0);
  });

  it("unlocks rows in order", () => {
    const p = emptyProgress();
    assert.equal(isUnlocked("a", p), true);
    assert.equal(isUnlocked("ka", p), false);
    p.rows.a = { stars: 1, plays: 1 };
    assert.equal(isUnlocked("ka", p), true);
    assert.equal(isUnlocked("sa", p), false);
    assert.equal(isUnlocked("nope", p), false);
  });
});

describe("kids progress (device only)", () => {
  it("round-trips through storage and survives garbage", () => {
    const store = memoryStorage();
    assert.deepEqual(loadProgress(store), emptyProgress());
    store.setItem(KIDS_KEY, "{not json");
    assert.deepEqual(loadProgress(store), emptyProgress());
    const p = withBand(emptyProgress(), "big");
    assert.ok(saveProgress(p, store));
    assert.equal(loadProgress(store).band, "big");
    assert.deepEqual(clearProgress(store), emptyProgress());
    assert.equal(store.getItem(KIDS_KEY), null);
  });

  it("keeps only known fields (no names, no free text)", () => {
    const clean = sanitizeProgress({
      band: "little", name: "小明", age: 5,
      rows: { a: { stars: 9, plays: 2, note: "x" }, evil: { stars: 3 } },
      kana: { "あ": { hit: 2, miss: -1, extra: 1 }, "<script>": { hit: 1 } },
    });
    assert.deepEqual(clean, { v: 1, band: "little", rows: { a: { stars: 3, plays: 2 } }, kana: { "あ": { hit: 2, miss: 0 } } });
    assert.equal(sanitizeProgress({ band: "adult" }).band, "");
  });

  it("does not throw when storage is unavailable", () => {
    const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("full"); }, removeItem() { throw new Error("x"); } };
    assert.deepEqual(loadProgress(broken), emptyProgress());
    assert.equal(saveProgress(emptyProgress(), broken), false);
    assert.deepEqual(clearProgress(broken), emptyProgress());
  });

  it("records a round: best stars kept, misses counted", () => {
    let s = startRound([{ target: "あ", options: ["あ", "お"] }, { target: "い", options: ["い", "う"] }]);
    s = answer(s, "お").state;
    while (!s.done) s = answer(s, currentOf(s).target).state;
    let p = recordRound(emptyProgress(), "a", s, starsFor(s));
    assert.deepEqual(p.rows.a, { stars: 1, plays: 1 });
    assert.deepEqual(p.kana["あ"], { hit: 0, miss: 1 });
    assert.deepEqual(p.kana["い"], { hit: 1, miss: 0 });
    p = recordRound(p, "a", startRound([]), 0);
    assert.equal(p.rows.a.stars, 1, "a worse round never lowers stars");
    assert.equal(p.rows.a.plays, 2);
    assert.equal(totalStars({ rows: { a: { stars: 2 }, ka: { stars: 3 } } }), 5);
  });
});

describe("kids audio (no server TTS)", () => {
  it("plans one file per kana and per picture word, with unique names", () => {
    const plan = audioPlan();
    assert.equal(plan.length, 92);
    assert.equal(new Set(plan.map((x) => x.file)).size, 92);
    assert.equal(kanaFileId(kanaByChar("を")), "wo");
    assert.equal(kanaFileId(kanaByChar("お")), "o");
    for (const row of plan) assert.match(row.file, /^[a-z-]+\.mp3$/);
  });

  it("only plays plain file names from the manifest", () => {
    const manifest = { files: { "あ": "a.mp3", "い": "../../evil.mp3", "う": "https://x.test/u.mp3", "え": 3 } };
    assert.equal(fileFor("あ", manifest), "/kids/audio/ja/a.mp3");
    assert.equal(fileFor("い", manifest), "");
    assert.equal(fileFor("う", manifest), "");
    assert.equal(fileFor("え", manifest), "");
    assert.equal(fileFor("お", null), "");
  });

  it("picks a Japanese device voice, else none", () => {
    assert.equal(pickJaVoice([{ name: "Samantha", lang: "en-US" }, { name: "Kyoko", lang: "ja-JP" }]).name, "Kyoko");
    assert.equal(pickJaVoice([{ name: "X", lang: "ja_JP" }]).name, "X");
    assert.equal(pickJaVoice([{ name: "Samantha", lang: "en-US" }]), null);
    assert.equal(pickZhVoice([{ name: "Mei-Jia", lang: "zh-TW" }, { name: "Ting", lang: "zh-CN" }]).name, "Mei-Jia");
    assert.equal(pickZhVoice([]), null);
  });

  it("ships no recordings yet but a valid manifest path is optional", () => {
    // The app must work without any recordings (device voice fallback).
    const dir = new URL("../public/kids/audio/ja/manifest.json", import.meta.url);
    if (existsSync(dir)) {
      const manifest = JSON.parse(readFileSync(dir, "utf8"));
      for (const file of Object.values(manifest.files || {})) assert.match(file, /^[a-z-]+\.mp3$/);
    }
  });
});

describe("kids UI text", () => {
  it("has Chinese and English labels for the kids screens", () => {
    for (const key of ["kidsEntry", "kidsTitle", "kidsExitHold", "kidsBandLittle", "kidsBandBig", "kidsLearn", "kidsQuiz", "kidsListenPick", "kidsGreat", "kidsTryAgain", "kidsNoVoice", "kidsParent", "kidsClear", "kidsLocked", "kidsRoundDone", "kidsPrivacy"]) {
      assert.notEqual(t("zh", key), key, `zh ${key}`);
      assert.notEqual(t("en", key), key, `en ${key}`);
      assert.notEqual(t("en", key), t("zh", key), `en ${key} translated`);
    }
  });
});
