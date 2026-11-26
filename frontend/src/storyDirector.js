// Pure "director" helpers for the story stage: which camera shot each line
// gets, who is talking, and when the talking character's mouth is open.
// Kept free of React so it can be unit-tested with node --test.
import { beatsOf } from "./beats.js";

export const SHOTS = ["wide", "push", "pan", "a", "b"];
const NARRATION_CYCLE = ["push", "pan", "wide"];
const QUOTE = /["“”«»„「」『』‹›]/;

export function speakerFor(index, sentence) {
  const text = String(sentence?.text || "");
  if (!QUOTE.test(text)) return "narrator";
  return index % 2 === 1 ? "a" : "b";
}

export function shotFor(index, sentence) {
  const speaker = speakerFor(index, sentence);
  if (speaker !== "narrator") return speaker;
  if (index <= 0) return "wide";
  return NARRATION_CYCLE[(index - 1) % NARRATION_CYCLE.length];
}

export function mouthOpen(playing, highlight) {
  return Boolean(playing) && highlight >= 0 && highlight % 2 === 0;
}

export function progressOf(current, duration) {
  const c = Number(current);
  const d = Number(duration);
  if (!Number.isFinite(c) || !Number.isFinite(d) || d <= 0) return 0;
  return Math.max(0, Math.min(1, c / d));
}

export function sentenceIndexOf(passage, highlight, langCode = "en") {
  const sentences = passage?.sentences || [];
  if (!sentences.length || highlight < 0) return 0;
  let offset = 0;
  for (let i = 0; i < sentences.length; i += 1) {
    const s = sentences[i];
    const n = (s.tokens?.length ? s.tokens : beatsOf(s.text || "", langCode)).length;
    if (highlight < offset + n) return i;
    offset += n;
  }
  return sentences.length - 1;
}
