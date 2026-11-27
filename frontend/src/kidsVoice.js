// Kids mode · sound for fixed content (kana and picture words).
//
// Never calls the server's TTS, so it costs nothing and needs no key:
//   1. a pre-recorded file listed in /kids/audio/ja/manifest.json, if one
//      exists (see scripts/build-kana-audio.mjs), otherwise
//   2. the device's own Japanese voice (speechSynthesis), otherwise
//   3. nothing: the screen still works and says the device has no voice.
import { ALL_KANA } from "./kidsHiragana.js";

export const AUDIO_BASE = "/kids/audio/ja/";

// File id for a kana and for its picture word. を is "wo" so it does not
// collide with お ("o").
export function kanaFileId(kana) {
  return kana.k === "を" ? "wo" : kana.r;
}

export function audioPlan() {
  return ALL_KANA.flatMap((kana) => {
    const id = kanaFileId(kana);
    return [
      { text: kana.k, file: `${id}.mp3` },
      { text: kana.word, file: `w-${id}.mp3` },
    ];
  });
}

// manifest: { files: { "<text>": "<file>.mp3" } }. Only plain file names
// from the plan are accepted.
export function fileFor(text, manifest) {
  const file = manifest?.files?.[text];
  if (typeof file !== "string" || !/^[a-z-]+\.mp3$/.test(file)) return "";
  return `${AUDIO_BASE}${file}`;
}

const JA_PREFERRED = /Kyoko|O-ren|Otoya|Google 日本語|Nanami|Haruka|Ayumi/i;

export function pickJaVoice(voices) {
  const ja = (voices || []).filter((v) => /^ja(-|_|$)/i.test(v?.lang || ""));
  return ja.find((v) => JA_PREFERRED.test(v.name || "")) || ja[0] || null;
}

export function pickZhVoice(voices) {
  const list = voices || [];
  return list.find((v) => /^zh[-_]TW/i.test(v?.lang || ""))
    || list.find((v) => /^zh/i.test(v?.lang || ""))
    || null;
}

let manifestPromise = null;
export function loadManifest(fetcher = globalThis.fetch) {
  if (!manifestPromise) {
    manifestPromise = Promise.resolve()
      .then(() => fetcher(`${AUDIO_BASE}manifest.json`, { cache: "force-cache" }))
      .then((res) => (res && res.ok ? res.json() : null))
      .catch(() => null);
  }
  return manifestPromise;
}

let player = null;
function synth() {
  return typeof window !== "undefined" ? window.speechSynthesis : null;
}

export function stopKidsVoice() {
  try { player?.pause(); } catch { /* ignore */ }
  player = null;
  try { synth()?.cancel(); } catch { /* ignore */ }
}

export function hasJaVoice() {
  return Boolean(pickJaVoice(synth()?.getVoices?.() || []));
}

function speakDevice(text, voice, lang, rate) {
  const s = synth();
  if (!s || typeof SpeechSynthesisUtterance === "undefined") return false;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  if (voice) u.voice = voice;
  s.cancel();
  s.speak(u);
  return true;
}

// Speak Japanese. Returns how it was played: "file" | "device" | "none".
export async function sayJa(text, { slow = false } = {}) {
  stopKidsVoice();
  const manifest = await loadManifest();
  const url = fileFor(text, manifest);
  if (url && typeof Audio !== "undefined") {
    try {
      const a = new Audio(url);
      a.playbackRate = slow ? 0.85 : 1;
      player = a;
      await a.play();
      return "file";
    } catch { /* fall through to device voice */ }
  }
  const voice = pickJaVoice(synth()?.getVoices?.() || []);
  if (!voice) return "none";
  return speakDevice(text, voice, "ja-JP", slow ? 0.6 : 0.8) ? "device" : "none";
}

// Short spoken instruction in Chinese for children who can't read yet.
export function sayZh(text) {
  const voice = pickZhVoice(synth()?.getVoices?.() || []);
  if (!voice) return "none";
  return speakDevice(text, voice, voice.lang || "zh-TW", 0.95) ? "device" : "none";
}
