#!/usr/bin/env node
// One-time recording of the kids hiragana sounds (46 kana + 46 picture words)
// into public/kids/audio/ja/, plus manifest.json. Run by the owner on a
// machine that has the Google TTS key in the environment; the app never
// calls TTS for this content afterwards, and works without these files
// (it falls back to the device's Japanese voice).
//
//   GOOGLE_TTS_API_KEY=... node scripts/build-kana-audio.mjs
//   KANA_VOICE=ja-JP-Neural2-B node scripts/build-kana-audio.mjs   # other voice
//
// The key is read from the environment only and is never printed or written.
import { mkdirSync, writeFileSync } from "node:fs";
import { audioPlan } from "../src/kidsVoice.js";

const key = process.env.GOOGLE_TTS_API_KEY || "";
const voices = [process.env.KANA_VOICE, "ja-JP-Chirp3-HD-Aoede", "ja-JP-Neural2-B"].filter(Boolean);
const out = new URL("../public/kids/audio/ja/", import.meta.url);

if (!key) {
  console.error("GOOGLE_TTS_API_KEY is not set. Nothing was recorded (the app keeps using the device voice).");
  process.exit(1);
}

async function synth(text) {
  let lastStatus = 0;
  for (const name of voices) {
    const res = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "ja-JP", name },
        audioConfig: { audioEncoding: "MP3", speakingRate: 0.9 },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return { audio: Buffer.from(data.audioContent, "base64"), voice: name };
    }
    lastStatus = res.status;
  }
  throw new Error(`TTS failed for "${text}" (HTTP ${lastStatus})`);
}

mkdirSync(out, { recursive: true });
const files = {};
let voiceUsed = "";
for (const row of audioPlan()) {
  const { audio, voice } = await synth(row.text);
  voiceUsed = voiceUsed || voice;
  writeFileSync(new URL(row.file, out), audio);
  files[row.text] = row.file;
  process.stdout.write(".");
}
writeFileSync(new URL("manifest.json", out), `${JSON.stringify({ voice: voiceUsed, files }, null, 2)}\n`);
console.log(`\nRecorded ${Object.keys(files).length} clips with ${voiceUsed}.`);
