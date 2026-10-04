import {
  EN_GRAMMAR, EN_VOCAB, IELTS_PASSAGES, JA_GRAMMAR, JA_VOCAB, KANA_ROWS, KANJI, PARTICLES, READINGS,
} from "./bank.js";

export const PLAN_START = "2026-10-04";
export const WEEK_MINUTES = 690;

export const PHASES = [
  {
    id: "n5",
    title: "第一階段：N5 與英文打底",
    start: "2026-10-04",
    end: "2026-12-06",
    exam: "2026-12-06 JLPT N5",
    split: { weekday: { ja: 60, en: 30 }, weekend: { ja: 75, en: 45 } },
    criteria: [
      "平假名與片假名 92 字能認、能默寫，小測正確率達 90%",
      "助詞 は・を・に・の・も 各能造 1 句，且說得出中文意思",
      "N5 單字累計至少 300，漢字至少 40，才維持 12 月報名",
      "11 月第三週的 N5 模考達到 48/180 以上，才把「通過」當正式目標",
      "英文高頻單字 +400，能寫出 80 字、有主題句的一段",
    ],
  },
  {
    id: "n4",
    title: "第二階段：N4 與英文 6.0",
    start: "2026-12-07",
    end: "2027-07-04",
    exam: "2027-07-04 JLPT N4；英文模考目標整體 6.0",
    split: { weekday: { ja: 50, en: 40 }, weekend: { ja: 70, en: 50 } },
    criteria: [
      "N5 假名維持 90% 以上，錯字在 48 小時內複習",
      "日文單字累計 1,500、漢字累計 300、N4 文法能量產短句",
      "N4 模考總分與各科門檻都過，才去考 2027-07-04",
      "英文閱讀能抓一篇文章的主旨；圖表作文寫得出約 150 字",
      "英文模考：聽力與閱讀各至少 6.0，口說至少 6.0，寫作至少 5.5",
    ],
  },
  {
    id: "bridge",
    title: "第三階段：英文 6.5，日文轉向 N3",
    start: "2027-07-05",
    end: "2027-11-30",
    exam: "2027 年 11 月雅思 Academic，正式目標 6.5",
    split: { weekday: { ja: 35, en: 55 }, weekend: { ja: 45, en: 75 } },
    criteria: [
      "模考整體 6.5，而且寫作至少 6.0，才報名這次雅思",
      "寫作低於 6.0 時，這次以 6.5 為上限，7.0 不提前",
      "日文每週仍保留聽讀，單字累計走向 2,500、漢字走向 450",
      "口說每週至少 2 次，每次先講 4 句再改",
    ],
  },
  {
    id: "n3",
    title: "第四階段：N3 與英文 7.0",
    start: "2027-12-01",
    end: "2028-07-02",
    exam: "2028-07-02 JLPT N3；英文 7.0 放在 2028 年上半年",
    split: { weekday: { ja: 45, en: 45 }, weekend: { ja: 60, en: 60 } },
    criteria: [
      "日文單字累計約 3,750、漢字約 650，N3 讀解能在時限內做完一篇",
      "N3 模考達標才報 2028-07；未達標就改期，不裸考",
      "英文寫作連續兩次模考都在 6.5 以上，才報 7.0",
      "閱讀能在時限內做完三篇；單字不夠的題先記進弱點，隔天複習",
    ],
  },
];

export const WEEK_ROWS = [
  { key: "mon", day: "一", theme: "假名列或單字，加英文高頻字", materials: "五十音表、字卡" },
  { key: "tue", day: "二", theme: "助詞與句型，加英文句子骨架", materials: "句型卡、because / however" },
  { key: "wed", day: "三", theme: "漢字或短文，加英文短文主旨", materials: "Irodori 入門、分級短文" },
  { key: "thu", day: "四", theme: "日文跟讀，加英文聽力", materials: "短句跟讀、一分鐘英文音檔" },
  { key: "fri", day: "五", theme: "日文造句，加英文段落", materials: "主題句＋理由＋例子" },
  { key: "sat", day: "六", theme: "錯題與間隔複習", materials: "弱點清單、昨天的句子" },
  { key: "sun", day: "日", theme: "小測，加英文口說", materials: "週考題、口說四句" },
];

