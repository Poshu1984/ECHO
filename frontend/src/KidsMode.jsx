import { useEffect, useRef, useState } from "react";
import { t } from "./i18n.js";
import { MASCOTS } from "./brandMascots.js";
import { KANA_ROWS, KANA_TIPS, kanaByChar, rowById } from "./kidsHiragana.js";
import { answer, bandOf, buildQuiz, currentOf, isUnlocked, startRound, starsFor } from "./kidsQuiz.js";
import { clearProgress, loadProgress, recordRound, saveProgress, totalStars, withBand } from "./kidsProgress.js";
import { hasJaVoice, sayJa, sayZh, stopKidsVoice } from "./kidsVoice.js";

const HOLD_MS = 2000;

function Shape({ tag, attrs }) {
  const Tag = tag;
  return <Tag {...attrs} />;
}

// Nami (the brand's Japanese partner) with one of the three CI looks.
export function KidsMascot({ look = "hello", size = 120, talking = false }) {
  const data = MASCOTS.nami;
  const pose = data.looks[look] || data.looks.hello;
  return (
    <svg className={`kids-mascot ${talking ? "is-talking" : ""}`} viewBox={data.viewBox} width={size} height={size * 1.125} aria-hidden="true">
      <g className="char">
        {pose.body.map((s, i) => <Shape key={`b${i}`} {...s} />)}
        <g className="char-eyes">{pose.eyes.map((s, i) => <Shape key={`e${i}`} {...s} />)}</g>
        <Shape {...pose.mouth} />
      </g>
    </svg>
  );
}

function Stars({ n, label }) {
  return (
    <span className="kids-stars" aria-label={`${n} ${label}`}>
      {[0, 1, 2].map((i) => <span key={i} className={i < n ? "on" : ""} aria-hidden="true">★</span>)}
    </span>
  );
}

function WordLine({ kana }) {
  const chars = [...kana.word];
  return (
    <span lang="ja" className="kids-word">
      {chars.map((c, i) => <span key={i} className={i === kana.at ? "hit" : ""}>{c}</span>)}
    </span>
  );
}

function HoldButton({ label, hint, onDone }) {
  const [pct, setPct] = useState(0);
  const timer = useRef(null);
  const started = useRef(0);
  const stop = () => {
    if (timer.current) cancelAnimationFrame(timer.current);
    timer.current = null;
    setPct(0);
  };
  const tick = () => {
    const p = Math.min(1, (performance.now() - started.current) / HOLD_MS);
    setPct(p);
    if (p >= 1) {
      stop();
      onDone();
      return;
    }
    timer.current = requestAnimationFrame(tick);
  };
  const start = () => {
    if (timer.current) return;
    started.current = performance.now();
    timer.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => { if (timer.current) cancelAnimationFrame(timer.current); }, []);
  return (
    <button
      type="button"
      className="kids-hold"
      aria-label={label}
      title={hint}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !e.repeat) { e.preventDefault(); start(); } }}
      onKeyUp={(e) => { if (e.key === "Enter" || e.key === " ") stop(); }}
      style={{ "--hold": pct }}
    >
      <span aria-hidden="true">⏻</span>
      <span className="kids-hold-label">{label}</span>
    </button>
  );
}

