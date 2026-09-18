const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function getToken() {
  return localStorage.getItem("echoo-token") || "";
}

export function setSession(token, user) {
  localStorage.setItem("echoo-token", token);
  localStorage.setItem("echoo-user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("echoo-token");
  localStorage.removeItem("echoo-user");
}

export function loadUser() {
  try {
    return JSON.parse(localStorage.getItem("echoo-user") || "null");
  } catch {
    return null;
  }
}

async function req(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data.error === "string"
      ? data.error
      : data.error?.message || data.message || res.statusText;
    const err = new Error(message);
    err.status = res.status;
    err.code = data.error;
    throw err;
  }
  return data;
}

export const api = {
  login: (username, password) => req("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  register: (username, password) => req("/api/auth/register", { method: "POST", body: JSON.stringify({ username, password }) }),
  me: () => req("/api/auth/me"),
  users: () => req("/api/auth/users"),
  setPlan: (id, plan) => req(`/api/auth/users/${id}/plan`, { method: "POST", body: JSON.stringify({ plan }) }),
  addXp: (xp, minutes) => req("/api/progress/xp", { method: "POST", body: JSON.stringify({ xp, minutes }) }),
  health: () => req("/api/health"),
  ttsStatus: () => req("/api/tts/status"),
  voices: (languageCode) => req(`/api/tts/voices?languageCode=${encodeURIComponent(languageCode)}`),
  synthesize: (body) => req("/api/tts/synthesize", { method: "POST", body: JSON.stringify(body) }),
  llm: (system, messages, max_tokens = 1200, temperature, extra = {}) => req("/api/llm/messages", {
    method: "POST",
    body: JSON.stringify({ system, messages, max_tokens, temperature, ...extra }),
  }),
  llmStream: async (system, messages, max_tokens = 256, temperature = 0.6, onDelta) => {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/api/llm/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        system,
        messages,
        max_tokens,
        temperature,
        chat: true,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = typeof data.error === "string"
        ? data.error
        : data.error?.message || data.message || res.statusText;
      const err = new Error(message);
      err.status = res.status;
      err.code = data.error;
      throw err;
    }
    if (!res.body) throw new Error("EMPTY_REPLY");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let full = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split(/\n/);
      buf = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        let payload;
        try {
          payload = JSON.parse(trimmed.slice(5).trim() || "{}");
        } catch {
          continue;
        }
        if (payload.error) {
          const err = new Error(String(payload.error));
          err.code = payload.error;
          throw err;
        }
        if (payload.text) {
          full += payload.text;
          onDelta?.(full);
        }
      }
    }
    if (!full.trim()) throw new Error("EMPTY_REPLY");
    return { content: [{ type: "text", text: full }] };
  },
};