const WEEK_INDEX = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };

export function isoDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso, days) {
  const t = Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) + days * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

export function daysBetween(from, to) {
  const a = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10));
  const b = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10));
  return Math.round((b - a) / 86400000);
}

export function weekday(iso) {
  return new Date(`${iso}T12:00:00Z`).getUTCDay();
}

export function weekStart(iso) {
  const day = weekday(iso);
  return addDays(iso, day === 0 ? -6 : 1 - day);
}

export function weekEnd(iso) {
  return addDays(weekStart(iso), 6);
}

export function phaseFor(iso) {
  return PHASES.find((phase) => iso >= phase.start && iso <= phase.end)
    || (iso < PHASES[0].start ? PHASES[0] : PHASES[PHASES.length - 1]);
}

export function plannedMinutes(iso) {
  const phase = phaseFor(iso);
  const weekend = weekday(iso) === 0 || weekday(iso) === 6;
  const split = weekend ? phase.split.weekend : phase.split.weekday;
  return { ja: split.ja, en: split.en, total: split.ja + split.en, weekend };
}

export function sumPlanned(from, to) {
  if (!from || !to || to < from) return 0;
  let total = 0;
  for (let iso = from; iso <= to; iso = addDays(iso, 1)) total += plannedMinutes(iso).total;
  return total;
}

export function weekGoal(iso) {
  const start = weekStart(iso) < PLAN_START ? PLAN_START : weekStart(iso);
  const end = weekEnd(iso);
  return sumPlanned(start, end);
}

export function expectedMinutes(iso) {
  const start = weekStart(iso) < PLAN_START ? PLAN_START : weekStart(iso);
  const end = addDays(iso, -1);
  return sumPlanned(start, end);
}

export function targetsFor(phaseId) {
  const table = {
    n5: { kana: 92, jaVocab: 800, jaGrammar: 40, kanji: 100, jaListen: 180, jaRead: 180, enVocab: 400, enGrammar: 8, enRead: 150, enListen: 120, enSpeak: 90, enWrite: 150 },
    n4: { kana: 92, jaVocab: 1500, jaGrammar: 80, kanji: 300, jaListen: 500, jaRead: 500, enVocab: 1200, enGrammar: 16, enRead: 500, enListen: 400, enSpeak: 300, enWrite: 450 },
    bridge: { kana: 92, jaVocab: 2500, jaGrammar: 110, kanji: 450, jaListen: 700, jaRead: 700, enVocab: 2000, enGrammar: 20, enRead: 800, enListen: 700, enSpeak: 500, enWrite: 700 },
    n3: { kana: 92, jaVocab: 3750, jaGrammar: 150, kanji: 650, jaListen: 1000, jaRead: 1100, enVocab: 3000, enGrammar: 24, enRead: 1100, enListen: 900, enSpeak: 700, enWrite: 1000 },
  };
  return table[phaseId] || table.n5;
}

export function weekPlan(iso) {
  const phase = phaseFor(iso);
  return WEEK_ROWS.map((row, index) => {
    const weekend = index >= 5;
    const split = weekend ? phase.split.weekend : phase.split.weekday;
    return { ...row, ja: split.ja, en: split.en, total: split.ja + split.en };
  });
}

export function normalizeAnswer(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "").replace(/[。．.！!？?、,，]/g, "");
}

export function answersMatch(item, given) {
  if (!item) return false;
  if (item.kind === "write") {
    const text = String(given || "").trim();
    const min = item.minChars || 20;
    const need = item.mustInclude || [];
    const lower = text.toLowerCase();
    return text.length >= min && need.every((word) => lower.includes(String(word).toLowerCase()));
  }
  if (item.choices) return String(given || "").trim() === item.answer;
  const got = normalizeAnswer(given);
  const options = item.accept || [item.answer];
  return options.some((option) => normalizeAnswer(option) === got);
}

