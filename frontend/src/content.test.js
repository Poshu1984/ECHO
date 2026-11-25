import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LEARN_LANGS, LEVELS, TUTORS, UNLOCKS, canAccess } from "./content.js";
import { UI_LANGS, t } from "./i18n.js";

describe("content data integrity", () => {
  it("has unique learning language codes with a speech locale", () => {
    const codes = LEARN_LANGS.map((l) => l.code);
    assert.equal(new Set(codes).size, codes.length);
    for (const lang of LEARN_LANGS) assert.match(lang.speech, /^[a-z]{2}-[A-Z]{2}$/);
  });

  it("gives every tutor a voice for every learning language", () => {
    for (const tutor of TUTORS) {
      for (const lang of LEARN_LANGS) {
        assert.ok(tutor.voices[lang.code], `${tutor.id} has no ${lang.code} voice`);
      }
    }
  });

  it("orders levels from A1 upward with unique ids", () => {
    const ids = LEVELS.map((l) => l.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.deepEqual(LEVELS.map((l) => l.cefr), ["A1", "A2", "B1", "B2", "C1", "C2"]);
  });

  it("never lowers the XP needed as features unlock", () => {
    for (let i = 1; i < UNLOCKS.length; i += 1) {
      assert.ok(UNLOCKS[i].xp >= UNLOCKS[i - 1].xp);
    }
  });
});

describe("canAccess", () => {
  it("locks everything when nobody is signed in", () => {
    assert.equal(canAccess(null, "chat"), false);
  });

  it("opens free features at 0 XP and gates paid-by-XP features", () => {
    const user = { role: "user", xp: 0, unlocked: [] };
    assert.equal(canAccess(user, "chat"), true);
    assert.equal(canAccess(user, "vocab"), false);
    assert.equal(canAccess({ ...user, xp: 40 }, "vocab"), true);
    assert.equal(canAccess({ ...user, xp: 239 }, "exams"), false);
    assert.equal(canAccess({ ...user, xp: 240 }, "exams"), true);
  });

  it("lets admins and wildcard unlocks through", () => {
    assert.equal(canAccess({ role: "admin", xp: 0 }, "exams"), true);
    assert.equal(canAccess({ role: "user", xp: 0, unlocked: ["*"] }, "exams"), true);
  });
});

describe("i18n", () => {
  it("translates the login words in every UI language", () => {
    for (const ui of UI_LANGS) {
      for (const key of ["login", "register", "tag"]) {
        assert.notEqual(t(ui.id, key), key, `${ui.id} is missing ${key}`);
      }
    }
  });

  it("falls back to Chinese, then to the key itself", () => {
    assert.equal(t("xx", "login"), t("zh", "login"));
    assert.equal(t("en", "__no_such_key__"), "__no_such_key__");
  });
});
