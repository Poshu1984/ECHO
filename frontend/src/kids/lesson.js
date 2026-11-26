// Pure lesson logic for the kids' hiragana unit (no DOM, no storage).
import { HIRAGANA, HIRAGANA_ROWS, LOOKALIKES } from "./kana.js";

export const PROGRESS_VERSION = 1;
export const MODES = ["little", "advanced"];
const PASS_STARS = 2;
const QUIZ_MAX = 5;

export function emptyProgress() {
  return { v: PROGRESS_VERSION, mode: "little", stars: {}, kana: {} };
}

export function rowIndex(rowId) {
  return HIRAGANA_ROWS.findIndex((r) => r.id === rowId);
}

export function starsFor(correct, total) {
  if (!total) return 0;
  const ratio = correct / total;
  if (ratio >= 1) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
}

export function weakness(stat) {
  const ok = stat?.ok || 0;
  const miss = stat?.miss || 0;
  return (miss + 1) / (ok + 2);
}

export function isUnlocked(progress, rowId) {
  const i = rowIndex(rowId);
  if (i < 0) return false;
  if (i === 0) return true;
  const prev = HIRAGANA_ROWS[i - 1].id;
  return (progress?.stars?.[prev] || 0) >= PASS_STARS;
}

export function allDone(progress) {
  return HIRAGANA_ROWS.every((r) => (progress?.stars?.[r.id] || 0) >= PASS_STARS);
}

export function recordAnswer(progress, kana, ok) {
  if (!HIRAGANA[kana]) return progress;
  const prev = progress.kana[kana] || { ok: 0, miss: 0 };
  const next = ok ? { ...prev, ok: prev.ok + 1 } : { ...prev, miss: prev.miss + 1 };
  return { ...progress, kana: { ...progress.kana, [kana]: next } };
}

export function finishLesson(progress, rowId, correct, total) {
  if (rowIndex(rowId) < 0) return progress;
  const got = starsFor(correct, total);
  const best = Math.max(progress.stars[rowId] || 0, got);
  return { ...progress, stars: { ...progress.stars, [rowId]: best } };
}

// Kana the child may see as answers/distractors: this lesson plus every
// earlier lesson (earlier lessons are unlocked by definition).
export function learnedPool(rowId, _progress) {
  const i = rowIndex(rowId);
  if (i < 0) return [];
  return HIRAGANA_ROWS.slice(0, i + 1).flatMap((r) => r.kana);
}

function shuffle(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildChoices(target, pool, count, rng = Math.random, { lookalikes = false, prefer = [] } = {}) {
  const others = [...new Set(pool)].filter((k) => k !== target);
  const picked = [];
  const take = (list) => {
    for (const k of shuffle(list, rng)) {
      if (picked.length >= count - 1) return;
      if (others.includes(k) && !picked.includes(k)) picked.push(k);
    }
  };
  if (lookalikes) take(LOOKALIKES[target] || []);
  take(prefer);
  take(others);
  return shuffle([target, ...picked], rng);
}

export function buildQuiz(rowId, progress, mode = "little", rng = Math.random) {
  const i = rowIndex(rowId);
  if (i < 0) return [];
  const row = HIRAGANA_ROWS[i];
  const advanced = mode === "advanced";
  const count = advanced ? 3 : 2;
  const pool = advanced ? learnedPool(rowId, progress) : row.kana;
  const targets = shuffle(row.kana, rng).slice(0, QUIZ_MAX).map((k) => ({ target: k, review: false }));
  if (advanced && i > 0) {
    const earlier = HIRAGANA_ROWS.slice(0, i).flatMap((r) => r.kana);
    const weakest = [...earlier].sort((a, b) => weakness(progress?.kana?.[b]) - weakness(progress?.kana?.[a]))[0];
    targets.splice(Math.floor(rng() * (targets.length + 1)), 0, { target: weakest, review: true });
  }
  return targets.map((t) => ({
    ...t,
    choices: buildChoices(t.target, pool, count, rng, { lookalikes: advanced, prefer: row.kana }),
  }));
}
