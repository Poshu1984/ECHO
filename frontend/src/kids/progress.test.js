import test from "node:test";
import assert from "node:assert/strict";
import { KIDS_KEY, loadProgress, saveProgress, sanitize } from "./progress.js";
import { emptyProgress, finishLesson, recordAnswer } from "./lesson.js";

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m };
}

test("round-trips progress through storage", () => {
  const s = memoryStorage();
  let p = finishLesson(emptyProgress(), "a", 5, 5);
  p = recordAnswer(p, "あ", true);
  p = { ...p, mode: "advanced" };
  saveProgress(s, p);
  assert.deepEqual(loadProgress(s), p);
});

test("missing, corrupt or wrong-version data falls back to empty progress", () => {
  const s = memoryStorage();
  assert.deepEqual(loadProgress(s), emptyProgress());
  s.setItem(KIDS_KEY, "{not json");
  assert.deepEqual(loadProgress(s), emptyProgress());
  s.setItem(KIDS_KEY, JSON.stringify({ v: 99, stars: { a: 3 } }));
  assert.deepEqual(loadProgress(s), emptyProgress());
});

test("storage that throws never breaks the game", () => {
  const bad = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  assert.deepEqual(loadProgress(bad), emptyProgress());
  assert.doesNotThrow(() => saveProgress(bad, emptyProgress()));
  assert.deepEqual(loadProgress(null), emptyProgress());
});

test("sanitize drops unknown lessons/kana, clamps numbers and bad modes", () => {
  const clean = sanitize({
    v: 1,
    mode: "hacker",
    stars: { a: 9, k: -2, zz: 3, s: "2" },
    kana: { あ: { ok: 2.7, miss: -1 }, X: { ok: 1, miss: 1 }, い: "oops" },
    extra: "<script>",
  });
  assert.equal(clean.mode, "little");
  assert.deepEqual(clean.stars, { a: 3, k: 0 });
  assert.deepEqual(clean.kana, { あ: { ok: 2, miss: 0 } });
  assert.equal(clean.extra, undefined);
});

test("stored progress contains no personal fields", () => {
  const s = memoryStorage();
  saveProgress(s, { ...emptyProgress(), name: "小明", birthday: "2020-01-01" });
  const raw = JSON.parse(s.m.get(KIDS_KEY));
  assert.deepEqual(Object.keys(raw).sort(), ["kana", "mode", "stars", "v"]);
});
