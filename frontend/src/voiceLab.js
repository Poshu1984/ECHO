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

export const STORY_CHARS = 400;

export function sampleText(passage, sampleId = "story", langCode = "en") {
  const sentences = passage?.sentences || [];
  if (sampleId === "line") return sentences[0]?.text || "";
  const joiner = langCode === "zh" || langCode === "ja" ? "" : " ";
  return sentences.slice(0, 2).map((s) => s.text).join(joiner);
}

// Plain-language cost note: per 1,000 stories of about STORY_CHARS characters.
export function costPerThousandStories(pricePerM) {
  return Math.round(((STORY_CHARS * 1000) / 1e6) * pricePerM * 10) / 10;
}

export function monthlyCostLine() {
  const low = costPerThousandStories(WAVENET_PRICE_PER_M);
  const mid = costPerThousandStories(NEURAL2_PRICE_PER_M);
  const chirp = costPerThousandStories(CHIRP_PRICE_PER_M);
  const freeStories = Math.round(1e6 / STORY_CHARS);
  return `費用估算（每篇故事約 ${STORY_CHARS} 字）：每 1,000 篇故事，目前聲音約 US$${low}–${mid}，Chirp 3 HD 約 US$${chirp}。每月前 100 萬字免費，約 ${freeStories.toLocaleString("en-US")} 篇故事。`;
}