export default function KidsMode({ ui, onExit }) {
  const lang = ui === "zh" ? "zh" : "en";
  const kt = (k) => t(lang, k);
  const [progress, setProgress] = useState(loadProgress);
  const [screen, setScreen] = useState("map");
  const [rowId, setRowId] = useState("a");
  const [learnAt, setLearnAt] = useState(0);
  const [round, setRound] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [note, setNote] = useState("");
  const [parentOpen, setParentOpen] = useState(false);
  const [voiceOk, setVoiceOk] = useState(true);
  const advanceTimer = useRef(null);
  const band = bandOf(progress.band);
  const row = rowById(rowId) || KANA_ROWS[0];

  useEffect(() => { saveProgress(progress); }, [progress]);
  useEffect(() => () => { stopKidsVoice(); clearTimeout(advanceTimer.current); }, []);
  useEffect(() => {
    const check = () => setVoiceOk(hasJaVoice());
    check();
    const s = typeof window !== "undefined" ? window.speechSynthesis : null;
    s?.addEventListener?.("voiceschanged", check);
    return () => s?.removeEventListener?.("voiceschanged", check);
  }, []);

  async function play(text, opts) {
    const via = await sayJa(text, opts);
    setVoiceOk(via !== "none");
  }

  function goMap() {
    stopKidsVoice();
    clearTimeout(advanceTimer.current);
    setRound(null);
    setFeedback("");
    setScreen("map");
  }

  function openRow(id) {
    if (!isUnlocked(id, progress)) {
      setNote(kt("kidsLocked"));
      return;
    }
    setNote("");
    setRowId(id);
    setLearnAt(0);
    setScreen("learn");
    const first = rowById(id).kana[0];
    play(first.k);
  }

  function showKana(i) {
    setLearnAt(i);
    play(row.kana[i].k);
  }

  function startQuiz() {
    const r = startRound(buildQuiz(rowId, progress, band.id));
    setRound(r);
    setFeedback("");
    setScreen("quiz");
    if (band.id === "little") sayZh(kt("kidsListenPick"));
    const q = currentOf(r);
    if (q) setTimeout(() => play(q.target), band.id === "little" ? 1600 : 200);
  }

  function pick(ch) {
    if (!round || feedback === "ok") return;
    const { state, correct } = answer(round, ch);
    if (!correct) {
      setRound(state);
      setFeedback("again");
      const q = currentOf(state);
      if (q) setTimeout(() => play(q.target), 450);
      return;
    }
    setFeedback("ok");
    setRound(state);
    advanceTimer.current = setTimeout(() => {
      setFeedback("");
      if (state.done) {
        const stars = starsFor(state);
        setProgress((p) => recordRound(p, rowId, state, stars));
        setScreen("done");
        return;
      }
      const q = currentOf(state);
      if (q) play(q.target);
    }, 900);
  }

  function nextRowId() {
    const idx = KANA_ROWS.findIndex((r) => r.id === rowId);
    return KANA_ROWS[idx + 1]?.id || "";
  }

  function chooseBand(id) {
    setProgress((p) => withBand(p, id));
    setParentOpen(false);
  }

  const header = (
    <header className="kids-top">
      {screen !== "map" ? (
        <button type="button" className="kids-round-btn" onClick={goMap} aria-label={kt("kidsBack")}>
          <span aria-hidden="true">←</span>
        </button>
      ) : <span className="kids-total" aria-label={`${totalStars(progress)} ${kt("kidsStars")}`}>★ {totalStars(progress)}</span>}
      <h1 className="kids-title">{kt("kidsTitle")}</h1>
      <HoldButton label={kt("kidsExitHold")} hint={kt("kidsExitHint")} onDone={() => { stopKidsVoice(); onExit(); }} />
    </header>
  );

  if (!progress.band) {
    return (
      <div className="kids-shell" data-screen="band">
        {header}
        <main className="kids-main kids-center">
          <KidsMascot look="hello" size={140} />
          <h2 className="kids-h2">{kt("kidsBandAsk")}</h2>
          <div className="kids-band-grid">
            <button type="button" className="kids-band" onClick={() => chooseBand("little")}>
              <span className="kids-band-age">{kt("kidsBandLittle")}</span>
              <span className="kids-band-hint">{kt("kidsBandLittleHint")}</span>
            </button>
            <button type="button" className="kids-band" onClick={() => chooseBand("big")}>
              <span className="kids-band-age">{kt("kidsBandBig")}</span>
              <span className="kids-band-hint">{kt("kidsBandBigHint")}</span>
            </button>
          </div>
          <p className="kids-privacy">{kt("kidsPrivacy")}</p>
        </main>
      </div>
    );
  }

  if (screen === "learn") {
    const kana = row.kana[learnAt];
    const tip = KANA_TIPS[kana.k];
    const last = learnAt >= row.kana.length - 1;
    return (
      <div className="kids-shell" data-screen="learn">
        {header}
        <main className="kids-main kids-center">
          <p className="kids-step" aria-live="polite">{row.label} · {learnAt + 1} / {row.kana.length}</p>
          <button type="button" className="kids-kana-big" lang="ja" onClick={() => play(kana.k)} aria-label={`${kana.k}（${kana.r}）`}>
            {kana.k}
          </button>
          {band.romaji ? <p className="kids-romaji">{kana.r}</p> : null}
          <button type="button" className="kids-pic" onClick={() => play(kana.word)} aria-label={`${kana.word}（${lang === "zh" ? kana.zh : kana.en}）`}>
            <span className="kids-emoji" aria-hidden="true">{kana.pic}</span>
            <WordLine kana={kana} />
            <span className="kids-gloss">{lang === "zh" ? kana.zh : kana.en}</span>
          </button>
          {!voiceOk ? <p className="kids-warn" role="status">{kt("kidsNoVoice")}</p> : null}
          {tip ? (
            <details className="kids-tip">
              <summary>{kt("kidsTipTitle")}</summary>
              <p>{tip[lang]}</p>
            </details>
          ) : null}
          <div className="kids-row-btns">
            <button type="button" className="kids-round-btn" disabled={learnAt === 0} onClick={() => showKana(learnAt - 1)} aria-label="←">
              <span aria-hidden="true">←</span>
            </button>
            {last ? (
              <button type="button" className="kids-go" onClick={startQuiz}>{kt("kidsStartQuiz")}</button>
            ) : (
              <button type="button" className="kids-go" onClick={() => showKana(learnAt + 1)}>{kt("kidsNext")} →</button>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (screen === "quiz" && round) {
    const q = currentOf(round);
    const shown = q || round.queue[round.queue.length - 1];
    const answered = feedback === "ok";
    const asked = Math.min(round.at + (answered ? 0 : 1), round.queue.length);
    const target = kanaByChar(shown.target);
    return (
      <div className="kids-shell" data-screen="quiz">
        {header}
        <main className="kids-main kids-center">
          <div className="kids-progress" role="progressbar" aria-valuemin={0} aria-valuemax={round.queue.length} aria-valuenow={round.at}>
            <span style={{ width: `${(round.at / round.queue.length) * 100}%` }} />
          </div>
          <div className="kids-ask">
            <KidsMascot look={answered ? "celebrate" : "focus"} size={96} />
            <button type="button" className="kids-listen" onClick={() => play(shown.target)} aria-label={kt("kidsListenAgain")}>
              <span aria-hidden="true">🔊</span>
            </button>
          </div>
          <p className="kids-prompt">{kt("kidsListenPick")} <span className="sr-only">({asked} / {round.queue.length})</span></p>
          <div className={`kids-choices n${shown.options.length}`}>
            {shown.options.map((ch) => {
              const wrong = round.wrongPicks.includes(ch);
              const right = answered && ch === shown.target;
              return (
                <button
                  key={ch}
                  type="button"
                  lang="ja"
                  className={`kids-choice ${wrong ? "wrong" : ""} ${right ? "right" : ""}`}
                  disabled={wrong || answered}
                  aria-label={ch}
                  onClick={() => pick(ch)}
                >
                  {ch}
                </button>
              );
            })}
          </div>
          <p className={`kids-feedback ${feedback}`} role="status" aria-live="polite">
            {feedback === "ok" ? kt("kidsGreat") : feedback === "again" ? kt("kidsTryAgain") : " "}
            {answered && band.romaji && target ? <span className="kids-romaji-inline"> {target.k} = {target.r}</span> : null}
          </p>
          {!voiceOk ? <p className="kids-warn" role="status">{kt("kidsNoVoice")}</p> : null}
        </main>
      </div>
    );
  }

  if (screen === "done") {
    const stars = progress.rows[rowId]?.stars || 0;
    const next = nextRowId();
    return (
      <div className="kids-shell" data-screen="done">
        {header}
        <main className="kids-main kids-center">
          <KidsMascot look="celebrate" size={160} />
          <h2 className="kids-h2" role="status">{kt("kidsRoundDone")}</h2>
          <Stars n={round ? starsFor(round) : stars} label={kt("kidsStars")} />
          <div className="kids-row-btns">
            <button type="button" className="kids-go ghost" onClick={goMap}>{kt("kidsBack")}</button>
            {next ? <button type="button" className="kids-go" onClick={() => openRow(next)}>{rowById(next).label} →</button> : null}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="kids-shell" data-screen="map">
      {header}
      <main className="kids-main">
        <div className="kids-hello">
          <KidsMascot look="hello" size={88} />
          <p lang="ja" className="kids-hello-kana">あいうえお</p>
        </div>
        <ol className="kids-map">
          {KANA_ROWS.map((r) => {
            const open = isUnlocked(r.id, progress);
            const stars = progress.rows[r.id]?.stars || 0;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  className={`kids-tile ${open ? "" : "locked"} ${stars ? "done" : ""}`}
                  onClick={() => openRow(r.id)}
                  aria-disabled={!open}
                  aria-label={`${r.label}${open ? "" : `（${kt("kidsLocked")}）`}`}
                >
                  <span lang="ja" className="kids-tile-kana">{open ? r.kana[0].k : "🔒"}</span>
                  <span lang="ja" className="kids-tile-label">{r.label}</span>
                  <Stars n={stars} label={kt("kidsStars")} />
                </button>
              </li>
            );
          })}
        </ol>
        <p className="kids-note" role="status" aria-live="polite">{note}</p>
        <section className="kids-parent">
          <button type="button" className="kids-parent-toggle" aria-expanded={parentOpen} onClick={() => setParentOpen((v) => !v)}>
            {kt("kidsParent")}
          </button>
          {parentOpen ? (
            <div className="kids-parent-body">
              <p>{kt("kidsPrivacy")}</p>
              <p>{kt("kidsBandChange")}：
                <button type="button" className={`kids-chip ${band.id === "little" ? "on" : ""}`} aria-pressed={band.id === "little"} onClick={() => chooseBand("little")}>{kt("kidsBandLittle")}</button>
                <button type="button" className={`kids-chip ${band.id === "big" ? "on" : ""}`} aria-pressed={band.id === "big"} onClick={() => chooseBand("big")}>{kt("kidsBandBig")}</button>
              </p>
              <button
                type="button"
                className="kids-chip danger"
                onClick={() => {
                  if (typeof window !== "undefined" && !window.confirm(kt("kidsClearConfirm"))) return;
                  setProgress(clearProgress());
                  setParentOpen(false);
                }}
              >
                {kt("kidsClear")}
              </button>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
