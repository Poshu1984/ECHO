// Boots a private copy of the API in a temp folder (backend/data is never
// touched) with the given environment, for end-to-end tests.
import { spawn } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export function freePort() {
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

const SCRUB = [
  "GOOGLE_TTS_API_KEY", "GOOGLE_GEMINI_API_KEY", "ANTHROPIC_API_KEY", "FRONTEND_URL",
  "ECHOO_ADMIN_USER", "ECHOO_ADMIN_PASSWORD", "TTS_API_BASE", "ANTHROPIC_API_BASE", "GEMINI_API_BASE",
];

export async function startServer(extraEnv = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "echo-api-"));
  for (const name of readdirSync(here)) {
    if (name.endsWith(".js") && !name.endsWith(".test.js")) cpSync(path.join(here, name), path.join(dir, name));
  }
  cpSync(path.join(here, "routes"), path.join(dir, "routes"), { recursive: true });
  cpSync(path.join(here, "package.json"), path.join(dir, "package.json"));
  symlinkSync(path.join(here, "node_modules"), path.join(dir, "node_modules"), "dir");
  const port = await freePort();
  const env = { ...process.env };
  for (const key of SCRUB) delete env[key];
  Object.assign(env, { PORT: String(port), JWT_SECRET: "ci-only-secret" }, extraEnv);
  let log = "";
  const child = spawn(process.execPath, ["server.js"], { cwd: dir, env, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", (d) => { log += d; });
  child.stderr.on("data", (d) => { log += d; });
  const base = `http://127.0.0.1:${port}`;
  const end = Date.now() + 15000;
  for (;;) {
    if (child.exitCode !== null) throw new Error(`server exited early (${child.exitCode}):\n${log}`);
    try {
      const res = await fetch(`${base}/api/health`);
      if (res.ok) break;
    } catch {
      // not up yet
    }
    if (Date.now() > end) throw new Error(`server did not start:\n${log}`);
    await new Promise((r) => setTimeout(r, 100));
  }
  return {
    base,
    log: () => log,
    stop() {
      child.kill();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

export function caller(base) {
  return async function call(method, route, { body, token } = {}) {
    const res = await fetch(`${base}${route}`, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  };
}
