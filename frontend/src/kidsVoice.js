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

// て and め are both a kana and a whole word, so they are recorded once.
export function audioPlan() {
  const seen = new Set();
  return ALL_KANA.flatMap((kana) => {
    const id = kanaFileId(kana);
    return [
      { text: kana.k, file: `${id}.mp3` },
      { text: kana.word, file: `w-${id}.mp3` },
    ];
  }).filter((row) => (seen.has(row.text) ? false : (seen.add(row.text), true)));
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

export async function hasRecordings() {
  const manifest = await loadManifest();
  return Boolean(manifest && Object.keys(manifest.files || {}).length);
}

let player = null;
let seq = 0;
function synth() {
  return typeof window !== "undefined" ? window.speechSynthesis : null;
}

export function stopKidsVoice() {
  seq += 1;
  try { player?.pause(); } catch { /* ignore */ }
  player = null;
  try { synth()?.cancel(); } catch { /* ignore */ }
}

export function hasJaVoice() {
  return Boolean(pickJaVoice(synth()?.getVoices?.() || []));
}

// eslint-disable-next-line no-unused-vars
let current = null; // keeps the utterance alive until it finishes
function speakDevice(text, voice, lang, rate, onEnd) {
  const s = synth();
  if (!s || typeof SpeechSynthesisUtterance === "undefined") return false;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  if (voice) u.voice = voice;
  if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
  current = u;
  s.cancel();
  s.speak(u);
  return true;
}

// Speak Japanese. Returns how it was played: "file" | "device" | "none".
export async function sayJa(text, { slow = false } = {}) {
  stopKidsVoice();
  const mine = seq;
  const manifest = await loadManifest();
  // A newer sound (or leaving the screen) started while we waited.
  if (mine !== seq) return "skipped";
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
// Resolves when it has finished (or after a few seconds at most), so the
// next sound does not cut it off.
export function sayZh(text, maxMs = 4000) {
  const voice = pickZhVoice(synth()?.getVoices?.() || []);
  if (!voice) return Promise.resolve("none");
  stopKidsVoice();
  return new Promise((resolve) => {
    let finished = false;
    const done = () => { if (!finished) { finished = true; resolve("device"); } };
    if (!speakDevice(text, voice, voice.lang || "zh-TW", 0.95, done)) { resolve("none"); return; }
    setTimeout(done, maxMs);
  });
}

// Tiny generated sound effects (no files, no network): a bright two-note
// chime for a right answer, one soft low note for "try again".
let fx = null;
export function chime(kind) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    fx = fx || new Ctx();
    if (fx.state === "suspended") fx.resume();
    const notes = kind === "ok" ? [[784, 0], [1047, 0.12]] : [[262, 0]];
    for (const [freq, at] of notes) {
      const o = fx.createOscillator();
      const g = fx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      const t0 = fx.currentTime + at;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(kind === "ok" ? 0.25 : 0.12, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
      o.connect(g).connect(fx.destination);
      o.start(t0);
      o.stop(t0 + 0.32);
    }
  } catch { /* sound effects are optional */ }
}
