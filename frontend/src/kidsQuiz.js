// Kids mode · adaptive listen-and-pick quiz engine (pure functions, no DOM).
import { KANA_ROWS, lookalikesOf, rowById } from "./kidsHiragana.js";

// Age bands. 3–6: two big choices, no romaji, audio-first. 7–12: three
// choices, romaji shown after answering, a little more review.
export const BANDS = {
  little: { id: "little", choices: 2, review: 1, romaji: false },
  big: { id: "big", choices: 3, review: 2, romaji: true },
};

export function bandOf(id) {
  return BANDS[id] || BANDS.little;
}

export function shuffle(list, rng = Math.random) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function rowIndex(rowId) {
  return KANA_ROWS.findIndex((row) => row.id === rowId);
}

// Kana the child has already met: this row plus every earlier row.
export function learnedPool(rowId) {
  const idx = rowIndex(rowId);
  if (idx < 0) return [];
  return KANA_ROWS.slice(0, idx + 1).flatMap((row) => row.kana.map((k) => k.k));
}

// Pick n distinct options that include the target. Look-alike kana the child
// has already learned come first (that is where real mistakes happen), then
// other kana from the same row, then any other learned kana.
export function optionsFor(target, pool, n, rng = Math.random) {
  const want = Math.max(2, n);
  const picked = [target];
  const add = (list) => {
    for (const ch of shuffle(list, rng)) {
      if (picked.length >= want) return;
      if (!picked.includes(ch) && pool.includes(ch)) picked.push(ch);
    }
  };
  add(lookalikesOf(target));
  const row = KANA_ROWS.find((r) => r.kana.some((k) => k.k === target));
  add(row ? row.kana.map((k) => k.k) : []);
  add(pool);
  return shuffle(picked, rng);
}

function accuracy(stat) {
  const total = (stat?.hit || 0) + (stat?.miss || 0);
  return total ? (stat.hit || 0) / total : 0;
}

// Review: kana from earlier rows the child gets wrong most often.
export function reviewPicks(rowId, progress, count, rng = Math.random) {
  const idx = rowIndex(rowId);
  if (idx <= 0 || count <= 0) return [];
  const earlier = KANA_ROWS.slice(0, idx).flatMap((row) => row.kana.map((k) => k.k));
  const stat = (k) => progress?.kana?.[k];
  const ranked = shuffle(earlier, rng).sort((a, b) => (
    accuracy(stat(a)) - accuracy(stat(b)) || (stat(b)?.miss || 0) - (stat(a)?.miss || 0)
  ));
  return ranked.slice(0, count);
}

export function buildQuiz(rowId, progress, bandId, rng = Math.random) {
  const row = rowById(rowId);
  if (!row) return [];
  const band = bandOf(bandId);
  const pool = learnedPool(rowId);
  const targets = [...shuffle(row.kana.map((k) => k.k), rng), ...reviewPicks(rowId, progress, band.review, rng)];
  return targets.map((target) => ({ target, options: optionsFor(target, pool, band.choices, rng) }));
}

export function startRound(questions) {
  return { queue: questions.slice(), at: 0, missed: [], firstTry: 0, asked: questions.length, wrongPicks: [], done: questions.length === 0 };
}

export function currentOf(state) {
  return state.done ? null : state.queue[state.at] || null;
}

// A wrong pick keeps the child on the same question (that option is greyed
// out) and schedules the kana once more at the end of the round.
export function answer(state, pick) {
  const q = currentOf(state);
  if (!q) return { state, correct: false };
  if (pick === q.target) {
    const firstTime = !state.missed.includes(q.target);
    const at = state.at + 1;
    return {
      correct: true,
      state: {
        ...state,
        at,
        wrongPicks: [],
        firstTry: state.firstTry + (firstTime && state.at < state.asked ? 1 : 0),
        done: at >= state.queue.length,
      },
    };
  }
  if (state.wrongPicks.includes(pick)) return { state, correct: false };
  const missed = state.missed.includes(q.target) ? state.missed : [...state.missed, q.target];
  // At most one extra copy per kana per round, so a round stays short.
  const already = state.queue.filter((x) => x.target === q.target).length >= 2;
  const queue = already ? state.queue : [...state.queue, { ...q, options: q.options.slice() }];
  return { correct: false, state: { ...state, queue, missed, wrongPicks: [...state.wrongPicks, pick] } };
}

export function starsFor(state) {
  if (!state.asked) return 0;
  const rate = state.firstTry / state.asked;
  if (rate >= 0.9) return 3;
  if (rate >= 0.6) return 2;
  return 1;
}

export function isUnlocked(rowId, progress) {
  const idx = rowIndex(rowId);
  if (idx === 0) return true;
  if (idx < 0) return false;
  return Boolean(progress?.rows?.[KANA_ROWS[idx - 1].id]?.stars);
}
