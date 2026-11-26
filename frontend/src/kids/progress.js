// Device-only storage for the kids' unit. Stores no personal data: only the
// mode, stars per lesson and right/wrong counts per kana.
import { HIRAGANA } from "./kana.js";
import { MODES, PROGRESS_VERSION, emptyProgress, rowIndex } from "./lesson.js";

export const KIDS_KEY = "echo-kids-hiragana-v1";

const count = (n) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

export function sanitize(raw) {
  const base = emptyProgress();
  if (!raw || typeof raw !== "object" || raw.v !== PROGRESS_VERSION) return base;
  const stars = {};
  for (const [id, n] of Object.entries(raw.stars || {})) {
    if (rowIndex(id) >= 0 && typeof n === "number") stars[id] = Math.min(3, count(n));
  }
  const kana = {};
  for (const [k, s] of Object.entries(raw.kana || {})) {
    if (HIRAGANA[k] && s && typeof s === "object") kana[k] = { ok: count(s.ok), miss: count(s.miss) };
  }
  return { v: PROGRESS_VERSION, mode: MODES.includes(raw.mode) ? raw.mode : "little", stars, kana };
}

export function loadProgress(storage) {
  try {
    const text = storage?.getItem(KIDS_KEY);
    return text ? sanitize(JSON.parse(text)) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(storage, progress) {
  try {
    storage?.setItem(KIDS_KEY, JSON.stringify(sanitize(progress)));
  } catch { /* private mode / blocked storage: keep playing without saving */ }
}
