import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { segmentsFor, timesFromParts, tokenWeight, partsTotal } from "./audioParts.js";
import { timesEstimated } from "./beats.js";

describe("tokenWeight", () => {
  it("gives sentence-ending punctuation a pause", () => {
    assert.ok(tokenWeight("end.") > tokenWeight("ends"));
    assert.ok(tokenWeight("おわり。") > tokenWeight("おわり"));
    assert.ok(tokenWeight("wait,") > tokenWeight("waits"));
    assert.ok(tokenWeight("a") >= 1);
  });
});

describe("timesEstimated with pauses", () => {
  it("still covers the whole clip in order", () => {
    const t = timesEstimated(["Hello,", "world.", "Again"], 3);
    assert.equal(t[0].start, 0);
    assert.ok(Math.abs(t[2].end - 3) < 1e-9);
    for (let i = 1; i < t.length; i += 1) assert.ok(t[i].start >= t[i - 1].start);
  });
});

describe("segmentsFor", () => {
  it("splits a passage by sentence with its tokens", () => {
    const sentences = [{ text: "One two.", tokens: ["One", "two."] }, { text: "Three.", tokens: ["Three."] }];
    assert.deepEqual(segmentsFor(sentences, "One two. Three.", ["One", "two.", "Three."]), [
      { text: "One two.", tokens: ["One", "two."] },
      { text: "Three.", tokens: ["Three."] },
    ]);
  });

  it("falls back to one segment when sentences do not match the tokens", () => {
    const tokens = ["Hi", "there."];
    assert.deepEqual(segmentsFor(null, "Hi there.", tokens), [{ text: "Hi there.", tokens }]);
    assert.deepEqual(segmentsFor([{ text: "Hi", tokens: ["Hi"] }], "Hi there.", tokens), [{ text: "Hi there.", tokens }]);
  });

  it("merges into at most 16 parts and skips empty sentences", () => {
    const sentences = Array.from({ length: 20 }, (_, i) => ({ text: `S${i}.`, tokens: [`S${i}.`] }));
    const tokens = sentences.flatMap((s) => s.tokens);
    const segs = segmentsFor(sentences, tokens.join(" "), tokens);
    assert.ok(segs.length <= 16);
    assert.deepEqual(segs.flatMap((s) => s.tokens), tokens);
  });
});

describe("timesFromParts", () => {
  it("pins every sentence to its own clip", () => {
    const segs = [{ tokens: ["One", "two."] }, { tokens: ["Three."] }];
    const t = timesFromParts([2, 1.5], segs);
    assert.equal(t.length, 3);
    assert.ok(t[0].start >= 0 && t[0].start < 0.1);
    assert.ok(Math.abs(t[1].end - 2) < 1e-9, "sentence 1 ends where clip 1 ends");
    assert.ok(Math.abs(t[2].start - 2) < 0.1, "sentence 2 starts with clip 2");
    assert.ok(Math.abs(t[2].end - 3.5) < 1e-9);
    assert.equal(partsTotal([2, 1.5]), 3.5);
  });
});

describe("mp3Body", () => {
  function frame(tag) {
    const f = new Uint8Array(144);
    f.set([0xff, 0xf3, 0x64, 0xc4]);
    if (tag) f.set(Array.from(tag, (c) => c.charCodeAt(0)), 21);
    return f;
  }
  const join = (...parts) => {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let at = 0;
    for (const p of parts) { out.set(p, at); at += p.length; }
    return out;
  };

  it("drops the ID3 tag and the Xing/Info frame, keeping audio frames", async () => {
    const { mp3Body } = await import("./tts.js");
    const id3 = new Uint8Array([0x49, 0x44, 0x33, 4, 0, 0, 0, 0, 0, 5, 1, 2, 3, 4, 5]);
    const audio = frame("");
    for (const tag of ["Xing", "Info"]) {
      const out = mp3Body(join(id3, frame(tag), audio));
      assert.equal(out.length, audio.length);
      assert.equal(out[0], 0xff);
    }
  });

  it("leaves clips without a header frame intact", async () => {
    const { mp3Body } = await import("./tts.js");
    const clip = join(frame(""), frame(""));
    assert.equal(mp3Body(clip).length, clip.length);
    const junk = new Uint8Array([1, 2, 3]);
    assert.equal(mp3Body(junk).length, 3);
  });
});
