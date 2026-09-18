export function configuredKey(...names) {
  for (const name of names) {
    const value = String(process.env[name] || "").trim();
    if (value && value !== "your_key_here") return value;
  }
  return "";
}

let lastGoodGemini = "";

export function rememberGeminiModel(name) {
  lastGoodGemini = String(name || "").trim();
  return lastGoodGemini;
}

export function geminiModelList(envModel = process.env.GOOGLE_GEMINI_MODEL) {
  const preferred = String(envModel || "").trim();
  const models = [
    lastGoodGemini,
    preferred,
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
  ];
  const retired = /^(gemini-1\.5-|gemini-2\.0-flash|gemini-2\.5-flash)/;
  return models.filter((name, index) => (
    name
    && name !== "your_key_here"
    && !retired.test(name)
    && models.indexOf(name) === index
  ));
}

export function shouldTryNextGeminiModel(status) {
  return status === 404 || status === 429 || status === 503;
}

export function geminiOutputTokens(requested, chat = false) {
  const n = Number(requested);
  if (chat) return Math.min(Math.max(Number.isFinite(n) ? n : 256, 80), 384);
  if (!Number.isFinite(n) || n <= 0) return 1200;
  return Math.min(Math.max(n, 256), 4096);
}

export function geminiChatModelList(envModel = process.env.GOOGLE_GEMINI_MODEL) {
  const lite = "gemini-3.5-flash-lite";
  const rest = geminiModelList(envModel).filter((name) => name !== lite);
  return [lite, ...rest];
}

export function geminiDeltaText(body) {
  return (body?.candidates || [])
    .flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text || "")
    .join("");
}

export function readSseDataLine(line) {
  const trimmed = String(line || "").trim();
  if (!trimmed.startsWith("data:")) return "";
  const raw = trimmed.slice(5).trim();
  if (!raw || raw === "[DONE]") return "";
  try {
    return geminiDeltaText(JSON.parse(raw));
  } catch {
    return "";
  }
}
