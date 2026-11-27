// Kids mode · progress kept on this device only.
//
// Privacy by design: we store only which kana were practised and how many
// stars each row earned. No name, age, voice, photo or free text, and nothing
// is sent to the server. "Clear" removes it completely.
import { ALL_KANA, KANA_ROWS } from "./kidsHiragana.js";

export const KIDS_KEY = "echo-kids-ja-hiragana-v1";
const ROW_IDS = new Set(KANA_ROWS.map((row) => row.id));
const KANA_SET = new Set(ALL_KANA.map((k) => k.k));
const BAND_IDS = new Set(["little", "big"]);

export function emptyProgress() {
  return { v: 1, band: "", rows: {}, kana: {} };
}

function count(n) {
  const x = Math.floor(Number(n));
  return Number.isFinite(x) && x > 0 ? Math.min(x, 100000) : 0;
}

// Accept only the fields we write, so a corrupted or tampered entry can't
// break the screen or smuggle other data in.
export function sanitizeProgress(raw) {
  const out = emptyProgress();
  if (!raw || typeof raw !== "object") return out;
  if (BAND_IDS.has(raw.band)) out.band = raw.band;
  for (const [id, row] of Object.entries(raw.rows || {})) {
    if (!ROW_IDS.has(id) || !row || typeof row !== "object") continue;
    out.rows[id] = { stars: Math.min(3, count(row.stars)), plays: count(row.plays) };
  }
  for (const [k, stat] of Object.entries(raw.kana || {})) {
    if (!KANA_SET.has(k) || !stat || typeof stat !== "object") continue;
    out.kana[k] = { hit: count(stat.hit), miss: count(stat.miss) };
  }
  return out;
}

export function loadProgress(storage = globalThis.localStorage) {
  try {
    return sanitizeProgress(JSON.parse(storage?.getItem(KIDS_KEY) || "null"));
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress, storage = globalThis.localStorage) {
  try {
    storage?.setItem(KIDS_KEY, JSON.stringify(sanitizeProgress(progress)));
    return true;
  } catch {
    return false;
  }
}

export function clearProgress(storage = globalThis.localStorage) {
  try { storage?.removeItem(KIDS_KEY); } catch { /* ignore */ }
  return emptyProgress();
}

export function withBand(progress, band) {
  return sanitizeProgress({ ...progress, band });
}

// Fold one finished round into the saved progress. Stars keep the best result.
export function recordRound(progress, rowId, round, stars) {
  const next = sanitizeProgress(progress);
  const prev = next.rows[rowId] || { stars: 0, plays: 0 };
  next.rows[rowId] = { stars: Math.max(prev.stars, stars), plays: prev.plays + 1 };
  const seen = new Set(round.queue.slice(0, round.asked).map((q) => q.target));
  for (const k of seen) {
    const stat = next.kana[k] || { hit: 0, miss: 0 };
    if (round.missed.includes(k)) stat.miss += 1;
    else stat.hit += 1;
    next.kana[k] = stat;
  }
  return sanitizeProgress(next);
}

export function totalStars(progress) {
  return Object.values(progress?.rows || {}).reduce((sum, row) => sum + (row.stars || 0), 0);
}
