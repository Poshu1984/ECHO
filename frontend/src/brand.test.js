import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { MASCOTS } from "./brandMascots.js";
import { UI_LANGS, t } from "./i18n.js";

const pub = new URL("../public/", import.meta.url);

describe("Lingostep brand assets", () => {
  it("ships the logo, app icons and UI icons the app references", () => {
    for (const file of [
      "brand/logo/lockup-primary.png", "brand/logo/mark-primary.svg", "brand/mascots/lingostep-lineup.png",
      "brand/app/lingostep-180.png", "brand/app/lingostep-192.png", "brand/app/lingostep-512.png", "brand/app/favicon.svg",
      ...["speak", "listen", "read", "grammar", "write", "retry", "confused", "review", "mastered"].map((n) => `brand/icons/${n}.svg`),
    ]) assert.ok(existsSync(new URL(file, pub)), file);
  });

  it("points the PWA manifest at the new name and icons", () => {
    const manifest = JSON.parse(readFileSync(new URL("manifest.webmanifest", pub), "utf8"));
    assert.equal(manifest.short_name, "Lingostep");
    for (const icon of manifest.icons) assert.ok(existsSync(new URL(icon.src.slice(1), pub)), icon.src);
  });

  it("has three mascots with three looks, each with eyes and a mouth", () => {
    for (const id of ["koto", "pip", "nami"]) {
      for (const look of ["hello", "focus", "celebrate"]) {
        const l = MASCOTS[id].looks[look];
        assert.ok(l.body.length >= 6, `${id} ${look} body`);
        assert.ok(l.eyes.length >= 2, `${id} ${look} eyes`);
        assert.ok(l.mouth && l.mouthCenter.every(Number.isFinite), `${id} ${look} mouth`);
      }
    }
  });

  it("uses the new slogan in every UI language", () => {
    for (const ui of UI_LANGS) assert.doesNotMatch(t(ui.id, "tagShort"), /YOUR FUTURE/, ui.id);
  });
});
