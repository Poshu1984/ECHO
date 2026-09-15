export function pickFresh(items, seenKeys, keyFn) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return null;
  const seen = new Set(seenKeys || []);
  const unused = list.filter((item) => !seen.has(keyFn(item)));
  const pool = unused.length ? unused : list;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function rememberKey(seen, key, cap = 24) {
  const next = [...(seen || [])];
  if (key && !next.includes(key)) next.push(key);
  if (next.length > cap) next.splice(0, next.length - cap);
  return next;
}

export function asList(value) {
  if (Array.isArray(value)) return value;
  if (value) return [value];
  return [];
}
