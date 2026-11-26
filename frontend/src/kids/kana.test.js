import test from "node:test";
import assert from "node:assert/strict";
import { HIRAGANA, HIRAGANA_ROWS, LOOKALIKES, rowOf } from "./kana.js";

const ALL = HIRAGANA_ROWS.flatMap((r) => r.kana);

test("46 basic hiragana in 10 gojūon rows, in order, no duplicates", () => {
  assert.equal(HIRAGANA_ROWS.length, 10);
  assert.equal(ALL.length, 46);
  assert.equal(new Set(ALL).size, 46);
  assert.equal(ALL.join(""),
    "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん");
  assert.deepEqual(HIRAGANA_ROWS.map((r) => r.id), ["a", "k", "s", "t", "n", "h", "m", "y", "r", "w"]);
});

test("every kana has complete, consistent teaching data", () => {
  for (const k of ALL) {
    const d = HIRAGANA[k];
    assert.ok(d, `missing ${k}`);
    assert.equal(d.kana, k);
    assert.match(d.romaji, /^[a-z]+$/, k);
    assert.equal(rowOf(k)?.id, d.row, k);
    assert.ok(d.word.length >= 1, k);
    assert.equal([...d.word][d.at], k, `${k}: highlighted position must be the kana itself in ${d.word}`);
    assert.match(d.word, /^[ぁ-ゟ\s]+$/, `${k}: example word must be hiragana only`);
    for (const f of ["emoji", "meaning_zh", "meaning_en", "tip_zh", "tip_en"]) assert.ok(d[f], `${k}.${f}`);
  }
  assert.equal(Object.keys(HIRAGANA).length, 46);
});

test("Hepburn romaji for the irregular kana", () => {
  const want = { し: "shi", ち: "chi", つ: "tsu", ふ: "fu", を: "o", ん: "n", ひ: "hi" };
  for (const [k, r] of Object.entries(want)) assert.equal(HIRAGANA[k].romaji, r, k);
});

test("example words start with their kana except the ones with no natural initial word", () => {
  const notInitial = ALL.filter((k) => HIRAGANA[k].at !== 0).sort();
  assert.deepEqual(notInitial, ["る", "を", "ん"].sort());
});

test("example emoji are unique so pictures never repeat", () => {
  const emoji = ALL.map((k) => HIRAGANA[k].emoji);
  assert.equal(new Set(emoji).size, emoji.length);
});

test("look-alike pairs are symmetric and only reference real kana", () => {
  for (const [k, list] of Object.entries(LOOKALIKES)) {
    assert.ok(HIRAGANA[k], k);
    for (const o of list) {
      assert.ok(HIRAGANA[o], o);
      assert.notEqual(o, k);
      assert.ok(LOOKALIKES[o]?.includes(k), `${o} should list ${k}`);
    }
  }
});

test("rowOf returns null for unknown input", () => {
  assert.equal(rowOf("ア"), null);
  assert.equal(rowOf(""), null);
});
