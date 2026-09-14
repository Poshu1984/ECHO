export const PLANS = {
  free: { usd: 0, tts: 30, llm: 0, label: "FREE" },
  starter: { usd: 9, tts: 200, llm: 80, label: "STARTER" },
  plus: { usd: 19, tts: 800, llm: 300, label: "PLUS" },
  pro: { usd: 49, tts: 3000, llm: 1200, label: "PRO" },
};

export function periodKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function planOf(user) {
  if (user?.role === "admin") return { usd: null, tts: Infinity, llm: Infinity, label: "ROOT" };
  return PLANS[user?.plan] || PLANS.free;
}

export function usageOf(user) {
  const period = periodKey();
  const usage = user?.usage || {};
  if (usage.period !== period) return { period, tts: 0, llm: 0 };
  return { period, tts: usage.tts || 0, llm: usage.llm || 0 };
}
