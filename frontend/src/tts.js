const CLASSIC_VOICE = /-(Neural2|Wavenet|Standard)-/;
const TIERS = ["Neural2", "Wavenet", "Standard"];

export function classicVoices(voices) {
  const list = voices || [];
  const strict = list.filter((v) => CLASSIC_VOICE.test(v?.name || ""));
  return strict.length ? strict : list.filter((v) => !/Chirp/i.test(v?.name || ""));
}

export function pickGoogleVoice(voices, tutor, speechLang) {
  const want = tutor?.gender === "m" ? "MALE" : "FEMALE";
  const list = classicVoices(voices);
  const lang = speechLang || "";
  const langOk = (v) => {
    const codes = v.languageCodes || [];
    if (codes.includes(lang)) return true;
    if (lang === "zh-TW" && codes.some((c) => c.startsWith("cmn-TW") || c.startsWith("cmn-CN"))) return true;
    const prefix = lang.split("-")[0];
    return codes.some((c) => c === prefix || c.startsWith(`${prefix}-`));
  };
  const gendered = list.filter((v) => v.ssmlGender === want && langOk(v));
  const pool = gendered.length ? gendered : list.filter(langOk);
  const prefix = lang.split("-")[0] || "en";
  const preferred = tutor?.voices?.[prefix] || tutor?.preferred;
  if (preferred) {
    const hit = pool.find((v) => v.name === preferred)
      || pool.find((v) => v.name.endsWith(preferred) || v.name.includes(preferred));
    if (hit) return hit;
  }
  const neural = pool.filter((v) => /Neural2|Wavenet/.test(v.name));
  const same = (neural.length ? neural : pool).filter((v) => !want || v.ssmlGender === want || !v.ssmlGender);
  const idx = Number(tutor?.voiceIndex) || 0;
  if (same.length) return same[idx % same.length];
  for (const tier of TIERS) {
    const hit = pool.find((v) => v.name.includes(tier));
    if (hit) return hit;
  }
  return pool[0] || list.find((v) => v.ssmlGender === want) || list[0] || null;
}

const SILENT_WAV = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

let armed = false;
let audioCtx = null;
let lastBlobUrl = "";
const voiceMemo = new Map();

function markInline(audio) {
  if (!audio) return audio;
  try { audio.playsInline = true; } catch { /* ignore */ }
  try { audio.setAttribute?.("playsinline", "true"); } catch { /* ignore */ }
  try { audio.setAttribute?.("webkit-playsinline", "true"); } catch { /* ignore */ }
  return audio;
}

export function settleAudioRoute(ms = 180) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function armAudio() {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx && !audioCtx) audioCtx = new Ctx();
    if (audioCtx?.state === "suspended") audioCtx.resume();
  } catch { /* ignore */ }
  if (armed) return;
  try {
    const a = markInline(new Audio(SILENT_WAV));
    a.volume = 0.001;
    const p = a.play();
    if (p && typeof p.then === "function") {
      p.then(() => { armed = true; a.pause(); }).catch(() => {});
    }
  } catch { /* ignore */ }
}

export async function cachedVoices(languageCode, loader) {
  const key = languageCode || "*";
  const hit = voiceMemo.get(key);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.voices;
  const payload = await loader(languageCode);
  const voices = Array.isArray(payload?.voices) ? payload.voices : (Array.isArray(payload) ? payload : []);
  voiceMemo.set(key, { at: Date.now(), voices });
  return voices;
}

export function createCloudAudio(base64) {
  if (lastBlobUrl) {
    try { URL.revokeObjectURL(lastBlobUrl); } catch { /* ignore */ }
    lastBlobUrl = "";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
  lastBlobUrl = url;
  const audio = markInline(new Audio());
  audio.preload = "auto";
  audio.src = url;
  return audio;
}

export function listDeviceVoices(speechLang) {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  const all = window.speechSynthesis.getVoices() || [];
  const prefix = String(speechLang || "").split("-")[0];
  const matched = all.filter((v) => {
    const lang = v.lang || "";
    return lang === speechLang || lang.startsWith(`${prefix}-`) || lang === prefix;
  });
  return (matched.length ? matched : all).map((v) => ({
    name: v.name,
    lang: v.lang,
    gender: /female|woman|girl|samantha|victoria|kyoko|zira|heami|paulina/i.test(v.name)
      ? "f"
      : /male|man|david|mark|daniel|thomas|jorge/i.test(v.name)
        ? "m"
        : "",
  }));
}

export function pickDeviceVoice(speechLang, tutor, chosenName) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return { voice: null, substituted: false };
  }
  const all = window.speechSynthesis.getVoices() || [];
  const prefix = String(speechLang || "").split("-")[0];
  const langMatch = all.filter((v) => {
    const lang = v.lang || "";
    return lang === speechLang || lang.startsWith(`${prefix}-`) || lang === prefix;
  });
  const pool = langMatch.length ? langMatch : all;
  if (chosenName) {
    const named = pool.find((v) => v.name === chosenName) || all.find((v) => v.name === chosenName);
    if (named) return { voice: named, substituted: false };
  }
  const namedTutor = pool.find((v) => v.name.toLowerCase().includes((tutor?.name || "").toLowerCase()));
  if (namedTutor) return { voice: namedTutor, substituted: false };
  const wantF = tutor?.gender !== "m";
  const gendered = pool.filter((v) => {
    const female = /female|woman|girl|samantha|victoria|kyoko|zira|heami|paulina/i.test(v.name);
    const male = /male|man|david|mark|daniel|thomas|jorge/i.test(v.name);
    return wantF ? female && !male : male && !female;
  });
  if (gendered[0]) return { voice: gendered[0], substituted: false };
  if (pool[0]) return { voice: pool[0], substituted: true };
  return { voice: null, substituted: true };
}

let currentUtterance = null;

export function speakOnDevice(text, { lang, pitch, rate, voiceName, tutor }) {
  if (typeof window === "undefined" || !window.speechSynthesis || !text) return { ok: false, substituted: false };
  const speakNow = () => {
    const picked = pickDeviceVoice(lang, tutor, voiceName);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang || "en-US";
    u.pitch = pitch ?? 1;
    u.rate = rate ?? 1;
    if (picked.voice) u.voice = picked.voice;
    currentUtterance = u;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    return picked;
  };
  const first = speakNow();
  if (!(window.speechSynthesis.getVoices() || []).length) {
    window.speechSynthesis.addEventListener("voiceschanged", speakNow, { once: true });
  }
  return { ok: true, substituted: first.substituted };
}

export function stopDeviceSpeech() {
  currentUtterance = null;
  try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
}
