import {
  PLAN_START, WEEK_MINUTES, addDays, answersMatch, expectedMinutes, makeQuiz, passMark, phaseFor, plannedMinutes, targetsFor, weekGoal,
} from "./plan.js";

const KEY = "echoo-coach";

const COUNT_KEYS = ["kana", "jaVocab", "jaGrammar", "kanji", "enVocab", "enGrammar"];
const SKILL_KEYS = ["jaListen", "jaRead", "enRead", "enListen", "enSpeak", "enWrite"];

export function emptyState() {
  return {
    version: 1,
    plan: "plan-1",
    started: PLAN_START,
    pace: "normal",
    repairUntil: "",
    sessions: [],
    weaknesses: [],
    quizzes: [],
    adjustments: [],
  };
}

export function loadCoach() {
  try {
    if (typeof localStorage === "undefined") return emptyState();
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!raw || raw.version !== 1) return emptyState();
    return { ...emptyState(), ...raw };
  } catch {
    return emptyState();
  }
}

export function saveCoach(state) {
  if (typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  return state;
}

function numberOf(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

export function totals(state) {
  const counts = Object.fromEntries(COUNT_KEYS.map((key) => [key, 0]));
  const skills = Object.fromEntries(SKILL_KEYS.map((key) => [key, 0]));
  let jaMin = 0;
  let enMin = 0;
  for (const session of state.sessions || []) {
    jaMin += numberOf(session.jaMin);
    enMin += numberOf(session.enMin);
    for (const key of COUNT_KEYS) counts[key] += numberOf(session[key]);
    for (const key of SKILL_KEYS) skills[key] += numberOf(session[key]);
  }
  return { ...counts, ...skills, jaMin, enMin, totalMin: jaMin + enMin };
}

export function minutesInWeek(state, iso) {
  const { weekStart } = awaitWeek(iso);
  return (state.sessions || [])
    .filter((session) => session.date >= weekStart && session.date <= iso)
    .reduce((sum, session) => sum + numberOf(session.jaMin) + numberOf(session.enMin), 0);
}

function awaitWeek(iso) {
  const start = iso;
  return { weekStart: start < PLAN_START ? PLAN_START : mondayOf(iso) };
}

function mondayOf(iso) {
  const day = new Date(`${iso}T12:00:00Z`).getUTCDay();
  const back = day === 0 ? 6 : day - 1;
  return addDays(iso, -back);
}

export function weekStatus(state, iso) {
  const start = mondayOf(iso) < PLAN_START ? PLAN_START : mondayOf(iso);
  const got = (state.sessions || [])
    .filter((session) => session.date >= start && session.date <= iso)
    .reduce((sum, session) => sum + numberOf(session.jaMin) + numberOf(session.enMin), 0);
  const expected = expectedMinutes(iso);
  const goal = weekGoal(iso);
  const gap = Math.max(0, expected - got);
  return { got, expected, goal, gap, weekGoal: WEEK_MINUTES };
}

export function progressRows(state, iso) {
  const goal = targetsFor(phaseFor(iso).id);
  const got = totals(state);
  const specs = [
    ["日文", "假名（書寫）", "kana", "字"],
    ["日文", "單字", "jaVocab", "個"],
    ["日文", "文法點", "jaGrammar", "點"],
    ["日文", "漢字", "kanji", "字"],
    ["日文", "聽力", "jaListen", "分鐘"],
    ["日文", "閱讀", "jaRead", "分鐘"],
    ["英文", "單字", "enVocab", "個"],
    ["英文", "文法主題", "enGrammar", "題"],
    ["英文", "閱讀", "enRead", "分鐘"],
    ["英文", "聽力", "enListen", "分鐘"],
    ["英文", "口說", "enSpeak", "分鐘"],
    ["英文", "寫作", "enWrite", "分鐘"],
  ];
  return specs.map(([group, item, key, unit]) => {
    const have = got[key] || 0;
    const target = goal[key] || 0;
    const rate = target ? Math.min(1, have / target) : 0;
    return { group, item, key, unit, have, target, rate };
  });
}

export function applyComplete(state, entry) {
  const session = {
    date: entry.date,
    jaMin: numberOf(entry.jaMin),
    enMin: numberOf(entry.enMin),
    note: String(entry.note || "").trim(),
  };
  for (const key of COUNT_KEYS) session[key] = numberOf(entry[key]);
  for (const key of SKILL_KEYS) session[key] = numberOf(entry[key]);
  const sessions = (state.sessions || []).filter((item) => item.date !== session.date);
  sessions.push(session);
  sessions.sort((a, b) => a.date.localeCompare(b.date));
  return { ...state, sessions };
}

function weaknessFrom(item, correct, date) {
  return {
    id: item.id,
    lang: item.lang || "",
    skill: item.skill || "",
    tag: item.tag || item.id,
    stem: item.stem || item.prompt || "",
    prompt: item.prompt || item.stem || "",
    answer: item.answer || "",
    accept: item.accept || null,
    choices: item.choices || null,
    kind: item.kind || "",
    mustInclude: item.mustInclude || null,
    minChars: item.minChars || 0,
    why: item.why || "",
    model: item.model || item.answer || "",
    modelReading: item.modelReading || "",
    modelZh: item.modelZh || "",
    exam: item.exam || "",
    misses: correct ? 0 : 1,
    hits: correct ? 1 : 0,
    interval: correct ? 3 : 1,
    nextReview: addDays(date, correct ? 3 : 1),
    lastAt: date,
  };
}

const STEPS = [1, 3, 7, 14, 30];

export function recordResult(state, item, correct, date) {
  const list = [...(state.weaknesses || [])];
  const index = list.findIndex((row) => row.id === item.id);
  if (correct && index < 0) return state;
  if (index < 0) {
    list.push(weaknessFrom(item, false, date));
    return { ...state, weaknesses: list };
  }
  const prev = list[index];
  if (correct) {
    const stepAt = Math.min(STEPS.length - 1, STEPS.indexOf(prev.interval) + 1);
    const interval = STEPS[Math.max(0, stepAt)] || 3;
    list[index] = {
      ...prev,
      hits: prev.hits + 1,
      interval,
      nextReview: addDays(date, interval),
      lastAt: date,
    };
  } else {
    list[index] = {
      ...prev,
      misses: prev.misses + 1,
      interval: 1,
      nextReview: addDays(date, 1),
      lastAt: date,
      why: item.why || prev.why,
    };
  }
  return { ...state, weaknesses: list };
}

export function submitQuiz(state, quiz, answers, date) {
  const items = quiz.items.map((item) => {
    const given = answers[item.id] || "";
    const correct = answersMatch(item, given);
    return { ...item, given, correct };
  });
  let next = state;
  for (const item of items) next = recordResult(next, item, item.correct, date);
  const hits = items.filter((item) => item.correct).length;
  const rate = items.length ? hits / items.length : 0;
  const langRate = (lang) => {
    const rows = items.filter((item) => item.lang === lang);
    const ok = rows.filter((item) => item.correct).length;
    return { hits: ok, total: rows.length, rate: rows.length ? ok / rows.length : 0 };
  };
  const passed = rate + 1e-9 >= passMark(quiz.kind, quiz.phaseId);
  const result = {
    id: quiz.id,
    kind: quiz.kind,
    date,
    hits,
    total: items.length,
    rate,
    passed,
    need: quiz.need,
    ja: langRate("ja"),
    en: langRate("en"),
    items,
  };
  return {
    state: { ...next, quizzes: [...(next.quizzes || []), result] },
    result,
  };
}

export function weakLabel(item) {
  const tag = String(item?.tag || "");
  if (tag && !tag.startsWith("lesson-")) return tag;
  if (tag.includes("ja-warm") || tag.includes("ja-new")) return "假名";
  if (tag.includes("ja-check")) return "日文助詞";
  if (tag.includes("ja-out")) return "日文造句";
  if (tag.includes("en-out")) return "because 寫作";
  if (tag.includes("en-new")) return "英文文法";
  if (tag.includes("en-")) return "英文單字";
  return item?.skill || "錯題";
}

export function dueWeaknesses(state, iso) {
  return (state.weaknesses || [])
    .filter((item) => item.misses > 0 && item.nextReview && item.nextReview <= iso)
    .sort((a, b) => a.nextReview.localeCompare(b.nextReview) || b.misses - a.misses);
}

export function latestQuiz(state, kind) {
  const rows = (state.quizzes || []).filter((quiz) => !kind || quiz.kind === kind);
  return rows[rows.length - 1] || null;
}

export function buildAdjustReport(state, iso) {
  const status = weekStatus(state, iso);
  const noLog = !(state.sessions || []).length;
  const behindHours = noLog
    ? iso > PLAN_START
    : status.expected > 0 && status.got < status.expected * 0.8;
  const quiz = latestQuiz(state, "week");
  const behindScore = Boolean(quiz && quiz.rate < 0.7);
  const ahead = !behindHours && !behindScore && status.got >= status.goal && status.goal > 0 && quiz && quiz.rate >= 0.9;
  const gapMin = status.gap;
  let message = "這週的時數和最近一次週考都在門檻上。維持現在的新內容量。";
  let remedy = "繼續同一天交叉：早上先日文，後半段英文。錯題仍按 1、3、7、14 天複習。";
  if (noLog && iso <= PLAN_START) {
    message = "今天還沒有學習紀錄。先做完今天的課，再談落後。";
    remedy = "先完成今天的輸出和小測。假名沒寫出來，不要往下加新的一列。";
  } else if (behindHours || behindScore) {
    const parts = [];
    if (noLog) parts.push(`${iso} 還沒有任何學習紀錄`);
    else if (behindHours) parts.push(`到昨天為止少了 ${gapMin} 分鐘`);
    if (behindScore) parts.push(`最近週考 ${quiz.hits}/${quiz.total}，低於 70%`);
    message = `進度落後：${parts.join("，")}。`;
    remedy = "接下來 7 天改成補救：新假名一天最多 3 個，先清到期錯題。英文保留 because 短句，不中斷。週末前 40 分鐘只補假名和錯題。";
  } else if (ahead) {
    message = "這週時數達標，而且週考至少 90%。可以多學 1 個日文單字。";
    remedy = "新內容加一個單字。假名小測若掉到 90% 以下，立刻退回原速。";
  }
  return { date: iso, behindHours, behindScore, ahead, gapMin, message, remedy, pace: (behindHours || behindScore) ? "repair" : ahead ? "push" : "normal" };
}

export function applyAdjust(state, iso) {
  const report = buildAdjustReport(state, iso);
  return {
    report,
    state: {
      ...state,
      pace: report.pace,
      repairUntil: report.pace === "repair" ? addDays(iso, 6) : "",
      adjustments: [...(state.adjustments || []), report],
    },
  };
}

export function archiveText(state, iso) {
  const phase = phaseFor(iso);
  const status = weekStatus(state, iso);
  const got = totals(state);
  const rows = progressRows(state, iso);
  const mastered = rows.filter((row) => row.target && row.have >= row.target).map((row) => row.item);
  const open = rows.filter((row) => row.have < row.target).slice(0, 6).map((row) => `${row.item} ${row.have}/${row.target}`);
  const weak = dueWeaknesses(state, iso).map((item) => item.tag).slice(0, 6);
  const tomorrow = addDays(iso, 1);
  const quiz = latestQuiz(state);
  return [
    "狀態存檔",
    `階段：${phase.title}`,
    `方案：方案 1（2026-12-06 N5，2027-07-04 N4，2028-07-02 N3；英文 2027-11 目標 6.5，7.0 放 2028 上半年）`,
    `日期：${iso}`,
    `節奏：${state.pace === "repair" ? "補救" : state.pace === "push" ? "加量" : "原速"}`,
    `累計時數：日文 ${got.jaMin} 分鐘，英文 ${got.enMin} 分鐘，合計 ${(got.totalMin / 60).toFixed(1)} 小時`,
    `本週：已學 ${status.got} 分鐘，到昨天應達 ${status.expected} 分鐘，本週目標 ${status.goal} 分鐘，差距 ${status.gap} 分鐘`,
    `最近考核：${quiz ? `${quiz.kind === "week" ? "週考" : "月考"} ${quiz.hits}/${quiz.total}（${quiz.passed ? "通過" : "未過"}）` : "尚未考核"}`,
    `已達階段目標：${mastered.length ? mastered.join("、") : "尚無"}`,
    `未達標：${open.join("、") || "無"}`,
    `到期錯題：${weak.join("、") || "無"}`,
    `明天預告：${tomorrow}，${phaseFor(tomorrow).title}`,
  ].join("\n");
}

export function quizOf(kind, iso) {
  return makeQuiz(kind, iso);
}

export function todayPlan(iso) {
  return plannedMinutes(iso);
}
