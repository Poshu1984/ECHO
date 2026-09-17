export function configuredKey(...names) {
  for (const name of names) {
    const value = String(process.env[name] || "").trim();
    if (value && value !== "your_key_here") return value;
  }
  return "";
}

export function geminiModelList(envModel = process.env.GOOGLE_GEMINI_MODEL) {
  const preferred = String(envModel || "").trim();
  const models = [
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
