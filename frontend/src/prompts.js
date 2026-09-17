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
  const slice = text.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    const repaired = slice
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(repaired);
  }
}

export function toLlmMessages(msgs) {
  const history = (msgs || [])
    .map((m) => ({
      role: m.role === "me" || m.role === "user" ? "user" : "assistant",
      content: String(m.text || m.content || "").trim(),
    }))
    .filter((m) => m.content);
  const out = [];
  for (const m of history) {
    if (out.length && out[out.length - 1].role === m.role) {
      out[out.length - 1].content += `\n${m.content}`;
    } else {
      out.push({ ...m });
    }
  }
  if (out[0]?.role === "assistant") {
    out.unshift({ role: "user", content: "Hello. Let's start." });
  }
  return out;
}

export function chatPrompt(tutor, lang, levelRow) {
  return `You are ${tutor.name}, a warm ${lang.name} conversation tutor. The learner is Taiwanese, native language Traditional Chinese, level ${lang.name} CEFR ${levelRow.id} (roughly TOEIC ${levelRow.toeic}, IELTS ${levelRow.ielts}).
Rules:
- Reply in 1-2 short spoken ${lang.name} sentences at level ${levelRow.id}, then one short question. Keep it fast to say aloud.
- Check the learner's latest message for errors. List each one in JSON only.
- Never lecture. Corrections go in the JSON, not in your reply text.
Respond ONLY with JSON, no markdown fences:
{"reply":"<your ${lang.name} reply>","reply_zh":"<繁體中文翻譯>","corrections":[{"original":"<learner's exact wording>","fixed":"<natural version>","why":"<一句繁體中文說明>"}],"praise":"<if there were no errors, one short 繁體中文 encouragement, else empty string>"}`;
}

export function parseChatPayload(raw) {
  const parsed = parseModelJson(raw);
  const reply = String(parsed.reply || parsed.text || "").trim();
  if (!reply) throw new Error("EMPTY_REPLY");
  return {
    reply,
    reply_zh: parsed.reply_zh || parsed.native || "",
    corrections: Array.isArray(parsed.corrections) ? parsed.corrections : [],
    praise: parsed.praise || "",
  };
}

export function readingPrompt(lang, levelRow, topic = "") {
  const topicBit = topic ? ` about ${topic}` : "";
  return `Write a short ${lang.name} story passage for a read-along video, CEFR ${levelRow.id} (roughly TOEIC ${levelRow.toeic}, IELTS ${levelRow.ielts}), 4-6 sentences, everyday adult life${topicBit}. Cinematic but not gory. Natural spoken rhythm, no lists. Do not reuse a stock "night shift / corridor lights" passage.
Pick ONE scene mood from: rain, cafe, commute, market, office, night.
Break it into individual sentences. For EACH sentence provide the ${lang.name} text AND its Traditional Chinese translation on its own line (same meaning, same order). Every sentence must have zh.
Respond ONLY with JSON, no markdown fences:
{"title":"<short ${lang.name} title>","title_zh":"<繁體中文標題>","scene":"rain|cafe|commute|market|office|night","hook_zh":"<6-12字中文畫面標語>","sentences":[{"text":"<sentence in ${lang.name}>","zh":"<該句繁體中文翻譯>"}]}`;
}

function avoidLine(items) {
  const list = (items || []).filter(Boolean).slice(-16);
  if (!list.length) return "No previous items.";
  return `Do NOT repeat any of these: ${list.join(" | ")}`;
}

function focusLine(tag) {
  if (!tag) return "Pick a fresh everyday skill. Do not reuse the same wording.";
  return `This item MUST practice the same skill/topic as "${tag}", but use a NEW sentence. Do not copy previous wording.`;
}

export function vocabPrompt(lang, levelRow, avoid = [], focusTag = "") {
  return `Create ONE new ${lang.name} vocabulary item for an adult Taiwanese learner, CEFR ${levelRow.id} (TOEIC ${levelRow.toeic}, IELTS ${levelRow.ielts}). Everyday life, work, travel, food, or health. Not slang-heavy. Not the same word twice.
${avoidLine(avoid)}
${focusLine(focusTag)}
Respond ONLY with JSON, no markdown fences:
{"word":"<the ${lang.name} word or short phrase>","hint":"<繁體中文意思>","sentence":"<one natural ${lang.name} example sentence using the word>","sentence_zh":"<該句的繁體中文翻譯>","tag":"<short topic id like work|money|health|travel>","why":"<一句繁體中文，說明這個字何時用>"}`;
}

export function examplePrompt(lang, levelRow, avoid = [], focusTag = "") {
  return `Write ONE new natural ${lang.name} example sentence for an adult learner, CEFR ${levelRow.id} (TOEIC ${levelRow.toeic}, IELTS ${levelRow.ielts}). Spoken, useful, 8-18 words if the language uses spaces. Vary topic: cafe, office, commute, clinic, shopping, weekend.
${avoidLine(avoid)}
${focusLine(focusTag)}
Respond ONLY with JSON, no markdown fences:
{"sentence":"<${lang.name} sentence>","sentence_zh":"<繁體中文翻譯>","tag":"<short topic id>","why":"<一句繁體中文，說明這句何時用>"}`;
}

export function scenePrompt(lang, levelRow, avoid = [], focusTag = "") {
  return `Invent ONE new role-play scene for speaking practice in ${lang.name}, CEFR ${levelRow.id}. Adult daily life. Give a short title and a 1-2 sentence prompt that tells the learner what to say.
${avoidLine(avoid)}
${focusLine(focusTag)}
Respond ONLY with JSON, no markdown fences:
{"title":"<${lang.name} title>","title_zh":"<繁體中文標題>","prompt":"<what the learner should say, in ${lang.name}>","prompt_zh":"<繁體中文說明>","tag":"<short topic id>","why":"<一句繁體中文，說明這個情境要完成什麼>"}`;
}

export function examPrompt(lang, levelRow, avoid = [], focusTag = "") {
  return `Write ONE new multiple-choice grammar or usage item in ${lang.name} at CEFR ${levelRow.id} (TOEIC/IELTS-style if English). Exactly 4 options, one correct. Keep it classroom-clean.
${avoidLine(avoid)}
${focusLine(focusTag)}
Respond ONLY with JSON, no markdown fences:
{"q":"<question with a blank or short stem in ${lang.name}>","q_zh":"<題幹繁體中文>","options":["<a>","<b>","<c>","<d>"],"options_zh":["<a 中文>","<b 中文>","<c 中文>","<d 中文>"],"a":0,"tag":"<short skill id like look-forward-to>","why":"<一句繁體中文，說明為什麼這個選項正確、其他為什麼不行>"}`;
}

export function chatStartPrompt(tutor, lang, levelRow, avoid = []) {
  return `${chatPrompt(tutor, lang, levelRow)}
Open with a fresh greeting and a new everyday question. Do not reuse "Signal locked" or the same morning question every time.
${avoidLine(avoid)}`;
}
