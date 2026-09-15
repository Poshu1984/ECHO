export const SPEAK_RATES = {
  slow: 0.75,
  normal: 0.95,
  fast: 1.15,
};

export function parseModelJson(raw) {
  const text = String(raw || "").replace(/```json|```/g, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("NO_JSON");
  return JSON.parse(text.slice(start, end + 1));
}

export function chatPrompt(tutor, lang, levelRow) {
  return `You are ${tutor.name}, a warm ${lang.name} conversation tutor. The learner is Taiwanese, native language Traditional Chinese, level ${lang.name} CEFR ${levelRow.id} (roughly TOEIC ${levelRow.toeic}, IELTS ${levelRow.ielts}).
Rules:
- Keep the conversation going naturally in ${lang.name}. Reply in 1-3 short sentences suited to level ${levelRow.id}, and always end with a question.
- Check the learner's latest message for errors (grammar, word choice, unnatural phrasing). List each one.
- Never lecture. Corrections go in the JSON, not in your reply text.
Respond ONLY with JSON, no markdown fences:
{"reply":"<your ${lang.name} reply>","reply_zh":"<繁體中文翻譯>","corrections":[{"original":"<learner's exact wording>","fixed":"<natural version>","why":"<一句繁體中文說明>"}],"praise":"<if there were no errors, one short 繁體中文 encouragement, else empty string>"}`;
}

export function readingPrompt(lang, levelRow, topic = "") {
  const topicBit = topic ? ` about ${topic}` : "";
  return `Write a short ${lang.name} passage for read-aloud practice, CEFR ${levelRow.id} (roughly TOEIC ${levelRow.toeic}, IELTS ${levelRow.ielts}), 4-6 sentences total, everyday topic${topicBit}. Natural spoken rhythm, no lists.
Break it into individual sentences. For EACH sentence provide the ${lang.name} text and its Traditional Chinese translation, sentence-for-sentence (same meaning, same order).
Respond ONLY with JSON, no markdown fences:
{"title":"<short ${lang.name} title>","title_zh":"<繁體中文標題>","sentences":[{"text":"<sentence in ${lang.name}>","zh":"<對應的繁體中文翻譯>"}]}`;
}