function allocate(total, weights) {
  const sum = weights.reduce((acc, weight) => acc + weight, 0);
  const raw = weights.map((weight) => Math.floor((total * weight) / sum));
  let left = total - raw.reduce((acc, value) => acc + value, 0);
  for (let i = 0; left > 0; i += 1, left -= 1) raw[i % raw.length] += 1;
  return raw;
}

function at(list, seed) {
  return list[Math.abs(seed) % list.length];
}

function choiceSet(correct, pool, seed) {
  const others = [];
  for (let step = 0; others.length < 3 && step < pool.length * 2; step += 1) {
    const item = pool[(seed + step) % pool.length];
    if (item !== correct && !others.includes(item)) others.push(item);
  }
  const all = [correct, ...others].slice(0, 4);
  const shift = Math.abs(seed) % all.length;
  return all.slice(shift).concat(all.slice(0, shift));
}

function recorded(state, key) {
  if (state.counts && state.counts[key] != null) return Number(state.counts[key]) || 0;
  return (state.sessions || []).reduce((sum, session) => sum + (Number(session[key]) || 0), 0);
}

function kanaFocus(dayIndex, repair) {
  const row = KANA_ROWS[Math.abs(dayIndex) % KANA_ROWS.length];
  const count = repair ? Math.min(3, row.hira.length) : row.hira.length;
  return {
    row,
    romaji: row.romaji.slice(0, count),
    hira: row.hira.slice(0, count),
    kata: row.kata.slice(0, count),
  };
}

function scriptLine(focus) {
  return focus.romaji.map((roma, index) => `${focus.hira[index]} ${focus.kata[index]}（${roma}）`).join("、");
}

