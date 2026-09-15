const CLASSIC_VOICE = /-(Neural2|Wavenet|Standard|News|Studio|Polyglot)-/;

/** Chirp 3 HD names like "Achernar" need a model field and fail on v1 synthesize. */
export function classicVoices(voices) {
  return (voices || []).filter((v) => CLASSIC_VOICE.test(v?.name || ""));
}

export function pickGoogleVoice(voices, tutor, speechLang) {
  const want = tutor?.gender === "m" ? "MALE" : "FEMALE";
  const list = classicVoices(voices);
  const prefer = tutor?.preferred || "";
  const token = prefer.split("-")[0];
  const lang = speechLang || "";
  const langOk = (v) => {
    const codes = v.languageCodes || [];
    if (codes.includes(lang)) return true;
    if (lang === "zh-TW" && codes.some((c) => c.startsWith("cmn-TW"))) return true;
    const prefix = lang.split("-")[0];
    return codes.some((c) => c === prefix || c.startsWith(`${prefix}-`));
  };
  return (
    list.find((v) => v.ssmlGender === want && prefer && v.name.includes(prefer) && langOk(v))
    || list.find((v) => v.ssmlGender === want && token && v.name.includes(token) && langOk(v))
    || list.find((v) => v.ssmlGender === want && langOk(v))
    || list.find((v) => langOk(v))
    || list.find((v) => v.ssmlGender === want)
    || list[0]
    || null
  );
}

const SILENT_WAV = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

let armed = false;

export function armAudio() {
  try { window.speechSynthesis?.resume?.(); } catch { /* ignore */ }
  if (armed) return;
  try {
    const a = new Audio(SILENT_WAV);
    a.volume = 0.001;
    const p = a.play();
    if (p && typeof p.then === "function") {
      p.then(() => { armed = true; a.pause(); }).catch(() => {});
    }
  } catch { /* ignore */ }
}

export function speakOnDevice(text, { lang, pitch }) {
  if (typeof window === "undefined" || !window.speechSynthesis || !text) return false;
  const speakNow = () => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang || "en-US";
    u.pitch = pitch ?? 1;
    const voices = window.speechSynthesis.getVoices() || [];
    const match = voices.find((v) => v.lang === u.lang)
      || voices.find((v) => v.lang?.startsWith(String(u.lang).split("-")[0]));
    if (match) u.voice = match;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };
  speakNow();
  if (!(window.speechSynthesis.getVoices() || []).length) {
    window.speechSynthesis.addEventListener("voiceschanged", speakNow, { once: true });
  }
  return true;
}
