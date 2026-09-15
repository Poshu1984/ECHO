const KEY = "echoo-week";

export function isoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function emptyWeek(week) {
  return {
    week,
    sessions: 0,
    minutes: 0,
    langs: [],
    modes: [],
    days: [],
    streak: 0,
    lastDay: "",
  };
}

export function loadWeek() {
  const week = isoWeekKey();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!raw || raw.week !== week) return emptyWeek(week);
    return raw;
  } catch {
    return emptyWeek(week);
  }
}

function dayStamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function recordPractice({ lang, mode, minutes = 1 }) {
  const data = loadWeek();
  const day = dayStamp();
  data.sessions += 1;
  data.minutes += Math.max(0, Number(minutes) || 0);
  if (lang && !data.langs.includes(lang)) data.langs.push(lang);
  if (mode && !data.modes.includes(mode)) data.modes.push(mode);
  if (!data.days.includes(day)) data.days.push(day);
  if (data.lastDay) {
    const prev = new Date(`${data.lastDay}T00:00:00Z`);
    const now = new Date(`${day}T00:00:00Z`);
    const diff = (now - prev) / 86400000;
    if (diff === 1) data.streak = (data.streak || 0) + 1;
    else if (diff > 1) data.streak = 1;
  } else {
    data.streak = Math.max(1, data.streak || 1);
  }
  data.lastDay = day;
  localStorage.setItem(KEY, JSON.stringify(data));
  return data;
}

export function computeScore(week = loadWeek()) {
  const frequency = Math.min((week.sessions || 0) / 7, 1) * 400;
  const duration = Math.min((week.minutes || 0) / 210, 1) * 300;
  const langPart = Math.min((week.langs || []).length / 3, 1) * 0.6;
  const modePart = Math.min((week.modes || []).length / 2, 1) * 0.4;
  const diversity = (langPart + modePart) * 200;
  const streak = Math.min((week.streak || 0) / 14, 1) * 100;
  const parts = {
    frequency: Math.round(frequency),
    duration: Math.round(duration),
    diversity: Math.round(diversity),
    streak: Math.round(streak),
  };
  const total = parts.frequency + parts.duration + parts.diversity + parts.streak;
  return { ...parts, total };
}

export function fakeFriends(myScore, myName) {
  const others = [
    { name: "林安", score: 720 },
    { name: "陳梅", score: 610 },
    { name: "高遠", score: 455 },
  ];
  return [...others, { name: myName || "你", score: myScore, me: true }]
    .sort((a, b) => b.score - a.score)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}