export function lessonFor(iso, state = {}) {
  const phase = phaseFor(iso);
  const plan = plannedMinutes(iso);
  const dayIndex = Math.max(0, daysBetween(PLAN_START, iso));
  const repair = state.pace === "repair" && (!state.repairUntil || iso <= state.repairUntil);
  const push = state.pace === "push" && !repair;
  const dow = weekday(iso);
  const rowMeta = WEEK_ROWS[WEEK_INDEX[dow]];
  const kana = kanaFocus(dayIndex, repair);
  const vocab = at(JA_VOCAB, dayIndex);
  const grammar = at(JA_GRAMMAR, dayIndex + 1);
  const kanji = at(KANJI, dayIndex);
  const extra = push ? at(JA_VOCAB, dayIndex + 3) : null;
  const word = at(EN_VOCAB, dayIndex);
  const enGrammar = at(EN_GRAMMAR, dayIndex);
  const kanaGate = recorded(state, "kana") < 74;
  const due = (state.weaknesses || []).filter((item) => item.nextReview && item.nextReview <= iso).slice(0, 1);

  const jaWeights = [15, 40, 25, 20];
  const enWeights = [20, 45, 25, 10];
  const jaTimes = allocate(plan.ja, jaWeights);
  const enTimes = allocate(plan.en, enWeights);

  const kanaAnswer = kana.hira.join("");
  const kanaPrompt = `看拼音，寫出平假名（不要空格）：${kana.romaji.join(" ")}`;
  const newTeach = kanaGate
    ? `${repair ? "你目前落後，今天新假名減量，先把這幾個寫對。\n" : ""}今天只學${kana.row.label}。\n${scriptLine(kana)}\n例句：${vocab.sentence}\n讀音：${vocab.sentenceReading}\n中文：${vocab.sentenceZh}`
    : `假名已過寫作門檻。今天改學單字與漢字。\n單字：${vocab.word}（${vocab.reading}）${vocab.zh}\n例句：${vocab.sentence}\n讀音：${vocab.sentenceReading}\n中文：${vocab.sentenceZh}\n漢字：${kanji.kanji}（${kanji.reading}）${kanji.zh}${extra ? `\n加練：${extra.word}（${extra.reading}）${extra.zh}` : ""}`;

  const blocks = [];
  if (due.length) {
    const item = due[0];
    blocks.push({
      id: "review",
      reviewId: item.id,
      title: "間隔複習",
      minutes: 0,
      side: "review",
      teach: `這題在${item.lastAt}錯過，今天到期。先寫答案，再看解釋。\n${item.stem}`,
      prompt: item.prompt || item.stem,
      accept: item.accept,
      answer: item.answer,
      choices: item.choices,
      kind: item.kind,
      mustInclude: item.mustInclude,
      minChars: item.minChars,
      why: item.why,
      model: item.model,
      modelReading: item.modelReading,
      modelZh: item.modelZh,
      requireOutput: true,
    });
  }

  blocks.push(
    {
      id: "ja-warm",
      title: "日文暖身",
      minutes: jaTimes[0],
      side: "ja",
      teach: `先寫出昨天的${kana.row.label}，不要看表。寫完再對。`,
      prompt: kanaPrompt,
      accept: [kanaAnswer, kana.hira.join(" ")],
      answer: kanaAnswer,
      why: `${kana.row.label}：${scriptLine(kana)}`,
      model: kanaAnswer,
      modelReading: kana.romaji.join(" "),
      modelZh: `${kana.row.label}的平假名`,
      requireOutput: true,
      gains: { jaListen: Math.min(5, jaTimes[0]) },
    },
    {
      id: "ja-new",
      title: "日文新內容",
      minutes: jaTimes[1],
      side: "ja",
      teach: newTeach,
      prompt: kanaGate ? kanaPrompt : `寫出這個單字的平假名讀音：${vocab.word}`,
      accept: kanaGate ? [kanaAnswer] : [vocab.reading],
      answer: kanaGate ? kanaAnswer : vocab.reading,
      why: kanaGate ? scriptLine(kana) : `${vocab.word}讀 ${vocab.reading}，意思是${vocab.zh}。`,
      model: kanaGate ? `${kana.hira.join("")}　${kana.kata.join("")}` : vocab.word,
      modelReading: kanaGate ? kana.romaji.join(" ") : vocab.reading,
      modelZh: kanaGate ? vocab.sentenceZh : vocab.zh,
      requireOutput: true,
      gains: { kana: kana.hira.length, jaVocab: kanaGate ? 0 : 1, kanji: kanaGate ? 0 : 1 },
    },
    {
      id: "ja-out",
      title: "日文輸出",
      minutes: jaTimes[2],
      side: "ja",
      teach: `句型：${grammar.name}（${grammar.reading}）\n${grammar.note}\n例句：${grammar.example}\n讀音：${grammar.exampleReading}\n中文：${grammar.exampleZh}`,
      prompt: `用「${grammar.name}」造一個新句子。可以先寫平假名。`,
      kind: "write",
      minChars: 4,
      mustInclude: [],
      why: grammar.note,
      model: grammar.example,
      modelReading: grammar.exampleReading,
      modelZh: grammar.exampleZh,
      requireOutput: true,
      gains: { jaGrammar: 1, jaWrite: jaTimes[2] },
    },
    {
      id: "ja-check",
      title: "日文小測",
      minutes: jaTimes[3],
      side: "ja",
      teach: `填助詞。${PARTICLES[dayIndex % PARTICLES.length].blank}\n讀音：${PARTICLES[dayIndex % PARTICLES.length].reading}\n中文：${PARTICLES[dayIndex % PARTICLES.length].zh}`,
      prompt: PARTICLES[dayIndex % PARTICLES.length].blank,
      answer: PARTICLES[dayIndex % PARTICLES.length].answer,
      choices: ["は", "を", "に", "の", "も"],
      why: PARTICLES[dayIndex % PARTICLES.length].why,
      model: PARTICLES[dayIndex % PARTICLES.length].answer,
      modelReading: PARTICLES[dayIndex % PARTICLES.length].reading,
      modelZh: PARTICLES[dayIndex % PARTICLES.length].zh,
      requireOutput: true,
    },
    {
      id: "en-warm",
      title: "英文暖身",
      minutes: enTimes[0],
      side: "en",
      teach: `複習：${word.word}＝${word.zh}\n例句：${word.example}\n中文：${word.exampleZh}`,
      prompt: `用英文寫出「${word.zh}」這個字。`,
      accept: [word.word],
      answer: word.word,
      why: `${word.word} 的意思是${word.zh}。`,
      model: word.example,
      modelZh: word.exampleZh,
      requireOutput: true,
    },
    {
      id: "en-new",
      title: "英文新內容",
      minutes: enTimes[1],
      side: "en",
      teach: `文法：${enGrammar.name}\n${enGrammar.zh}\n例句：${enGrammar.example}\n中文：${enGrammar.exampleZh}\n單字：${word.word}（${word.zh}）`,
      prompt: `用你的話寫出這個例句的中文意思，確認你看懂了：${enGrammar.example}`,
      kind: "write",
      minChars: 2,
      mustInclude: [],
      why: enGrammar.zh,
      model: enGrammar.example,
      modelZh: enGrammar.exampleZh,
      requireOutput: true,
      gains: { enVocab: 1, enGrammar: 1, enRead: Math.min(8, enTimes[1]) },
    },
    {
      id: "en-out",
      title: "英文輸出",
      minutes: enTimes[2],
      side: "en",
      teach: "先寫主題句，再用 because 給一個原因。不要只列單字。",
      prompt: dow === 0
        ? "用英文說四句：你今天學了什麼、哪裡還不會。必須包含 because。"
        : "用英文寫兩句：你為什麼要在早上學習。必須包含 because。",
      kind: "write",
      minChars: dow === 0 ? 40 : 20,
      mustInclude: ["because"],
      why: "because 後面要接完整句子，不能只接一個名詞。",
      model: "I study in the morning because I can focus. I want a clear reason before I add an example.",
      modelZh: "我在早上學習，因為我能專心。我想先有一個清楚的原因，再補例子。",
      requireOutput: true,
      gains: { enWrite: dow === 0 ? 0 : enTimes[2], enSpeak: dow === 0 ? enTimes[2] : 0 },
    },
    {
      id: "en-check",
      title: "英文小測",
      minutes: enTimes[3],
      side: "en",
      teach: `選出「${word.zh}」的英文。`,
      prompt: `「${word.zh}」的英文是哪一個？`,
      choices: choiceSet(word.word, EN_VOCAB.map((item) => item.word), dayIndex),
      answer: word.word,
      why: `${word.word}＝${word.zh}。例句：${word.example}`,
      model: word.word,
      modelZh: word.exampleZh,
      requireOutput: true,
    },
  );

  let used = 0;
  for (const block of blocks) {
    used += block.minutes;
    block.core = used <= 60 || block.minutes === 0;
  }

  const gains = blocks.reduce((acc, block) => {
    for (const [key, value] of Object.entries(block.gains || {})) acc[key] = (acc[key] || 0) + value;
    return acc;
  }, {});

  return {
    date: iso,
    phase,
    theme: rowMeta.theme,
    materials: "日文用 Irodori 入門（日本基金會免費）與紙本抄寫。英文用字卡和短文，不先買題庫。",
    materialsToday: rowMeta.materials,
    minutes: plan,
    repair,
    push,
    blocks,
    suggest: {
      jaMin: plan.ja,
      enMin: plan.en,
      kana: gains.kana || 0,
      jaVocab: gains.jaVocab || 0,
      jaGrammar: gains.jaGrammar || 0,
      kanji: gains.kanji || 0,
      enVocab: gains.enVocab || 0,
      enGrammar: gains.enGrammar || 0,
      jaListen: gains.jaListen || 0,
      jaRead: dow === 3 ? Math.round(plan.ja * 0.4) : 0,
      enRead: gains.enRead || 0,
      enListen: dow === 4 ? Math.round(plan.en * 0.5) : 0,
      enSpeak: gains.enSpeak || (dow === 0 ? 10 : 0),
      enWrite: gains.enWrite || 0,
    },
  };
}

