import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SHOTS, shotFor, speakerFor, mouthOpen, progressOf, sentenceIndexOf } from "./storyDirector.js";
import { CHIRP_PRICE_PER_M, NEURAL2_PRICE_PER_M, chirpVoiceFor, chirpSupported } from "./voiceLab.js";
import { TUTORS, LEARN_LANGS } from "./content.js";

describe("storyDirector shots", () => {
  it("opens on a wide establishing shot", () => {
    assert.equal(shotFor(0, { text: "The wipers dragged rain." }), "wide");
  });

  it("cuts to the speaker when a line is quoted dialogue", () => {
    assert.equal(shotFor(1, { text: "\"Where to?\" he asked." }), "a");
    assert.equal(shotFor(2, { text: "「どこまで？」" }), "b");
  });

  it("only uses known shots and stays deterministic", () => {
    for (let i = 0; i < 20; i += 1) {
      const s = shotFor(i, { text: `line ${i}` });
      assert.ok(SHOTS.includes(s), s);
      assert.equal(s, shotFor(i, { text: `line ${i}` }));
    }
  });

  it("does not repeat the same shot on back-to-back narration lines", () => {
    for (let i = 1; i < 12; i += 1) {
      assert.notEqual(shotFor(i, { text: "n" }), shotFor(i - 1, { text: "n" }));
    }
  });
});

describe("storyDirector speaker", () => {
  it("treats unquoted lines as narration", () => {
    assert.equal(speakerFor(0, { text: "She paid by card." }), "narrator");
    assert.equal(speakerFor(3, null), "narrator");
  });

  it("alternates characters on quoted lines across scripts", () => {
    assert.equal(speakerFor(1, { text: "“Hello,” she said." }), "a");
    assert.equal(speakerFor(2, { text: "« Bonjour » dit-il." }), "b");
    assert.equal(speakerFor(4, { text: "„Hola“" }), "b");
    assert.equal(speakerFor(5, { text: "『안녕』" }), "a");
  });
});

describe("storyDirector mouth and progress", () => {
  it("keeps the mouth closed when nothing is playing", () => {
    assert.equal(mouthOpen(false, 3), false);
    assert.equal(mouthOpen(true, -1), false);
  });

  it("flaps the mouth as the highlighted word moves", () => {
    assert.notEqual(mouthOpen(true, 2), mouthOpen(true, 3));
  });

  it("clamps progress between 0 and 1", () => {
    assert.equal(progressOf(5, 10), 0.5);
    assert.equal(progressOf(20, 10), 1);
    assert.equal(progressOf(-1, 10), 0);
    assert.equal(progressOf(3, 0), 0);
    assert.equal(progressOf(Number.NaN, 10), 0);
  });

  it("maps a global word index to its sentence", () => {
    const passage = { sentences: [{ tokens: ["a", "b"] }, { tokens: ["c", "d", "e"] }, { tokens: ["f"] }] };
    assert.equal(sentenceIndexOf(passage, -1), 0);
    assert.equal(sentenceIndexOf(passage, 0), 0);
    assert.equal(sentenceIndexOf(passage, 2), 1);
    assert.equal(sentenceIndexOf(passage, 5), 2);
    assert.equal(sentenceIndexOf(passage, 99), 2);
    assert.equal(sentenceIndexOf({ sentences: [] }, 3), 0);
  });
});

describe("voiceLab (A/B listening, admin only)", () => {
  it("has a Chirp 3 HD voice for every tutor in every language that Google offers it", () => {
    for (const tutor of TUTORS) {
      for (const lang of LEARN_LANGS) {
        const name = chirpVoiceFor(tutor, lang.speech);
        if (!chirpSupported(lang.speech)) {
          assert.equal(name, null, `${lang.speech} should stay on the current voice`);
          continue;
        }
        assert.match(name, new RegExp(`^${lang.speech}-Chirp3-HD-[A-Z][a-z]+$`));
      }
    }
  });

  it("keeps Taiwanese Mandarin on the current voices", () => {
    assert.equal(chirpSupported("zh-TW"), false);
    assert.equal(chirpVoiceFor(TUTORS[0], "zh-TW"), null);
  });

  it("keeps tutor gender when mapping to Chirp voices", () => {
    const female = new Set(["Aoede", "Zephyr", "Sulafat", "Kore", "Leda"]);
    for (const tutor of TUTORS) {
      const short = chirpVoiceFor(tutor, "en-US").split("-").pop();
      assert.equal(female.has(short), tutor.gender === "f", tutor.id);
    }
  });

  it("states published prices so the cost note stays honest", () => {
    assert.equal(CHIRP_PRICE_PER_M, 30);
    assert.equal(NEURAL2_PRICE_PER_M, 16);
  });
});
