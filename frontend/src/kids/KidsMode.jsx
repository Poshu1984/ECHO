import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MASCOTS } from "../brandMascots.js";
import { HIRAGANA, HIRAGANA_ROWS } from "./kana.js";
import { allDone, buildChoices, buildQuiz, finishLesson, isUnlocked, recordAnswer, rowIndex, starsFor } from "./lesson.js";
import { loadProgress, saveProgress } from "./progress.js";
import { hasJapaneseVoice, onVoicesReady, speakJa, speechAvailable, stopJa } from "./speak.js";
import { kidsText } from "./strings.js";

const HOLD_MS = 2000;

function storage() {
  try { return window.localStorage; } catch { return null; }
}

function shuffled(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Shape({ tag, attrs }) {
  const Tag = tag;
  return <Tag {...attrs} />;
}

// Nami (the Japanese partner from brand CI v2). One face, three looks.
export function KidsMascot({ look = "hello", size = 120, talking = false }) {
  const data = MASCOTS.nami;
  const art = data.looks[look] || data.looks.hello;
  return (
    <svg className={`kids-mascot is-${look} ${talking ? "is-talking" : ""}`} viewBox={data.viewBox} width={size} height={size * 1.125} aria-hidden="true">
      <g className="kids-mascot-body">
        <ellipse cx="120" cy="252" rx="78" ry="10" fill="#000" opacity="0.12" />
        {art.body.map((s, i) => <Shape key={`b${i}`} {...s} />)}
        <g className="char-eyes">{art.eyes.map((s, i) => <Shape key={`e${i}`} {...s} />)}</g>
        <Shape {...art.mouth} />
      </g>
    </svg>
  );
}

function Stars({ n, label }) {
  return (
    <span className="kids-stars" role="img" aria-label={`${n} ${label}`}>
      {[0, 1, 2].map((i) => <span key={i} className={i < n ? "on" : ""} aria-hidden="true">★</span>)}
    </span>
  );
}

function HoldToExit({ label, hint, onExit }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef(null);
  const start = () => {
    if (timer.current) return;
    setHolding(true);
    timer.current = setTimeout(() => { timer.current = null; setHolding(false); onExit(); }, HOLD_MS);
  };
  const cancel = () => {
    clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      className={`kids-exit ${holding ? "is-holding" : ""}`}
      aria-label={`${label}（${hint}）`}
      title={hint}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !e.repeat) { e.preventDefault(); start(); } }}
      onKeyUp={(e) => { if (e.key === "Enter" || e.key === " ") cancel(); }}
      onBlur={cancel}
    >
      <span className="kids-exit-ring" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

function Word({ d }) {
  const chars = [...d.word];
  return (
    <span lang="ja" className="kids-word">
      {chars.map((c, i) => <span key={i} className={i === d.at ? "hit" : ""}>{c}</span>)}
    </span>
  );
}

// Without a Japanese voice the "listen" prompt cannot work, so show the
// picture word with the missing kana as a blank instead (visual cloze).
function Cloze({ d, label }) {
  const chars = [...d.word];
  return (
    <div className="kids-cloze" role="img" aria-label={label}>
      <span className="kids-emoji" aria-hidden="true">{d.emoji}</span>
      <span lang="ja" className="kids-word" aria-hidden="true">
        {chars.map((c, i) => (i === d.at ? <span key={i} className="blank">？</span> : <span key={i}>{c}</span>))}
      </span>
    </div>
  );
}

