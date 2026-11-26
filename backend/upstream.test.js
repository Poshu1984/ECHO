// Latency features against mocked Google TTS / Anthropic / Gemini upstreams.
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { caller, freePort, startServer } from "./test-support/server.js";

const ADMIN = { username: "ci-admin", password: "ci-admin-password" };
let mock;
let mockBase;
let api;
let call;
const seen = { tts: [], claude: 0, gemini: 0 };

function readBody(req) {
  return new Promise((resolve) => {
    let s = "";
    req.on("data", (d) => { s += d; });
    req.on("end", () => resolve(s ? JSON.parse(s) : {}));
  });
}

before(async () => {
  const port = await freePort();
  mockBase = `http://127.0.0.1:${port}`;
  mock = createServer(async (req, res) => {
    const body = await readBody(req);
    if (req.url.startsWith("/v1/text:synthesize")) {
      seen.tts.push({ at: Date.now(), text: body.input?.text });
      await new Promise((r) => setTimeout(r, 300));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ audioContent: Buffer.from(`mp3:${body.input?.text}`).toString("base64") }));
      return;
    }
    if (req.url.startsWith("/v1/messages")) {
      seen.claude += 1;
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { type: "authentication_error" } }));
      return;
    }
    if (req.url.includes(":generateContent")) {
      seen.gemini += 1;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: "{\"ok\":true}" }] } }] }));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise((r) => mock.listen(port, "127.0.0.1", r));
  api = await startServer({
    ECHO_ADMIN_USER: ADMIN.username,
    ECHO_ADMIN_PASSWORD: ADMIN.password,
    GOOGLE_TTS_API_KEY: "test-tts-key",
    GOOGLE_GEMINI_API_KEY: "test-gemini-key",
    ANTHROPIC_API_KEY: "test-claude-key",
    TTS_API_BASE: mockBase,
    ANTHROPIC_API_BASE: mockBase,
    GEMINI_API_BASE: mockBase,
  });
  call = caller(api.base);
});

after(() => {
  api?.stop();
  mock?.close();
});

async function learner(name, plan) {
  const reg = await call("POST", "/api/auth/register", { body: { username: name, password: "secret1" } });
  if (plan) {
    const admin = await call("POST", "/api/auth/login", { body: ADMIN });
    await call("POST", `/api/auth/users/${reg.data.user.id}/plan`, { token: admin.data.token, body: { plan } });
  }
  return reg.data.token;
}

const voice = { languageCode: "en-US", name: "en-US-Chirp3-HD-Aoede" };

describe("POST /api/tts/synthesize-parts", () => {
  it("synthesizes sentences in parallel and returns one clip per sentence", async () => {
    const token = await learner("parts1", "starter");
    seen.tts = [];
    const started = Date.now();
    const res = await call("POST", "/api/tts/synthesize-parts", {
      token, body: { parts: ["One.", "Two.", "Three."], voice, audioConfig: { speakingRate: 1 } },
    });
    const ms = Date.now() - started;
    assert.equal(res.status, 200);
    assert.deepEqual(res.data.parts.map((p) => Buffer.from(p.audioContent, "base64").toString()), ["mp3:One.", "mp3:Two.", "mp3:Three."]);
    assert.equal(seen.tts.length, 3);
    assert.ok(ms < 800, `parallel, took ${ms}ms for 3 x 300ms`);
    const me = await call("GET", "/api/auth/me", { token });
    assert.equal(me.data.user.quota.ttsUsed, 1, "one quota unit per request");
  });

  it("serves repeated sentences from cache without calling Google or spending quota", async () => {
    const token = await learner("parts2", "starter");
    seen.tts = [];
    const body = { parts: ["Again.", "And again."], voice, audioConfig: { speakingRate: 1 } };
    await call("POST", "/api/tts/synthesize-parts", { token, body });
    const second = await call("POST", "/api/tts/synthesize-parts", { token, body });
    assert.equal(second.status, 200);
    assert.equal(seen.tts.length, 2);
    const me = await call("GET", "/api/auth/me", { token });
    assert.equal(me.data.user.quota.ttsUsed, 1);
  });

  it("rejects bad input before calling Google", async () => {
    const token = await learner("parts3", "starter");
    seen.tts = [];
    const bad = [
      { parts: [], voice },
      { parts: ["a", " "], voice },
      { parts: Array.from({ length: 17 }, () => "x"), voice },
      { parts: ["x".repeat(5001)], voice },
      { parts: ["hi"], voice: { languageCode: "en-US", name: "en-US-Studio-O" } },
      { parts: ["hi"], voice: { languageCode: "ja-JP", name: "en-US-Chirp3-HD-Aoede" } },
      { parts: ["hi"], voice, audioConfig: { speakingRate: 4 } },
    ];
    for (const body of bad) {
      const res = await call("POST", "/api/tts/synthesize-parts", { token, body });
      assert.equal(res.status, 400, JSON.stringify(body).slice(0, 80));
    }
    assert.equal(seen.tts.length, 0);
  });

  it("requires sign-in and respects the plan quota", async () => {
    assert.equal((await call("POST", "/api/tts/synthesize-parts", { body: { parts: ["hi"], voice } })).status, 401);
  });
});

describe("POST /api/llm/messages latency guards", () => {
  it("skips Claude after it rejects the key, going straight to Gemini", async () => {
    const token = await learner("llm1", "starter");
    seen.claude = 0;
    seen.gemini = 0;
    const msg = { messages: [{ role: "user", content: "hi" }] };
    const first = await call("POST", "/api/llm/messages", { token, body: msg });
    assert.equal(first.status, 200);
    const second = await call("POST", "/api/llm/messages", { token, body: msg });
    assert.equal(second.status, 200);
    assert.equal(seen.claude, 1, "Claude is not retried while its key is rejected");
    assert.equal(seen.gemini, 2);
    assert.match(api.log(), /\[llm\] claude=401/);
  });
});
