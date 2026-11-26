// End-to-end API tests. Each run boots a private copy of the server in a temp
// folder (so backend/data is never touched) with no third-party keys, which is
// how the app behaves before TTS / model keys are configured.
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ADMIN_USER = "ci-admin";
const ADMIN_PASS = "ci-admin-password";
let dir;
let child;
let base;
let serverLog = "";

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function waitForHealth(url, ms = 15000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (child.exitCode !== null) throw new Error(`server exited early (${child.exitCode}):\n${serverLog}`);
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`server did not start:\n${serverLog}`);
}

async function call(method, route, { body, token, headers = {} } = {}) {
  const res = await fetch(`${base}${route}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

before(async () => {
  dir = mkdtempSync(path.join(tmpdir(), "echo-api-"));
  for (const name of readdirSync(here)) {
    if (name.endsWith(".js") && !name.endsWith(".test.js")) cpSync(path.join(here, name), path.join(dir, name));
  }
  cpSync(path.join(here, "routes"), path.join(dir, "routes"), { recursive: true });
  cpSync(path.join(here, "package.json"), path.join(dir, "package.json"));
  symlinkSync(path.join(here, "node_modules"), path.join(dir, "node_modules"), "dir");

  const port = await freePort();
  base = `http://127.0.0.1:${port}`;
  const env = { ...process.env };
  for (const key of [
    "GOOGLE_TTS_API_KEY", "GOOGLE_GEMINI_API_KEY", "ANTHROPIC_API_KEY",
    "FRONTEND_URL", "ECHOO_ADMIN_USER", "ECHOO_ADMIN_PASSWORD",
  ]) delete env[key];
  Object.assign(env, {
    PORT: String(port),
    JWT_SECRET: "ci-only-secret",
    ECHO_ADMIN_USER: ADMIN_USER,
    ECHO_ADMIN_PASSWORD: ADMIN_PASS,
  });
  child = spawn(process.execPath, ["server.js"], { cwd: dir, env, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", (d) => { serverLog += d; });
  child.stderr.on("data", (d) => { serverLog += d; });
  await waitForHealth(base);

  // Shared learner used by several suites, so each suite can run on its own.
  const reg = await call("POST", "/api/auth/register", { body: { username: "learner1", password: "secret1" } });
  assert.equal(reg.status, 200);
});

after(() => {
  child?.kill();
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe("health", () => {
  it("is up and reports that no keys are configured", async () => {
    const { status, data } = await call("GET", "/api/health");
    assert.equal(status, 200);
    assert.equal(data.ok, true);
    assert.equal(data.ttsConfigured, false);
    assert.equal(data.llmConfigured, false);
  });
});

describe("CORS", () => {
  it("allows the local dev frontend", async () => {
    const res = await fetch(`${base}/api/health`, { headers: { Origin: "http://localhost:5173" } });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:5173");
  });

  it("does not grant an unknown site access", async () => {
    const res = await fetch(`${base}/api/health`, { headers: { Origin: "https://evil.example" } });
    assert.equal(res.headers.get("access-control-allow-origin"), null);
  });
});

describe("auth", () => {
  it("rejects too-short usernames or passwords", async () => {
    assert.equal((await call("POST", "/api/auth/register", { body: { username: "ab", password: "123456" } })).status, 400);
    assert.equal((await call("POST", "/api/auth/register", { body: { username: "abc", password: "12345" } })).status, 400);
    assert.equal((await call("POST", "/api/auth/register", { body: {} })).status, 400);
  });

  it("registers, logs in and reads the profile without leaking the password hash", async () => {
    const reg = await call("POST", "/api/auth/register", { body: { username: "learner0", password: "secret0" } });
    assert.equal(reg.status, 200);
    assert.ok(reg.data.token);
    assert.equal(reg.data.user.plan, "free");
    assert.equal(reg.data.user.role, "user");
    assert.equal("passwordHash" in reg.data.user, false);

    const login = await call("POST", "/api/auth/login", { body: { username: "LEARNER0", password: "secret0" } });
    assert.equal(login.status, 200);

    const me = await call("GET", "/api/auth/me", { token: login.data.token });
    assert.equal(me.status, 200);
    assert.equal(me.data.user.username, "learner0");
    assert.equal(JSON.stringify(me.data).includes("passwordHash"), false);
  });

  it("refuses a duplicate username regardless of case", async () => {
    const res = await call("POST", "/api/auth/register", { body: { username: "Learner1", password: "another1" } });
    assert.equal(res.status, 409);
    assert.equal(res.data.error, "USERNAME_TAKEN");
  });

  it("refuses a wrong password with the same error as an unknown user", async () => {
    const wrong = await call("POST", "/api/auth/login", { body: { username: "learner1", password: "nope-nope" } });
    const unknown = await call("POST", "/api/auth/login", { body: { username: "nobody-here", password: "nope-nope" } });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.deepEqual(wrong.data, unknown.data);
  });

  it("rejects missing and forged tokens", async () => {
    assert.equal((await call("GET", "/api/auth/me")).status, 401);
    assert.equal((await call("GET", "/api/auth/me", { token: "not-a-jwt" })).status, 401);
  });

  it("lists plans publicly", async () => {
    const res = await call("GET", "/api/auth/plans");
    assert.equal(res.status, 200);
    assert.ok(res.data.plans.free);
  });
});

describe("admin", () => {
  it("seeds the admin from env and lets only the admin list users", async () => {
    const admin = await call("POST", "/api/auth/login", { body: { username: ADMIN_USER, password: ADMIN_PASS } });
    assert.equal(admin.status, 200);
    assert.equal(admin.data.user.role, "admin");

    const user = await call("POST", "/api/auth/login", { body: { username: "learner1", password: "secret1" } });
    assert.equal((await call("GET", "/api/auth/users", { token: user.data.token })).status, 403);
    assert.equal((await call("POST", `/api/auth/users/${user.data.user.id}/plan`, { token: user.data.token, body: { plan: "pro" } })).status, 403);

    const list = await call("GET", "/api/auth/users", { token: admin.data.token });
    assert.equal(list.status, 200);
    assert.equal(JSON.stringify(list.data).includes("passwordHash"), false);
  });

  it("rejects an unknown plan name", async () => {
    const admin = await call("POST", "/api/auth/login", { body: { username: ADMIN_USER, password: ADMIN_PASS } });
    const user = await call("POST", "/api/auth/login", { body: { username: "learner1", password: "secret1" } });
    const res = await call("POST", `/api/auth/users/${user.data.user.id}/plan`, { token: admin.data.token, body: { plan: "gold" } });
    assert.equal(res.status, 400);
  });
});

describe("progress", () => {
  it("requires sign-in and clamps XP and minutes per call", async () => {
    assert.equal((await call("POST", "/api/progress/xp", { body: { xp: 10 } })).status, 401);
    const reg = await call("POST", "/api/auth/register", { body: { username: "learner2", password: "secret2" } });
    const token = reg.data.token;
    const big = await call("POST", "/api/progress/xp", { token, body: { xp: 999999, minutes: 999 } });
    assert.equal(big.status, 200);
    assert.equal(big.data.user.xp, 200);
    assert.equal(big.data.user.minutes, 30);
    const negative = await call("POST", "/api/progress/xp", { token, body: { xp: -50, minutes: "abc" } });
    assert.equal(negative.data.user.xp, 200);
    assert.equal(negative.data.user.minutes, 30);
  });
});

describe("paid upstream calls without keys", () => {
  it("requires sign-in for TTS and the model", async () => {
    assert.equal((await call("POST", "/api/tts/synthesize", { body: { ssml: "<speak>hi</speak>" } })).status, 401);
    assert.equal((await call("POST", "/api/llm/messages", { body: { messages: [] } })).status, 401);
    assert.equal((await call("GET", "/api/tts/voices?languageCode=en-US")).status, 401);
  });

  it("fails clearly and does not spend quota when no key is set", async () => {
    // Use a plan that has model quota, so "not spent" is actually observable.
    const admin = await call("POST", "/api/auth/login", { body: { username: ADMIN_USER, password: ADMIN_PASS } });
    const reg = await call("POST", "/api/auth/register", { body: { username: "learner3", password: "secret3" } });
    const plan = await call("POST", `/api/auth/users/${reg.data.user.id}/plan`, { token: admin.data.token, body: { plan: "starter" } });
    assert.equal(plan.status, 200);
    assert.ok(plan.data.user.quota.llmLimit > 0);
    const token = reg.data.token;

    const status = await call("GET", "/api/tts/status", { token });
    assert.equal(status.status, 200);
    assert.equal(status.data.configured, false);

    const tts = await call("POST", "/api/tts/synthesize", { token, body: { ssml: "<speak>hi</speak>" } });
    assert.equal(tts.status, 500);
    const llm = await call("POST", "/api/llm/messages", { token, body: { messages: [{ role: "user", content: "hi" }] } });
    assert.equal(llm.status, 500);

    const me = await call("GET", "/api/auth/me", { token });
    assert.equal(me.data.user.quota.ttsUsed, 0);
    assert.equal(me.data.user.quota.llmUsed, 0);
  });
});
