// On-device Japanese speech for the kids' unit. Uses the Web Speech API only:
// no cloud TTS, no quota, no API key, works offline when the device has a
// local Japanese voice. Prefers local voices so no text leaves the device.

const isJa = (v) => /^ja([-_]|$)/i.test(v?.lang || "");

export function pickJapaneseVoice(voices) {
  const ja = (voices || []).filter(isJa);
  return ja.find((v) => v.localService) || ja[0] || null;
}

function synth() {
  return typeof window !== "undefined" ? window.speechSynthesis : null;
}

export function speechAvailable() {
  return !!synth() && typeof window.SpeechSynthesisUtterance === "function";
}

export function hasJapaneseVoice() {
  const s = synth();
  return !!(s && pickJapaneseVoice(s.getVoices()));
}

export function onVoicesReady(cb) {
  const s = synth();
  if (!s) return () => {};
  s.addEventListener?.("voiceschanged", cb);
  return () => s.removeEventListener?.("voiceschanged", cb);
}

export function speakJa(text, { rate = 0.8 } = {}) {
  const s = synth();
  if (!s || !text || !speechAvailable()) return false;
  try {
    const u = new window.SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    u.rate = rate;
    const voice = pickJapaneseVoice(s.getVoices());
    if (voice) u.voice = voice;
    s.cancel();
    s.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function stopJa() {
  try { synth()?.cancel(); } catch { /* ignore */ }
}
