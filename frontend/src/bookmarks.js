const KEY = "echoo-saves";

export function loadSaves() {
  try {
    const rows = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export function savePassage(passage) {
  if (!passage) return loadSaves();
  const rows = loadSaves().filter((p) => p.id !== passage.id);
  rows.unshift({
    id: passage.id,
    title: passage.title,
    title_zh: passage.title_zh,
    lang: passage.lang,
    level: passage.level,
    sentences: passage.sentences.map((s) => ({ text: s.text, zh: s.zh })),
    savedAt: Date.now(),
  });
  localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 40)));
  return rows;
}

export function removeSave(id) {
  const rows = loadSaves().filter((p) => p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(rows));
  return rows;
}

export function isSaved(id) {
  return loadSaves().some((p) => p.id === id);
}
