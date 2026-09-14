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
    const err = new Error(data.error || res.statusText);
    err.status = res.status;
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
  voices: (languageCode) => req(`/api/tts/voices?languageCode=${encodeURIComponent(languageCode)}`),
  synthesize: (body) => req("/api/tts/synthesize", { method: "POST", body: JSON.stringify(body) }),
  llm: (system, messages) => req("/api/llm/messages", { method: "POST", body: JSON.stringify({ system, messages, max_tokens: 1200 }) }),
};
