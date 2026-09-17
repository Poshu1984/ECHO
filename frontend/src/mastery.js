const KEY = "echoo-mastery";
export const MASTERY_WINDOW = 20;
export const MASTERY_MIN = 8;
export const MASTERY_CAP = 40;
export const MASTERY_TARGET = 0.95;

function storeKey(lang, mode) {
  return `${lang || "en"}:${mode || "exams"}`;
}

export function emptyMastery() {
  return {};
}

export function loadMastery() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    return raw && typeof raw === "object" ? raw : emptyMastery();
  } catch {
    return emptyMastery();
  }
}

function saveMastery(store) {
  localStorage.setItem(KEY, JSON.stringify(store));
  return store;
}

export function recordAttempt(lang, mode, tag, correct, store = loadMastery()) {
  const key = storeKey(lang, mode);
  const rows = [...(store[key] || [])];
  rows.push({
    tag: String(tag || mode || "drill"),
    correct: Boolean(correct),
    at: Date.now(),
  });
  if (rows.length > MASTERY_CAP) rows.splice(0, rows.length - MASTERY_CAP);
  const next = { ...store, [key]: rows };
  return saveMastery(next);
}

export function statsFor(lang, mode, store = loadMastery()) {
  const all = store[storeKey(lang, mode)] || [];
  const rows = all.slice(-MASTERY_WINDOW);
  const total = rows.length;
  const hits = rows.filter((r) => r.correct).length;
  const rate = total ? hits / total : 0;
  const met = total >= MASTERY_MIN && rate >= MASTERY_TARGET;
  const byTag = {};
  for (const row of all) {
    const tag = row.tag || "other";
    if (!byTag[tag]) byTag[tag] = { hits: 0, total: 0, miss: 0, lastMiss: 0 };
    byTag[tag].total += 1;
    if (row.correct) byTag[tag].hits += 1;
    else {
      byTag[tag].miss += 1;
      byTag[tag].lastMiss = row.at || 0;
    }
  }
  const weakTags = Object.entries(byTag)
    .filter(([, s]) => s.miss > 0 && s.hits / s.total < MASTERY_TARGET)
    .sort((a, b) => (b[1].lastMiss - a[1].lastMiss) || (b[1].miss - a[1].miss))
    .map(([tag]) => tag);
  return {
    hits,
    total,
    rate,
    met,
    weakTag: met ? "" : (weakTags[0] || ""),
    weakTags: met ? [] : weakTags,
  };
}

export function weakTag(lang, mode, store = loadMastery()) {
  return statsFor(lang, mode, store).weakTag;
}
