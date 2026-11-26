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

// Holds a reference so the browser does not garbage-collect a speaking utterance.
// eslint-disable-next-line no-unused-vars
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

function base64Bytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function mediaDuration(bytes) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
    const a = new Audio();
    const done = () => {
      const d = Number.isFinite(a.duration) ? a.duration : 0;
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
      resolve(d);
    };
    a.preload = "metadata";
    a.addEventListener("loadedmetadata", done, { once: true });
    a.addEventListener("error", done, { once: true });
    setTimeout(done, 3000);
    a.src = url;
  });
}

async function clipDuration(bytes) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      if (!audioCtx) audioCtx = new Ctx();
      const buf = await audioCtx.decodeAudioData(bytes.slice().buffer);
      if (buf?.duration > 0) return buf.duration;
    }
  } catch { /* fall back to the media element */ }
  return mediaDuration(bytes);
}

const MP3_BITRATES = {
  1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};
const MP3_RATES = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

// Strips a leading ID3v2 tag and the Xing/Info header frame from one MP3
// clip. Left in, the first clip's header would describe the whole joined
// track wrongly (duration and seek table), so seeking would land off.
export function mp3Body(bytes) {
  let at = 0;
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    const size = ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) | ((bytes[8] & 0x7f) << 7) | (bytes[9] & 0x7f);
    at = 10 + size + ((bytes[5] & 0x10) ? 10 : 0);
  }
  if (bytes[at] !== 0xff || (bytes[at + 1] & 0xe0) !== 0xe0) return bytes.subarray(at);
  const version = (bytes[at + 1] >> 3) & 0x03;
  const layer = (bytes[at + 1] >> 1) & 0x03;
  if (layer !== 1 || version === 1) return bytes.subarray(at);
  const kbps = MP3_BITRATES[version === 3 ? 1 : 2][(bytes[at + 2] >> 4) & 0x0f];
  const rate = (MP3_RATES[version] || [])[(bytes[at + 2] >> 2) & 0x03];
  const padding = (bytes[at + 2] >> 1) & 0x01;
  if (!kbps || !rate) return bytes.subarray(at);
  const frameLen = Math.floor(((version === 3 ? 144 : 72) * kbps * 1000) / rate) + padding;
  const head = String.fromCharCode(...bytes.subarray(at, Math.min(at + frameLen, bytes.length)));
  if (head.includes("Xing") || head.includes("Info")) return bytes.subarray(at + frameLen);
  return bytes.subarray(at);
}

// Joins per-sentence MP3 clips into one playable track and measures each
// clip, so the caller can time every sentence inside its own clip.
export async function joinCloudParts(base64Parts) {
  const raw = base64Parts.map(base64Bytes);
  const durations = await Promise.all(raw.map(clipDuration));
  const clips = raw.map(mp3Body);
  const total = clips.reduce((n, c) => n + c.length, 0);
  const joined = new Uint8Array(total);
  let at = 0;
  for (const c of clips) {
    joined.set(c, at);
    at += c.length;
  }
  if (lastBlobUrl) {
    try { URL.revokeObjectURL(lastBlobUrl); } catch { /* ignore */ }
  }
  const url = URL.createObjectURL(new Blob([joined], { type: "audio/mpeg" }));
  lastBlobUrl = url;
  const audio = markInline(new Audio());
  audio.preload = "auto";
  audio.src = url;
  return { audio, durations };
}
