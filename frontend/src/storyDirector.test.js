import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SHOTS, directStory, genderHint, isDialogue, moodOf, mouthOpen, progressOf } from "./storyDirector.js";
import { CHIRP_PRICE_PER_M, NEURAL2_PRICE_PER_M, chirpVoiceFor, chirpSupported, costPerThousandStories, monthlyCostLine, sampleText } from "./voiceLab.js";
import { TUTORS, LEARN_LANGS, LEVELS, PASSAGES } from "./content.js";
import { readingPrompt } from "./prompts.js";

const p = (...texts) => ({ sentences: texts.map((t) => (typeof t === "string" ? { text: t } : t)) });

describe("isDialogue across scripts", () => {
  it("spots quoted speech", () => {
    for (const t of [
      "\"Where to?\" he asked.",
      "“Hello there,” she said.",
      "« Tu viens ? » demanda-t-elle.",
      "„Wohin gehst du?“",
      "‘Not today,’ he said.",
      "「どこまで行きますか？」",
      "「你要去哪裡？」她問。",
      "『안녕, 잘 지냈어?』",
      "—¿Adónde vas? —preguntó ella.",
    ]) assert.equal(isDialogue(t), true, t);
  });

  it("ignores contractions, scare quotes and titles", () => {
    for (const t of [
      "She didn't know what to say.",
      "He was a \"quiet\" stranger.",
      "昨日『ノルウェイの森』を読んだ。",
      "I read “Dune” last week.",
      "The wipers dragged rain across the glass.",
    ]) assert.equal(isDialogue(t), false, t);
  });
});

describe("directStory", () => {
  it("opens wide on narration and never returns unknown shots", () => {
    const plan = directStory(p("The street was wet.", "Lights passed by.", "A bus stopped.", "Rain kept falling."));
    assert.equal(plan[0].shot, "wide");
    for (const row of plan) assert.ok(SHOTS.includes(row.shot), row.shot);
    for (let i = 1; i < plan.length; i += 1) assert.notEqual(plan[i].shot, plan[i - 1].shot);
  });

  it("casts by pronoun: she -> A, he -> B", () => {
    const plan = directStory(p("“Where to?” she asked.", "“The airport,” he said."));
    assert.deepEqual(plan.map((r) => r.speaker), ["a", "b"]);
    assert.deepEqual(plan.map((r) => r.shot), ["a", "b"]);
  });

  it("alternates speakers across narration when no pronoun helps", () => {
    const plan = directStory(p("“Where to?”", "The car pulled away.", "“The airport.”"));
    assert.deepEqual(plan.map((r) => r.speaker), ["a", "narrator", "b"]);
  });

  it("follows a character on narration lines that mention them, without lip-sync", () => {
    const plan = directStory(p("The night was quiet.", "She reached for the door."));
    assert.equal(plan[1].speaker, "narrator");
    assert.equal(plan[1].focus, "a");
    assert.equal(plan[1].shot, "fa");
  });

  it("prefers an explicit speaker field from the story generator", () => {
    const plan = directStory(p({ text: "Okay.", speaker: "b" }, { text: "“Hi,” she said.", speaker: "narrator" }));
    assert.equal(plan[0].speaker, "b");
    assert.equal(plan[1].speaker, "narrator");
  });

  it("reads mood from punctuation", () => {
    assert.equal(moodOf("Wait!"), "surprised");
    assert.equal(moodOf("¿Qué?"), "curious");
    assert.equal(moodOf("Fine."), "neutral");
  });

  it("handles empty input", () => {
    assert.deepEqual(directStory(null), []);
    assert.deepEqual(directStory({ sentences: [] }), []);
  });

  it("ignores pronouns inside the quote when casting", () => {
    assert.equal(genderHint("“He is late,” she said."), "a");
  });

  it("gives every built-in multi-sentence story at least one character moment", () => {
    for (const [code, list] of Object.entries(PASSAGES)) {
      for (const story of (Array.isArray(list) ? list : [list])) {
        if ((story.sentences || []).length < 2) continue;
        const plan = directStory(story);
        assert.ok(plan.some((r) => r.focus || r.speaker !== "narrator"), `${code}: ${story.title}`);
      }
    }
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

describe("readingPrompt casting", () => {
  it("asks the model for dialogue and a speaker per sentence", () => {
    const text = readingPrompt(LEARN_LANGS[0], LEVELS[1]);
    assert.match(text, /"speaker"/);
    assert.match(text, /dialogue/);
  });
});

describe("voiceLab cost and samples", () => {
  it("prices 1,000 stories of 400 characters", () => {
    assert.equal(costPerThousandStories(30), 12);
    assert.equal(costPerThousandStories(16), 6.4);
    assert.match(monthlyCostLine(), /2,500/);
  });

  it("builds story and single-line samples", () => {
    const story = { sentences: [{ text: "A b." }, { text: "C d." }, { text: "E f." }] };
    assert.equal(sampleText(story, "story", "en"), "A b. C d.");
    assert.equal(sampleText(story, "line", "en"), "A b.");
    assert.equal(sampleText({ sentences: [{ text: "あ。" }, { text: "い。" }] }, "story", "ja"), "あ。い。");
    assert.equal(sampleText(null, "story"), "");
  });
});
