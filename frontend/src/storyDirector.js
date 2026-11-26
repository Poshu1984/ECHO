// Pure "director" helpers for the story stage: who is talking, who the camera
// follows, which shot each line gets and the character's expression.
// Kept free of React so it can be unit-tested with node --test.

export const SHOTS = ["wide", "push", "pan", "a", "b", "fa", "fb"];
const NARRATION_CYCLE = ["push", "pan", "wide"];
const ROLES = new Set(["a", "b", "narrator"]);

// Quoted spans: "…" “…” «…» „…“ ‘…’ 「…」 『…』 ‹…›
const QUOTED = /"([^"]+)"|“([^”]+)”|«([^»]+)»|„([^“”]+)[“”]|‘([^’]+)’|「([^」]+)」|『([^』]+)』|‹([^›]+)›/g;
// A real line of speech has a space or punctuation inside (not a single
// scare-quoted word, not a book title like 『ノルウェイの森』を読んだ).
const SPOKEN = /[\s?!.,…。？！、，~]/;
const DASH_LINE = /^\s*[—–]\s*\S/;

// First-person narration follows the main character (A). Characters are
// not tied to a gender, so third-person pronouns are not used for casting;
// the story generator's "speaker" / "focus" fields carry that instead.
const FIRST = /\b(I|me|my|je|moi|yo|mi)\b|\bj'|私|僕|我|나는|내가|저는|제가/i;

function outsideQuotes(text) {
  return text.replace(QUOTED, " ");
}

export function isDialogue(text) {
  const t = String(text || "");
  if (DASH_LINE.test(t)) return true;
  for (const m of t.matchAll(QUOTED)) {
    const inner = m.slice(1).find(Boolean) || "";
    const startsLine = m.index === 0 || /^[「『]/.test(m[0]);
    if (inner.trim().length >= 2 && (SPOKEN.test(inner) || (startsLine && /^[「『]/.test(m[0]) && m.index === 0))) return true;
  }
  return false;
}

export function actorHint(text) {
  const t = outsideQuotes(String(text || ""));
  return FIRST.test(t) ? "a" : null;
}

export function moodOf(text) {
  const t = String(text || "");
  if (/[!！]/.test(t)) return "surprised";
  if (/[?？¿]/.test(t)) return "curious";
  return "neutral";
}

// One plan entry per sentence: { speaker, focus, shot, mood }.
// speaker = who talks (mouth moves); focus = who the camera follows.
export function directStory(passage) {
  const sentences = passage?.sentences || [];
  const plan = [];
  let lastTalker = null;
  let prevShot = null;
  sentences.forEach((s, i) => {
    const text = String(s?.text || "");
    const given = ROLES.has(s?.speaker) ? s.speaker : null;
    let speaker = "narrator";
    if (given) {
      speaker = given;
    } else if (isDialogue(text)) {
      speaker = lastTalker === "a" ? "b" : "a";
    }
    if (speaker !== "narrator") lastTalker = speaker;
    const givenFocus = s?.focus === "a" || s?.focus === "b" ? s.focus : null;
    const focus = speaker !== "narrator" ? speaker : (givenFocus || actorHint(text));
    let shot;
    if (speaker !== "narrator") shot = speaker;
    else if (focus) shot = `f${focus}`;
    else if (i === 0) shot = "wide";
    else {
      shot = NARRATION_CYCLE[(i - 1) % NARRATION_CYCLE.length];
      if (shot === prevShot) shot = NARRATION_CYCLE[i % NARRATION_CYCLE.length];
    }
    if (i === 0 && speaker === "narrator") shot = "wide";
    prevShot = shot;
    plan.push({ speaker, focus: focus || null, shot, mood: moodOf(text) });
  });
  return plan;
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
