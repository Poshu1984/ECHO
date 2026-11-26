// Side-by-side ("A/B") listening between the current Google voices and
// Chirp 3: HD. Shadow mode only: nothing here changes what learners hear.
// Prices from https://cloud.google.com/text-to-speech/pricing (USD per 1M
// characters after the monthly free tier), checked 2026-11-26.
export const WAVENET_PRICE_PER_M = 4;
export const NEURAL2_PRICE_PER_M = 16;
export const CHIRP_PRICE_PER_M = 30;

// Locales used by LEARN_LANGS that Chirp 3: HD offers. Taiwanese Mandarin
// (cmn-TW) is not offered, so Chinese keeps its Taiwan-accent voices.
const CHIRP_LOCALES = new Set(["en-US", "ja-JP", "ko-KR", "fr-FR", "es-ES", "ru-RU"]);

const CHIRP_BY_TUTOR = {
  audrey: "Aoede",
  maya: "Zephyr",
  elena: "Sulafat",
  brad: "Charon",
  owen: "Orus",
  kai: "Puck",
};

export function chirpSupported(speech) {
  return CHIRP_LOCALES.has(String(speech || ""));
}

export function chirpVoiceFor(tutor, speech) {
  if (!chirpSupported(speech)) return null;
  const short = CHIRP_BY_TUTOR[tutor?.id] || (tutor?.gender === "m" ? "Charon" : "Aoede");
  return `${speech}-Chirp3-HD-${short}`;
}

// Request body for one A/B sample. Chirp 3: HD ignores SSML <mark>, so both
// sides use plain text to keep the comparison fair.
export function sampleRequest(text, voiceName, speech, speakingRate = 1) {
  return {
    input: { text },
    marks: false,
    voice: { languageCode: speech, name: voiceName },
    audioConfig: { audioEncoding: "MP3", speakingRate },
  };
}
