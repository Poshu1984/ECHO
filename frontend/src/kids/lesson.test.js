import test from "node:test";
import assert from "node:assert/strict";
import { HIRAGANA_ROWS } from "./kana.js";
import {
  buildChoices, buildQuiz, emptyProgress, finishLesson, isUnlocked, learnedPool,
  recordAnswer, starsFor, weakness, allDone,
} from "./lesson.js";

function seeded(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

test("stars: 100% → 3, ≥60% → 2, otherwise 1 (and 0 questions → 0)", () => {
  assert.equal(starsFor(5, 5), 3);
  assert.equal(starsFor(4, 5), 2);
  assert.equal(starsFor(3, 5), 2);
  assert.equal(starsFor(2, 5), 1);
  assert.equal(starsFor(0, 5), 1);
  assert.equal(starsFor(2, 3), 2);
  assert.equal(starsFor(0, 0), 0);
});

test("weakness grows with mistakes and shrinks with correct answers", () => {
  assert.ok(weakness({ ok: 0, miss: 3 }) > weakness({ ok: 0, miss: 0 }));
  assert.ok(weakness({ ok: 5, miss: 0 }) < weakness({ ok: 0, miss: 0 }));
  assert.equal(weakness(undefined), weakness({ ok: 0, miss: 0 }));
});

test("only the first lesson is open at the start; ≥2 stars opens the next", () => {
  let p = emptyProgress();
  assert.equal(isUnlocked(p, "a"), true);
  assert.equal(isUnlocked(p, "k"), false);
  p = finishLesson(p, "a", 2, 5);
  assert.equal(p.stars.a, 1);
  assert.equal(isUnlocked(p, "k"), false);
  p = finishLesson(p, "a", 4, 5);
  assert.equal(p.stars.a, 2);
  assert.equal(isUnlocked(p, "k"), true);
  assert.equal(isUnlocked(p, "s"), false);
  assert.equal(isUnlocked(p, "nope"), false);
});

test("stars never go down after a worse retry", () => {
  let p = finishLesson(emptyProgress(), "a", 5, 5);
  p = finishLesson(p, "a", 0, 5);
  assert.equal(p.stars.a, 3);
});

test("finishLesson ignores unknown lessons and does not mutate input", () => {
  const p = emptyProgress();
  const same = finishLesson(p, "zz", 5, 5);
  assert.deepEqual(same, p);
  finishLesson(p, "a", 5, 5);
  assert.deepEqual(p.stars, {});
});

test("recordAnswer counts per kana and ignores unknown kana", () => {
  let p = recordAnswer(emptyProgress(), "あ", true);
  p = recordAnswer(p, "あ", false);
  p = recordAnswer(p, "あ", true);
  assert.deepEqual(p.kana["あ"], { ok: 2, miss: 1 });
  const q = recordAnswer(p, "X", true);
  assert.equal(q.kana.X, undefined);
});

test("choices: contain the answer once, unique, correct count, from the allowed pool", () => {
  const rng = seeded(7);
  for (let i = 0; i < 200; i += 1) {
    const pool = ["あ", "い", "う", "え", "お"];
    const c = buildChoices("う", pool, 3, rng);
    assert.equal(c.length, 3);
    assert.equal(new Set(c).size, 3);
    assert.equal(c.filter((x) => x === "う").length, 1);
    for (const x of c) assert.ok(pool.includes(x));
  }
});

test("choices: never more than the pool allows", () => {
  const c = buildChoices("わ", ["わ", "を"], 3, seeded(2));
  assert.deepEqual([...c].sort(), ["わ", "を"].sort());
});

test("choices: answer position is not always the same", () => {
  const rng = seeded(3);
  const pos = new Set();
  for (let i = 0; i < 50; i += 1) pos.add(buildChoices("あ", ["あ", "い", "う", "え", "お"], 3, rng).indexOf("あ"));
  assert.ok(pos.size >= 2);
});

test("choices: look-alikes are preferred as distractors when available", () => {
  const rng = seeded(4);
  const pool = HIRAGANA_ROWS.slice(0, 9).flatMap((r) => r.kana); // up to ら行
  for (let i = 0; i < 30; i += 1) {
    const c = buildChoices("ね", pool, 3, rng, { lookalikes: true });
    assert.ok(c.includes("れ"), `expected れ among ${c.join("")}`);
  }
});

test("little mode quiz: one question per kana in the lesson, 2 choices, only current lesson", () => {
  const p = finishLesson(emptyProgress(), "a", 5, 5);
  const q = buildQuiz("k", p, "little", seeded(5));
  assert.equal(q.length, 5);
  assert.deepEqual(q.map((x) => x.target).sort(), [..."かきくけこ"].sort());
  for (const item of q) {
    assert.equal(item.choices.length, 2);
    for (const c of item.choices) assert.ok("かきくけこ".includes(c));
  }
});

test("advanced quiz: adds one review question for the weakest earlier kana", () => {
  let p = finishLesson(emptyProgress(), "a", 5, 5);
  for (let i = 0; i < 4; i += 1) p = recordAnswer(p, "え", false);
  const q = buildQuiz("k", p, "advanced", seeded(6));
  assert.equal(q.length, 6);
  const review = q.filter((x) => x.review);
  assert.equal(review.length, 1);
  assert.equal(review[0].target, "え");
  for (const item of q) assert.equal(item.choices.length, 3);
});

test("advanced quiz on the first lesson has no review question", () => {
  const q = buildQuiz("a", emptyProgress(), "advanced", seeded(8));
  assert.equal(q.length, 5);
  assert.ok(q.every((x) => !x.review));
});

test("last lesson (わ行) has three questions", () => {
  const q = buildQuiz("w", emptyProgress(), "little", seeded(9));
  assert.equal(q.length, 3);
});

test("unknown lesson gives an empty quiz", () => {
  assert.deepEqual(buildQuiz("zz", emptyProgress(), "little"), []);
});

test("learnedPool = current lesson + earlier unlocked lessons", () => {
  const p = finishLesson(emptyProgress(), "a", 3, 5);
  const pool = learnedPool("k", p);
  assert.equal(pool.length, 10);
  assert.ok(pool.includes("あ") && pool.includes("こ"));
});

test("allDone only after every lesson has ≥2 stars", () => {
  let p = emptyProgress();
  for (const r of HIRAGANA_ROWS.slice(0, 9)) p = finishLesson(p, r.id, 5, 5);
  assert.equal(allDone(p), false);
  p = finishLesson(p, "w", 2, 3);
  assert.equal(allDone(p), true);
});
