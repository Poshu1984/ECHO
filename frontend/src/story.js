export const STORY_SCENES = ["rain", "cafe", "commute", "market", "office", "night"];

const RULES = [
  ["rain", /rain|storm|wet|taxi|thunder|night drive|wiper|傘|雨|暴雨|計程車/],
  ["commute", /train|bus|commute|station|mrt|metro|tram|地鐵|捷運|公車|通勤|電車/],
  ["market", /market|fruit|stall|shop|grocery|市集|市場|水果|攤/],
  ["cafe", /cafe|coffee|tea|breakfast|lunch|dessert|咖啡|早餐|午餐|甜點/],
  ["office", /office|meeting|slide|desk|report|deadline|辦公室|會議|報告/],
  ["night", /night|corridor|shift|dark|midnight|夜|走廊|夜班/],
];

export function inferScene(passage = {}) {
  const given = String(passage.scene || "").toLowerCase();
  if (STORY_SCENES.includes(given)) return given;
  const blob = [
    passage.title,
    passage.title_zh,
    passage.hook_zh,
    ...(passage.sentences || []).map((s) => `${s.text || ""} ${s.zh || ""}`),
  ].join(" ").toLowerCase();
  for (const [id, re] of RULES) {
    if (re.test(blob)) return id;
  }
  return "cafe";
}

export function formatClock(seconds) {
  const n = Math.max(0, Math.round(Number(seconds) || 0));
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
