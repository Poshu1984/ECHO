import { pickFresh } from "./vary.js";

export function makeChoices(correct, others, count = 4) {
  const answer = String(correct || "").trim();
  const unique = [];
  for (const raw of others || []) {
    const text = String(raw || "").trim();
    if (!text || text === answer || unique.includes(text)) continue;
    unique.push(text);
    if (unique.length >= count - 1) break;
  }
  const options = [answer, ...unique];
  for (let i = options.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { options, a: Math.max(0, options.indexOf(answer)) };
}

export function itemTag(item, fallback = "drill") {
  return String(item?.tag || fallback);
}

export function itemWhy(item) {
  return String(item?.why || item?.quiz?.why || "");
}

export function quizAnswer(item) {
  if (Number.isInteger(item?.a)) return item.a;
  if (Number.isInteger(item?.quiz?.a)) return item.quiz.a;
  return 0;
}

export function quizOptions(item) {
  if (Array.isArray(item?.options) && item.options.length) return item.options;
  return item?.quiz?.options || [];
}

export function quizGlosses(item) {
  if (Array.isArray(item?.options_zh) && item.options_zh.length) return item.options_zh;
  return item?.quiz?.options_zh || [];
}

export function pickSimilar(items, seenKeys, keyFn, tag) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return null;
  const tagged = tag ? list.filter((item) => itemTag(item) === tag) : [];
  const pool = tagged.length ? tagged : list;
  const seen = seenKeys || [];
  const unused = pool.filter((item) => !seen.includes(keyFn(item)));
  if (unused.length) return pickFresh(unused, [], keyFn);
  if (pool.length > 1 && seen.length) {
    const last = seen[seen.length - 1];
    const others = pool.filter((item) => keyFn(item) !== last);
    if (others.length) return pickFresh(others, [], keyFn);
  }
  return pickFresh(pool, seen, keyFn);
}

function fillWhy(item, why) {
  return item.why ? item : { ...item, why };
}

export function attachVocabQuiz(item, bank = []) {
  if (!item) return item;
  const quiz = makeChoices(item.hint, (bank || []).map((row) => row.hint));
  return fillWhy({
    ...item,
    tag: itemTag(item, item.word || "vocab"),
    quiz,
  }, item.why || `${item.word} 的意思是「${item.hint}」。`);
}

export function attachExampleQuiz(item, bank = []) {
  if (!item) return item;
  const quiz = makeChoices(item.sentence_zh, (bank || []).map((row) => row.sentence_zh));
  return fillWhy({
    ...item,
    tag: itemTag(item, "example"),
    quiz,
  }, item.why || `這句的意思是「${item.sentence_zh}」。`);
}

export function attachSceneQuiz(item, bank = []) {
  if (!item) return item;
  const quiz = makeChoices(item.prompt_zh, (bank || []).map((row) => row.prompt_zh));
  return fillWhy({
    ...item,
    tag: itemTag(item, item.title || "scene"),
    quiz,
  }, item.why || `這個情境要做的是：${item.prompt_zh}`);
}

export function examAnswerIndex(item) {
  const options = Array.isArray(item?.options) ? item.options : [];
  if (Number.isInteger(item?.a) && item.a >= 0 && item.a < options.length) return item.a;
  const asNumber = Number(item?.a);
  if (Number.isInteger(asNumber) && asNumber >= 0 && asNumber < options.length) return asNumber;
  const asText = String(item?.a ?? "").trim();
  const byText = options.findIndex((opt) => String(opt).trim() === asText);
  if (byText >= 0) return byText;
  if (/^[a-d]$/i.test(asText)) {
    const letter = asText.toLowerCase().charCodeAt(0) - 97;
    if (letter >= 0 && letter < options.length) return letter;
  }
  return -1;
}

export function attachExamMeta(item) {
  if (!item) return item;
  const a = examAnswerIndex(item);
  const correct = Array.isArray(item.options) && a >= 0 ? item.options[a] : "";
  return {
    ...item,
    a: a >= 0 ? a : 0,
    tag: itemTag(item, "exam"),
    why: item.why || (correct ? `正確答案是「${correct}」。` : ""),
  };
}
