import { LEARN_LANGS, VOCAB } from "./content.js";
import { beatsOf, isCjk } from "./beats.js";

const CODES = new Set(LEARN_LANGS.map((row) => row.code));

export function pairLang(learn) {
  if (!learn || learn.code === "zh") {
    return LEARN_LANGS.find((row) => row.code === "en") || LEARN_LANGS[0];
  }
  return learn;
}

export function speechOf(code) {
  return LEARN_LANGS.find((row) => row.code === code)?.speech || "en-US";
}

export function lookupBeats(text, code) {
  const s = String(text || "").trim();
  if (!s) return [];
  if (isCjk(code) && s.length <= 18 && !/[。！？!?，,]/.test(s)) return [s];
  return beatsOf(s, code);
}

export function codeOfSpeech(speech) {
  return LEARN_LANGS.find((row) => row.speech === speech)?.code || "";
}

export function guessLang(text) {
  const s = String(text || "");
  if (/[\u3040-\u30ff]/.test(s)) return "ja";
  if (/[\uac00-\ud7af]/.test(s)) return "ko";
  if (/[\u4e00-\u9fff]/.test(s)) return "zh";
  if (/[àâäéèêëïîôùûçœæ]/i.test(s)) return "fr";
  if (/[ñáéíóúü¿¡]/i.test(s)) return "es";
  return "en";
}

export function normalizeLang(code, text, fallback = "en") {
  if (CODES.has(code)) return code;
  const guessed = guessLang(text);
  if (CODES.has(guessed)) return guessed;
  return CODES.has(fallback) ? fallback : "en";
}

export function parseTranslatePayload(parsed, learn) {
  const raw = parsed && typeof parsed === "object" ? parsed : {};
  const query = String(raw.query || raw.word || "").trim();
  const translation = String(raw.translation || raw.hint || raw.meaning || "").trim();
  if (!query || !translation) throw new Error("EMPTY_TRANSLATE");
  const pair = pairLang(learn);
  const example = String(raw.example || raw.sentence || "").trim();
  return {
    query,
    query_lang: normalizeLang(raw.query_lang, query, pair.code),
    translation,
    translation_lang: normalizeLang(raw.translation_lang, translation, "zh"),
    reading: String(raw.reading || raw.kana || raw.pinyin || "").trim(),
    example,
    example_lang: normalizeLang(raw.example_lang, example, pair.code),
    example_zh: String(raw.example_zh || raw.sentence_zh || "").trim(),
    why: String(raw.why || "").trim(),
  };
}

export function lookupLocal(query, learn) {
  const q = String(query || "").trim();
  if (!q) return null;
  const pair = pairLang(learn);
  const order = [pair.code, "zh", "en"].filter((code, i, all) => all.indexOf(code) === i);
  const lower = q.toLowerCase();
  for (const code of order) {
    const bank = VOCAB[code] || [];
    const other = code === "zh" ? "en" : "zh";
    const byWord = bank.find((row) => String(row.word).toLowerCase() === lower);
    if (byWord) {
      return {
        query: byWord.word,
        query_lang: code,
        translation: byWord.hint,
        translation_lang: other,
        reading: "",
        example: byWord.sentence || "",
        example_lang: code,
        example_zh: byWord.sentence_zh || "",
        why: byWord.why || "",
      };
    }
    const byHint = bank.find((row) => String(row.hint).toLowerCase() === lower);
    if (byHint) {
      return {
        query: byHint.hint,
        query_lang: other,
        translation: byHint.word,
        translation_lang: code,
        reading: "",
        example: byHint.sentence || "",
        example_lang: code,
        example_zh: byHint.sentence_zh || "",
        why: byHint.why || "",
      };
    }
  }
  return null;
}

export function spokenSide(item, learn) {
  if (!item) return null;
  const pair = pairLang(learn);
  if (item.translation_lang === pair.code) {
    return { id: "translate-hit", text: item.translation, code: item.translation_lang };
  }
  if (item.query_lang === pair.code) {
    return { id: "translate-query", text: item.query, code: item.query_lang };
  }
  if (item.example && item.example_lang === pair.code) {
    return { id: "translate-ex", text: item.example, code: item.example_lang };
  }
  return { id: "translate-hit", text: item.translation, code: item.translation_lang };
}
