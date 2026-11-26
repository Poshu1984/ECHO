// Kids-mode smoke test (Playwright). Not part of `npm test` yet.
// Usage: start backend + frontend locally, then
//   BASE_URL=http://127.0.0.1:5173 KIDS_USER=... KIDS_PASS=... node e2e/kids.smoke.mjs [outDir]
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import fs from "node:fs";

// Resolve Playwright from the machine (global install) or a local devDependency.
const { chromium, devices } = createRequire(import.meta.url)("playwright");
const { HIRAGANA } = await import("../src/kids/kana.js");
const byEmoji = Object.fromEntries(Object.values(HIRAGANA).map((d) => [d.emoji, d.kana]));

const BASE = process.env.BASE_URL || "http://localhost:5173";
const API = process.env.API_URL || "http://localhost:3000";
const USER = process.env.KIDS_USER;
const PASS = process.env.KIDS_PASS;
const OUT = process.argv[2] || "e2e-out";
fs.mkdirSync(OUT, { recursive: true });

// Fake on-device Japanese voice so we can see what would be spoken.
const fakeSpeech = () => {
  window.__spoken = [];
  const voices = [{ name: "Fake JA", lang: "ja-JP", localService: true, default: true, voiceURI: "fake" }];
  const synth = {
    getVoices: () => voices, speak: (u) => window.__spoken.push(u.text), cancel() {},
    addEventListener() {}, removeEventListener() {}, speaking: false, pending: false, paused: false,
  };
  Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
  window.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text) { this.text = text; };
};

async function login(page) {
  await page.goto(BASE);
  const inputs = page.locator("form input");
  await inputs.nth(0).fill(USER);
  await inputs.nth(1).fill(PASS);
  await page.locator("form button.btn-primary").click();
  await page.locator(".app-nav").waitFor();
}

async function run({ name, device, speech }) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...device });
  if (speech) await ctx.addInitScript(fakeSpeech);
  const page = await ctx.newPage();
  const errors = [];
  // Google Fonts may be unreachable in sandboxes; that is environmental, not an app error.
  const isFont = (u) => /fonts\.(googleapis|gstatic)\.com/.test(u || "");
  page.on("console", (m) => { if (m.type() === "error" && !isFont(m.location()?.url)) errors.push(`${m.text()} @ ${m.location()?.url}`); });
  page.on("pageerror", (e) => errors.push(String(e)));
  await login(page);

  const offOrigin = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (![new URL(BASE).origin, new URL(API).origin].includes(u.origin) && !/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) offOrigin.push(r.url());
  });
  const apiCalls = [];
  page.on("request", (r) => { if (/\/api\//.test(r.url())) apiCalls.push(r.url()); });

  await page.locator(".app-nav .nav-btn").first().click();
  await page.locator(".kids-shell .kids-map").waitFor();
  await page.screenshot({ path: `${OUT}/${name}-1-home.png` });

  const width = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth, document.querySelector(".kids-shell").scrollWidth]);
  assert.ok(width[2] <= width[1], `kids shell overflows horizontally: ${width}`);
  const small = await page.evaluate(() => [...document.querySelectorAll(".kids-lesson, .kids-mode button")]
    .map((b) => b.getBoundingClientRect()).filter((r) => r.height < 64 || r.width < 64).length);
  assert.equal(small, 0, "touch targets under 64px on home");

  assert.equal(await page.locator(".kids-lesson.is-locked").count(), 9, "only lesson 1 open");
  if (!speech) assert.ok(await page.locator(".kids-note").isVisible(), "no-voice notice visible");
  if (speech) assert.equal(await page.locator(".kids-note").count(), 0, "no notice when a voice exists");

  await page.locator(".kids-lesson").first().click();
  await page.locator(".kids-card").waitFor();
  await page.screenshot({ path: `${OUT}/${name}-2-meet.png` });
  for (let i = 0; i < 5; i += 1) await page.locator(".kids-btn.go").click();

  const lastSpoken = () => page.evaluate(() => window.__spoken?.at(-1) || "");
  const answer = async (wrongFirst) => {
    let target = speech ? await lastSpoken() : "";
    const labels = await page.locator(".kids-choice").allTextContents();
    if (!speech) target = byEmoji[(await page.locator(".kids-cloze .kids-emoji").textContent()).trim()];
    if (wrongFirst) {
      const wrong = labels.find((l) => l !== target);
      if (wrong) await page.locator(".kids-choice", { hasText: wrong }).click();
    }
    await page.locator(".kids-choice", { hasText: target }).click();
  };

  // listen & find: must get each one right
  for (let i = 0; i < 5; i += 1) {
    await page.locator(".kids-ear, .kids-cloze").first().waitFor();
    await answer(i === 0);
    if (i === 0) await page.screenshot({ path: `${OUT}/${name}-3-find.png` });
    assert.ok(await page.locator(".kids-btn.go").isEnabled(), "next enabled after right answer");
    await page.locator(".kids-btn.go").click();
  }
  // quiz
  for (let i = 0; i < 5; i += 1) {
    await page.locator(".kids-ear, .kids-cloze").first().waitFor();
    await answer(false);
    if (i === 0) await page.screenshot({ path: `${OUT}/${name}-4-quiz.png` });
    await page.locator(".kids-btn.go").click();
  }
  await page.locator(".kids-done").waitFor();
  await page.screenshot({ path: `${OUT}/${name}-5-done.png` });
  assert.equal(await page.locator(".kids-big-stars .on").count(), 3, "perfect quiz → 3 stars");
  if (speech) {
    await page.locator(".kids-btn.go", { hasText: /下一課|Next lesson/ }).click();
    await page.locator(".kids-card").waitFor();
    assert.ok((await lastSpoken()).startsWith("か"), "lesson 2 starts with か");
    await page.locator(".kids-btn.ghost").click(); // back to map
    assert.equal(await page.locator(".kids-lesson.is-locked").count(), 8, "lesson 2 unlocked");
  }

  // reload keeps progress
  await page.reload();
  await page.locator(".app-nav").waitFor();
  await page.locator(".app-nav .nav-btn").first().click();
  await page.locator(".kids-map").waitFor();
  const stars = await page.locator(".kids-lesson").first().locator(".on").count();
  assert.ok(stars >= 1, "progress survives reload");

  // quick tap does not exit; holding does
  const exit = page.locator(".kids-exit");
  await exit.click();
  assert.ok(await page.locator(".kids-shell").isVisible(), "a tap must not exit");
  const box = await exit.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2300);
  await page.mouse.up();
  await page.locator(".app-header").waitFor();

  assert.deepEqual(errors, [], `console errors: ${errors.join("\n")}`);
  assert.deepEqual(offOrigin, [], `unexpected third-party requests: ${offOrigin.join(", ")}`);
  // Kids mode itself makes no API calls; anything listed is the adult app's
  // existing background polling (health / session), shown for transparency.
  const paths = [...new Set(apiCalls.map((u) => new URL(u).pathname))];
  console.log(`${name}: ok · API paths seen while in kids mode: ${paths.join(", ") || "none"}`);
  await browser.close();
}

await run({ name: "phone-voice", device: devices["iPhone 13"], speech: true });
await run({ name: "phone-novoice", device: devices["Pixel 5"], speech: false });
await run({ name: "desktop", device: { viewport: { width: 1280, height: 800 } }, speech: true });
