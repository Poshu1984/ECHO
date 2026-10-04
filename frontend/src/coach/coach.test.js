import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PLAN_START, addDays, answersMatch, expectedMinutes, lessonFor, makeQuiz, passNeed, phaseFor, plannedMinutes, weekGoal, weekPlan, weekday,
} from "./plan.js";
import {
  applyAdjust, applyComplete, archiveText, emptyState, progressRows, recordResult, submitQuiz, weakLabel, weekStatus,
} from "./progress.js";

describe("calendar", () => {
  it("keeps the diagnosed start date on Sunday", () => {
    assert.equal(PLAN_START, "2026-10-04");
    assert.equal(weekday("2026-10-04"), 0);
    assert.equal(weekday("2026-10-05"), 1);
    assert.equal(weekday("2026-12-06"), 0);
  });

  it("assigns the confirmed exam phases", () => {
    assert.equal(phaseFor("2026-10-04").id, "n5");
    assert.equal(phaseFor("2026-12-06").id, "n5");
    assert.equal(phaseFor("2026-12-07").id, "n4");
    assert.equal(phaseFor("2027-07-04").id, "n4");
    assert.equal(phaseFor("2027-11-30").id, "bridge");
    assert.equal(phaseFor("2028-07-02").id, "n3");
  });
});

describe("time budget", () => {
  it("uses 90 minutes on weekdays and 120 on weekends before N5", () => {
    assert.deepEqual(plannedMinutes("2026-10-05"), { ja: 60, en: 30, total: 90, weekend: false });
    assert.equal(plannedMinutes("2026-10-04").total, 120);
    assert.equal(plannedMinutes("2026-10-10").total, 120);
  });

  it("builds a seven-day table and a lesson that sums to the day's minutes", () => {
    const table = weekPlan("2026-10-05");
    assert.equal(table.length, 7);
    assert.equal(table[0].ja + table[0].en, 90);
    assert.equal(table[6].total, 120);
    const lesson = lessonFor("2026-10-05", emptyState());
    const sum = lesson.blocks.reduce((total, block) => total + block.minutes, 0);
    assert.equal(sum, 90);
    assert.equal(lesson.blocks.some((block) => block.requireOutput), true);
  });

  it("does not call the first morning behind", () => {
    assert.equal(expectedMinutes("2026-10-04"), 0);
    assert.equal(weekGoal("2026-10-04"), 120);
    const report = applyAdjust(emptyState(), "2026-10-04").report;
    assert.equal(report.behindHours, false);
    assert.match(report.message, /還沒有學習紀錄/);
  });

  it("flags a missed weekday and switches to repair", () => {
    const report = applyAdjust(emptyState(), "2026-10-06").report;
    assert.equal(expectedMinutes("2026-10-06"), 90);
    assert.equal(report.behindHours, true);
    assert.match(report.remedy, /3 個/);
    const repaired = lessonFor("2026-10-06", { ...emptyState(), pace: "repair", repairUntil: "2026-10-12" });
    assert.match(repaired.blocks.find((block) => block.id === "ja-new").teach, /減量/);
  });
});

describe("practice and quizzes", () => {
  it("accepts kana with or without spaces", () => {
    const lesson = lessonFor("2026-10-04", emptyState());
    const block = lesson.blocks.find((item) => item.id === "ja-new");
    assert.equal(answersMatch(block, "あいうえお"), true);
    assert.equal(answersMatch(block, "あ い う え お"), true);
    assert.equal(answersMatch(block, ""), false);
    assert.match(block.teach, /あ/);
    assert.match(block.modelZh, /./);
  });

  it("grades a weekly quiz against the 70 percent bar", () => {
    const quiz = makeQuiz("week", "2026-10-11");
    assert.equal(quiz.items.length, 8);
    assert.equal(passNeed("week", 8, "n5"), 6);
    const answers = Object.fromEntries(quiz.items.map((item) => [item.id, item.answer || ""]));
    answers["en-write"] = "I stop because the words are new today.";
    const graded = submitQuiz(emptyState(), quiz, answers, "2026-10-11");
    assert.equal(graded.result.passed, true);
    assert.equal(graded.result.hits, 8);
  });

  it("keeps a wrong tag for review tomorrow, then spaces it out", () => {
    const quiz = makeQuiz("week", "2026-10-11");
    const item = quiz.items[0];
    const wrong = submitQuiz(emptyState(), quiz, { [item.id]: "錯" }, "2026-10-11");
    const saved = wrong.state.weaknesses.find((row) => row.id === item.id);
    assert.equal(saved.nextReview, "2026-10-12");
    assert.equal(saved.interval, 1);
    const again = recordResult(wrong.state, item, true, "2026-10-12");
    const moved = again.weaknesses.find((row) => row.id === item.id);
    assert.equal(moved.interval, 3);
    assert.equal(moved.nextReview, "2026-10-15");
  });

  it("uses a longer monthly paper with a reading item", () => {
    const quiz = makeQuiz("month", "2026-11-01");
    assert.equal(quiz.items.length, 12);
    assert.equal(passNeed("month", 12, "n5"), 8);
    assert.ok(quiz.items.some((item) => item.exam.includes("読解")));
    assert.ok(quiz.items.some((item) => item.exam.includes("IELTS")));
  });
});

describe("progress log", () => {
  it("replaces the same day instead of doubling it", () => {
    let state = applyComplete(emptyState(), { date: "2026-10-05", jaMin: 60, enMin: 30, kana: 5, enWrite: 10, note: "假名" });
    state = applyComplete(state, { date: "2026-10-05", jaMin: 40, enMin: 20, kana: 3, enWrite: 8, note: "改記" });
    const status = weekStatus(state, "2026-10-05");
    assert.equal(status.got, 60);
    const kana = progressRows(state, "2026-10-05").find((row) => row.key === "kana");
    assert.equal(kana.have, 3);
    assert.equal(kana.target, 92);
    assert.ok(kana.rate < 0.05);
  });

  it("writes a state archive the next chat can resume", () => {
    const state = applyComplete(emptyState(), { date: "2026-10-04", jaMin: 75, enMin: 45, note: "起步" });
    const text = archiveText(state, "2026-10-04");
    assert.match(text, /方案 1/);
    assert.match(text, /第一階段/);
    assert.match(text, /2\.0 小時/);
    assert.match(text, /明天預告：2026-10-05/);
  });

  it("hides internal lesson ids on the weakness list", () => {
    assert.equal(weakLabel({ tag: "lesson-ja-check-は" }), "日文助詞");
    assert.equal(weakLabel({ tag: "あ行" }), "あ行");
  });

  it("moves off kana drills after the writing gate", () => {
    const state = { ...emptyState(), counts: { kana: 80 } };
    const lesson = lessonFor("2026-10-20", state);
    assert.match(lesson.blocks.find((block) => block.id === "ja-new").teach, /漢字/);
  });
});

describe("dates", () => {
  it("adds days without drifting across the exam boundary", () => {
    assert.equal(addDays("2026-12-06", 1), "2026-12-07");
  });
});
