export function escapeXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function isCjk(code) {
  return code === "ja" || code === "zh";
}

export function beatsOf(text, code) {
  if (!text) return [];
  if (isCjk(code)) {
    const out = [];
    let buf = "";
    for (const ch of text) {
      buf += ch;
      if (/[、。！？!?，,.\n]/.test(ch) || buf.length >= 2) {
        out.push(buf);
        buf = "";
      }
    }
    if (buf) out.push(buf);
    return out;
  }
  return text.split(/(\s+)/).filter((x) => x.trim());
}

export function joinBeats(tokens, code) {
  return tokens.join(isCjk(code) ? "" : " ");
}

export function ssmlFromBeats(tokens, code) {
  const gap = isCjk(code) ? "" : " ";
  const body = tokens.map((tok, i) => `<mark name="t${i}"/>${escapeXml(tok)}${gap}`).join("");
  return `<speak>${body}</speak>`;
}

export function timesEstimated(tokens, duration) {
  const weights = tokens.map((t) => Math.max(1, Array.from(t).length));
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let t = 0;
  return weights.map((w) => {
    const start = t;
    t += (duration * w) / total;
    return { start, end: t };
  });
}

export function timesFromPoints(timepoints, tokens, duration) {
  if (!timepoints?.length) return timesEstimated(tokens, duration);
  const byName = new Map(timepoints.map((p) => [p.markName, Number(p.timeSeconds) || 0]));
  const starts = tokens.map((_, i) => (byName.has(`t${i}`) ? byName.get(`t${i}`) : null));
  let last = 0;
  for (let i = 0; i < starts.length; i++) {
    if (starts[i] == null) starts[i] = last;
    last = starts[i];
  }
  return starts.map((start, i) => ({
    start,
    end: i + 1 < starts.length ? starts[i + 1] : duration,
  }));
}

export function sentenceRange(sentences, sentenceIndex) {
  let start = 0;
  for (let i = 0; i < sentenceIndex; i++) start += sentences[i].tokens.length;
  const len = sentences[sentenceIndex]?.tokens.length || 0;
  return [start, start + Math.max(0, len - 1)];
}

export function nativeLangName(ui) {
  return {
    zh: "Traditional Chinese",
    en: "English",
    ja: "Japanese",
    ko: "Korean",
    fr: "French",
    es: "Spanish",
  }[ui] || "Traditional Chinese";
}
