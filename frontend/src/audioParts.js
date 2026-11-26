// Sentence-part audio: the passage is synthesized one sentence per clip
// (in parallel on the server), the clips are joined into one track, and each
// sentence's words are timed inside its own clip. Timing drift can no
// longer build up across sentences, even without word timepoints.
import { timesEstimated } from "./beats.js";

export const MAX_PARTS = 16;
const LEAD_IN = 0.06;

export { weightOf as tokenWeight } from "./beats.js";

export function segmentsFor(sentences, text, tokens) {
  const whole = [{ text, tokens }];
  const list = (sentences || []).filter((s) => String(s?.text || "").trim() && s.tokens?.length);
  if (!list.length) return whole;
  const flat = list.flatMap((s) => s.tokens);
  if (flat.length !== tokens.length || flat.some((t, i) => t !== tokens[i])) return whole;
  const per = Math.ceil(list.length / MAX_PARTS);
  const out = [];
  for (let i = 0; i < list.length; i += per) {
    const group = list.slice(i, i + per);
    out.push({ text: group.map((s) => s.text).join(" "), tokens: group.flatMap((s) => s.tokens) });
  }
  return out;
}

export function partsTotal(durations) {
  return durations.reduce((a, b) => a + b, 0);
}

export function timesFromParts(durations, segments) {
  const out = [];
  let offset = 0;
  segments.forEach((seg, i) => {
    const dur = Math.max(0.2, Number(durations[i]) || 0);
    const lead = Math.min(LEAD_IN, dur / 10);
    for (const t of timesEstimated(seg.tokens, dur - lead)) {
      out.push({ start: offset + lead + t.start, end: offset + lead + t.end });
    }
    offset += dur;
  });
  return out;
}