export function passMark(kind, phaseId) {
  if (kind === "week") return 0.7;
  return phaseId === "n5" ? 0.6 : 0.7;
}

export function passNeed(kind, total, phaseId) {
  return Math.ceil(passMark(kind, phaseId) * total - 1e-9);
}

function quizItem(partial) {
  return {
    kind: partial.choices ? "choice" : (partial.kind || "text"),
    requireOutput: true,
    ...partial,
  };
}

export function makeQuiz(kind, iso) {
  const phase = phaseFor(iso);
  const seed = Math.max(0, daysBetween(PLAN_START, iso)) + (kind === "month" ? 17 : 0);
  const kana = KANA_ROWS[seed % KANA_ROWS.length];
  const vocab = at(JA_VOCAB, seed);
  const particle = at(PARTICLES, seed);
  const word = at(EN_VOCAB, seed);
  const other = at(EN_VOCAB, seed + 5);
  const grammar = at(EN_GRAMMAR, seed);
  const kanji = at(KANJI, seed);
  const reading = at(READINGS, seed);
  const passage = at(IELTS_PASSAGES, seed);
  const hiraPool = KANA_ROWS.flatMap((row) => row.hira);
  const kataPool = KANA_ROWS.flatMap((row) => row.kata);

  const items = [
    quizItem({
      id: "kana-hira",
      lang: "ja",
      skill: "假名",
      tag: kana.label,
      exam: "JLPT 文字",
      stem: `「${kana.romaji[0]}」的平假名是哪一個？`,
      prompt: `「${kana.romaji[0]}」的平假名`,
      choices: choiceSet(kana.hira[0], hiraPool, seed),
      answer: kana.hira[0],
      why: `${kana.label}：${kana.hira[0]} 讀 ${kana.romaji[0]}。`,
      model: kana.hira[0],
      modelReading: kana.romaji[0],
      modelZh: kana.label,
    }),
    quizItem({
      id: "kana-kata",
      lang: "ja",
      skill: "假名",
      tag: `${kana.label}片假名`,
      exam: "JLPT 文字",
      stem: `「${kana.romaji[1] || kana.romaji[0]}」的片假名是哪一個？`,
      prompt: "選片假名",
      choices: choiceSet(kana.kata[1] || kana.kata[0], kataPool, seed + 1),
      answer: kana.kata[1] || kana.kata[0],
      why: `片假名 ${kana.kata[1] || kana.kata[0]} 對應 ${kana.romaji[1] || kana.romaji[0]}。`,
      model: kana.kata[1] || kana.kata[0],
      modelReading: kana.romaji[1] || kana.romaji[0],
      modelZh: "片假名",
    }),
    quizItem({
      id: "particle",
      lang: "ja",
      skill: "文法",
      tag: `助詞${particle.answer}`,
      exam: "JLPT 文法",
      stem: `${particle.blank}\n中文：${particle.zh}`,
      prompt: particle.blank,
      choices: ["は", "を", "に", "の"],
      answer: particle.answer === "も" ? "も" : particle.answer,
      why: particle.why,
      model: particle.answer,
      modelReading: particle.reading,
      modelZh: particle.zh,
    }),
    quizItem({
      id: "ja-vocab",
      lang: "ja",
      skill: "單字",
      tag: vocab.word,
      exam: "JLPT 語彙",
      stem: `「${vocab.zh}」的日文是哪一個？`,
      prompt: vocab.zh,
      choices: choiceSet(vocab.word, JA_VOCAB.map((item) => item.word), seed),
      answer: vocab.word,
      why: `${vocab.word}讀 ${vocab.reading}，意思是${vocab.zh}。例句：${vocab.sentence}（${vocab.sentenceReading}）${vocab.sentenceZh}`,
      model: vocab.word,
      modelReading: vocab.reading,
      modelZh: vocab.zh,
    }),
    quizItem({
      id: "en-word",
      lang: "en",
      skill: "單字",
      tag: word.word,
      exam: "IELTS 詞彙",
      stem: `「${word.zh}」的英文是哪一個？`,
      prompt: word.zh,
      choices: choiceSet(word.word, EN_VOCAB.map((item) => item.word), seed),
      answer: word.word,
      why: `${word.word}＝${word.zh}。${word.example}（${word.exampleZh}）`,
      model: word.word,
      modelZh: word.exampleZh,
    }),
    quizItem({
      id: "en-context",
      lang: "en",
      skill: "閱讀",
      tag: other.word,
      exam: "IELTS 閱讀",
      stem: `例句：${other.example}\n「${other.word}」在這裡最接近哪個意思？`,
      prompt: other.word,
      choices: choiceSet(other.zh, EN_VOCAB.map((item) => item.zh), seed + 2),
      answer: other.zh,
      why: `${other.word}＝${other.zh}。${other.exampleZh}`,
      model: other.word,
      modelZh: other.zh,
    }),
    quizItem({
      id: "en-grammar",
      lang: "en",
      skill: "文法",
      tag: grammar.name,
      exam: "IELTS 寫作",
      stem: `哪一句符合「${grammar.name}」？\n${grammar.zh}`,
      prompt: grammar.name,
      choices: choiceSet(grammar.example, EN_GRAMMAR.map((item) => item.example), seed),
      answer: grammar.example,
      why: `${grammar.zh} 例句：${grammar.example}（${grammar.exampleZh}）`,
      model: grammar.example,
      modelZh: grammar.exampleZh,
    }),
    quizItem({
      id: "en-write",
      lang: "en",
      skill: "寫作",
      tag: "because",
      exam: "IELTS 寫作",
      stem: "用英文寫兩句：你的閱讀為什麼會卡住。必須包含 because，至少 20 個字。",
      prompt: "寫兩句，包含 because",
      kind: "write",
      minChars: 20,
      mustInclude: ["because"],
      why: "because 後面要有完整原因。只有 because words 不算一句。",
      model: "My reading stops because I meet too many new words. I need to keep the main idea and mark the word.",
      modelZh: "我的閱讀會停住，因為生字太多。我需要抓住主旨，並把生字做記號。",
    }),
  ];

  if (particle.answer === "も") {
    items[2].choices = ["は", "を", "に", "も"];
  }

  if (kind === "month") {
    items.push(
      quizItem({
        id: "ja-read",
        lang: "ja",
        skill: "閱讀",
        tag: reading.id,
        exam: "JLPT 読解",
        stem: `${reading.text}\n${reading.stem}`,
        prompt: reading.stem,
        choices: reading.choices,
        answer: reading.answer,
        why: `${reading.why}\n全文中文：${reading.zh}`,
        model: reading.answer,
        modelReading: reading.reading,
        modelZh: reading.zh,
      }),
      quizItem({
        id: "ielts-gist",
        lang: "en",
        skill: "閱讀",
        tag: passage.id,
        exam: "IELTS 閱讀",
        stem: `${passage.text}\n${passage.stem}`,
        prompt: passage.stem,
        choices: passage.choices,
        answer: passage.answer,
        why: `${passage.why}\n中文：${passage.zh}`,
        model: passage.answer,
        modelZh: passage.zh,
      }),
      quizItem({
        id: "kanji",
        lang: "ja",
        skill: "漢字",
        tag: kanji.kanji,
        exam: "JLPT 漢字",
        stem: `「${kanji.kanji}」的讀音是哪一個？`,
        prompt: kanji.kanji,
        choices: choiceSet(kanji.reading, KANJI.map((item) => item.reading), seed),
        answer: kanji.reading,
        why: `${kanji.kanji}讀 ${kanji.reading}，意思是${kanji.zh}。`,
        model: kanji.kanji,
        modelReading: kanji.reading,
        modelZh: kanji.zh,
      }),
      quizItem({
        id: "en-write-long",
        lang: "en",
        skill: "寫作",
        tag: "paragraph",
        exam: "IELTS 寫作",
        stem: "寫一個英文段落，至少 40 個字。第一句是主題句，並包含 because。",
        prompt: "40 字段落，含 because",
        kind: "write",
        minChars: 40,
        mustInclude: ["because"],
        why: "7.0 的寫作要先有主題句，再用 because 展開原因。這題先檢查這兩件事。",
        model: "Morning study is useful because I can focus for one hour. I review kana first and then write a short English paragraph.",
        modelZh: "早上學習有用，因為我能專心一小時。我先複習假名，再寫一小段英文。",
      }),
    );
  }

  const need = passNeed(kind, items.length, phase.id);
  return {
    id: `${kind}-${iso}`,
    kind,
    date: iso,
    phaseId: phase.id,
    title: kind === "week" ? "週考" : "月考",
    passAt: passMark(kind, phase.id),
    need,
    total: items.length,
    items,
  };
}