export default function KidsMode({ ui = "zh", onExit }) {
  const T = kidsText(ui);
  const [progress, setProgress] = useState(() => loadProgress(storage()));
  const [screen, setScreen] = useState("home");
  const [rowId, setRowId] = useState("a");
  const [step, setStep] = useState(0);
  const [order, setOrder] = useState([]);
  const [choices, setChoices] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [picked, setPicked] = useState("");
  const [wrong, setWrong] = useState("");
  const [score, setScore] = useState(0);
  const [voiceOk, setVoiceOk] = useState(() => speechAvailable() && hasJapaneseVoice());
  const [talking, setTalking] = useState(false);
  const talkTimer = useRef(null);
  const mainRef = useRef(null);
  const advanced = progress.mode === "advanced";
  const row = HIRAGANA_ROWS[Math.max(0, rowIndex(rowId))];

  useEffect(() => { saveProgress(storage(), progress); }, [progress]);
  useEffect(() => onVoicesReady(() => setVoiceOk(speechAvailable() && hasJapaneseVoice())), []);
  useEffect(() => () => { stopJa(); clearTimeout(talkTimer.current); }, []);
  useEffect(() => { mainRef.current?.focus?.({ preventScroll: true }); }, [screen]);

  const say = useCallback((text) => {
    if (!text) return;
    speakJa(text);
    setTalking(true);
    clearTimeout(talkTimer.current);
    talkTimer.current = setTimeout(() => setTalking(false), 900);
  }, []);

  const meetKana = screen === "meet" ? row.kana[step] : "";
  const findKana = screen === "find" ? order[step] : "";
  const quizItem = screen === "quiz" ? quiz[step] : null;

  useEffect(() => {
    if (meetKana) say(`${meetKana}。${HIRAGANA[meetKana].word}`);
  }, [meetKana, say]);
  useEffect(() => { if (findKana) say(findKana); }, [findKana, say]);
  useEffect(() => { if (quizItem) say(quizItem.target); }, [quizItem, say]);

  function exit() {
    stopJa();
    onExit?.();
  }

  function setMode(mode) {
    setProgress((p) => ({ ...p, mode }));
  }

  function openLesson(id) {
    if (!isUnlocked(progress, id)) return;
    setRowId(id);
    setStep(0);
    setPicked("");
    setWrong("");
    setScreen("meet");
  }

  function startFind() {
    const list = shuffled(row.kana);
    setOrder(list);
    setChoices(buildChoices(list[0], row.kana, advanced ? 3 : 2));
    setStep(0);
    setPicked("");
    setWrong("");
    setScreen("find");
  }

  function startQuiz() {
    setQuiz(buildQuiz(row.id, progress, progress.mode));
    setStep(0);
    setScore(0);
    setPicked("");
    setScreen("quiz");
  }

  function pickFind(k) {
    if (picked) return;
    if (k === findKana) {
      setPicked(k);
      setWrong("");
      setProgress((p) => recordAnswer(p, k, true));
      return;
    }
    setWrong(k);
    say(findKana);
  }

  function nextFind() {
    const n = step + 1;
    if (n >= order.length) { startQuiz(); return; }
    setStep(n);
    setChoices(buildChoices(order[n], row.kana, advanced ? 3 : 2));
    setPicked("");
    setWrong("");
  }

  function pickQuiz(k) {
    if (picked || !quizItem) return;
    const ok = k === quizItem.target;
    setPicked(k);
    setProgress((p) => recordAnswer(p, quizItem.target, ok));
    if (ok) setScore((s) => s + 1);
    else say(quizItem.target);
  }

  function nextQuiz() {
    const n = step + 1;
    if (n >= quiz.length) {
      setProgress((p) => finishLesson(p, row.id, score, quiz.length));
      setScreen("done");
      return;
    }
    setStep(n);
    setPicked("");
  }

  const totalStars = useMemo(() => Object.values(progress.stars).reduce((a, b) => a + b, 0), [progress.stars]);
  const nextRow = HIRAGANA_ROWS[rowIndex(row.id) + 1];
  const look = screen === "done" ? (starsFor(score, quiz.length) >= 2 ? "celebrate" : "focus")
    : (picked && (screen !== "quiz" || picked === quizItem?.target)) ? "celebrate"
      : (wrong || (screen === "quiz" && picked)) ? "focus" : "hello";

  let bubble = T.pickLesson;
  if (screen === "meet") bubble = T.meet;
  const ask = voiceOk ? T.findPrompt : T.clozePrompt;
  if (screen === "find") bubble = picked ? T.great : wrong ? (voiceOk ? T.tryAgain : T.tryAgainLook) : ask;
  if (screen === "quiz") bubble = !picked ? ask : picked === quizItem?.target ? T.great : T.itsThis;
  if (screen === "done") bubble = allDone(progress) ? T.allDoneMsg : starsFor(score, quiz.length) >= 2 ? T.passMsg : T.retryMsg;

  const stepLabel = { meet: T.meet, find: T.find, quiz: T.quiz }[screen];
  const stepCount = screen === "meet" ? row.kana.length : screen === "find" ? order.length : quiz.length;

  function choiceButtons(list, target, onPick, quizMode) {
    return (
      <div className={`kids-choices n${list.length}`}>
        {list.map((k) => {
          const isRight = picked && k === target;
          const isWrongPick = quizMode ? (picked === k && k !== target) : wrong === k;
          return (
            <button
              key={k}
              type="button"
              lang="ja"
              className={`kids-choice ${isRight ? "is-right" : ""} ${isWrongPick ? "is-wrong" : ""}`}
              aria-label={k}
              aria-disabled={picked ? "true" : undefined}
              onClick={() => onPick(k)}
            >
              {k}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="kids-shell" role="application" aria-label={T.title}>
      <header className="kids-top">
        <HoldToExit label={T.exitHold} hint={T.exitHint} onExit={exit} />
        <div className="kids-total" aria-label={`${totalStars} ${T.stars}`}>
          <span aria-hidden="true">★</span> {totalStars}
        </div>
      </header>

      <div className="kids-guide">
        <KidsMascot look={look} talking={talking} size={92} />
        <p className={`kids-bubble ${talking ? "is-talking" : ""}`} aria-live="polite">{bubble}</p>
      </div>

      <main className="kids-main" ref={mainRef} tabIndex={-1}>
        {screen === "home" && (
          <>
            <h1 className="kids-title">{T.title}</h1>
            <div className="kids-mode" role="radiogroup" aria-label={T.modeLabel}>
              {[["little", T.little, T.littleAge], ["advanced", T.advanced, T.advancedAge]].map(([id, name, age]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={progress.mode === id}
                  className={progress.mode === id ? "on" : ""}
                  onClick={() => setMode(id)}
                >
                  <b>{name}</b><small>{age}</small>
                </button>
              ))}
            </div>
            <div className="kids-map">
              {HIRAGANA_ROWS.map((r, i) => {
                const open = isUnlocked(progress, r.id);
                const stars = progress.stars[r.id] || 0;
                return (
                  <button
                    key={r.id}
                    type="button"
                    className={`kids-lesson ${open ? "" : "is-locked"} ${stars ? "is-done" : ""}`}
                    aria-disabled={open ? undefined : "true"}
                    aria-label={`${T.lessonOf(i + 1)} ${r.kana.join(" ")}${open ? "" : `（${T.locked}）`}`}
                    onClick={() => openLesson(r.id)}
                  >
                    <span className="kids-lesson-no">{i + 1}</span>
                    <span lang="ja" className="kids-lesson-kana">{r.kana.join("")}</span>
                    {open ? <Stars n={stars} label={T.stars} /> : <span className="kids-lock" aria-hidden="true">🔒</span>}
                  </button>
                );
              })}
            </div>
            {!voiceOk && <p className="kids-note" role="status">{T.noVoice}</p>}
          </>
        )}

        {(screen === "meet" || screen === "find" || screen === "quiz") && (
          <div className="kids-steps" aria-label={`${T.lessonOf(rowIndex(row.id) + 1)} · ${stepLabel} ${step + 1}/${stepCount}`}>
            <span className={screen === "meet" ? "on" : "past"}>{T.meet}</span>
            <span className={screen === "find" ? "on" : screen === "quiz" ? "past" : ""}>{T.find}</span>
            <span className={screen === "quiz" ? "on" : ""}>{T.quiz}</span>
            <span className="kids-dots" aria-hidden="true">
              {Array.from({ length: stepCount }, (_, i) => <i key={i} className={i < step ? "past" : i === step ? "on" : ""} />)}
            </span>
          </div>
        )}

        {screen === "meet" && (() => {
          const d = HIRAGANA[meetKana];
          return (
            <section className="kids-card-wrap">
              <button type="button" className="kids-card" aria-label={`${T.listen}：${T.kanaLabel(d.kana, d.romaji)}`} onClick={() => say(`${d.kana}。${d.word}`)}>
                <span lang="ja" className="kids-kana">{d.kana}</span>
                {advanced && <span className="kids-romaji">{d.romaji}</span>}
              </button>
              <button type="button" className="kids-picture" aria-label={T.wordLabel(d.word, T.meaning(d))} onClick={() => say(d.word)}>
                <span className="kids-emoji" aria-hidden="true">{d.emoji}</span>
                <Word d={d} />
                <small>{T.meaning(d)}</small>
              </button>
              {advanced && (
                <p className="kids-tip"><b>{T.tip}</b>{T.tipOf(d)}</p>
              )}
              <div className="kids-nav">
                <button type="button" className="kids-btn ghost" onClick={() => (step === 0 ? setScreen("home") : setStep(step - 1))}>
                  ◀ {step === 0 ? T.map : T.prev}
                </button>
                <button type="button" className="kids-btn sound" aria-label={T.listen} onClick={() => say(`${d.kana}。${d.word}`)}>🔊</button>
                <button type="button" className="kids-btn go" onClick={() => (step + 1 < row.kana.length ? setStep(step + 1) : startFind())}>
                  {step + 1 < row.kana.length ? T.next : T.find} ▶
                </button>
              </div>
            </section>
          );
        })()}

        {screen === "find" && findKana && (
          <section className="kids-card-wrap">
            {voiceOk ? (
              <button type="button" className="kids-ear" aria-label={T.listen} onClick={() => say(findKana)}>
                <span aria-hidden="true">🔊</span>
                {!advanced && <span className="kids-hint-emoji" aria-hidden="true">{HIRAGANA[findKana].emoji}</span>}
              </button>
            ) : <Cloze d={HIRAGANA[findKana]} label={T.clozeLabel(T.meaning(HIRAGANA[findKana]))} />}
            {choiceButtons(choices, findKana, pickFind, false)}
            <div className="kids-nav">
              <button type="button" className="kids-btn go" disabled={!picked} onClick={nextFind}>
                {step + 1 < order.length ? T.next : T.quiz} ▶
              </button>
            </div>
          </section>
        )}

        {screen === "quiz" && quizItem && (
          <section className="kids-card-wrap">
            {voiceOk ? (
              <button type="button" className="kids-ear" aria-label={T.listen} onClick={() => say(quizItem.target)}>
                <span aria-hidden="true">🔊</span>
                {quizItem.review && <span className="kids-review">{T.review}</span>}
              </button>
            ) : <Cloze d={HIRAGANA[quizItem.target]} label={T.clozeLabel(T.meaning(HIRAGANA[quizItem.target]))} />}
            {choiceButtons(quizItem.choices, quizItem.target, pickQuiz, true)}
            {picked && advanced && (
              <p className="kids-tip" lang="ja">{quizItem.target} = {HIRAGANA[quizItem.target].romaji}</p>
            )}
            <div className="kids-nav">
              <button type="button" className="kids-btn go" disabled={!picked} onClick={nextQuiz}>
                {T.nextQ} ▶
              </button>
            </div>
          </section>
        )}

        {screen === "done" && (
          <section className="kids-card-wrap kids-done">
            <h2 className="kids-title">{T.doneTitle}</h2>
            <div className="kids-big-stars"><Stars n={starsFor(score, quiz.length)} label={T.stars} /></div>
            <p className="kids-score">{T.doneScore(score, quiz.length)}</p>
            <div className="kids-nav column">
              {nextRow && isUnlocked(progress, nextRow.id) && (
                <button type="button" className="kids-btn go" onClick={() => openLesson(nextRow.id)}>{T.nextLesson} ▶</button>
              )}
              <button type="button" className="kids-btn" onClick={startQuiz}>{T.again}</button>
              <button type="button" className="kids-btn ghost" onClick={() => setScreen("home")}>{T.map}</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
