import { useEffect, useRef, useState } from "react";
import { api, clearSession, loadUser, setSession } from "./api.js";
import { t } from "./i18n.js";
import { armAudio, pickGoogleVoice, speakOnDevice } from "./tts.js";
import {
  LEARN_LANGS, LEVELS, TUTORS, UNLOCKS, canAccess, GREET, VOCAB, SCENES, EXAMS, PASSAGES,
} from "./content.js";
import {
  beatsOf, isCjk, joinBeats, nativeLangName, sentenceRange, ssmlFromBeats,
  timesEstimated, timesFromPoints,
} from "./beats.js";
import { BeatLine, useBeatAudio } from "./karaoke.jsx";

export default function App() {
  const [user, setUser] = useState(loadUser);
  const [authMode, setAuthMode] = useState("login");
  const [handle, setHandle] = useState("");
  const [pass, setPass] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [ui, setUi] = useState(localStorage.getItem("echoo-ui") || "zh");
  const [tab, setTab] = useState("chat");
  const [lang, setLang] = useState(LEARN_LANGS[0]);
  const [level, setLevel] = useState("B1");
  const [tutorId, setTutorId] = useState("nova");
  const [engine, setEngine] = useState("cloud");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [passage, setPassage] = useState(null);
  const [vocabI, setVocabI] = useState(0);
  const [showAns, setShowAns] = useState(false);
  const [examI, setExamI] = useState(0);
  const [examPick, setExamPick] = useState(-1);
  const [nodes, setNodes] = useState([]);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installHint, setInstallHint] = useState(false);
  const [trackId, setTrackId] = useState("");
  const beat = useBeatAudio();
  const trackRef = useRef({ id: "", tokens: [], text: "", mode: "" });
  const tutor = TUTORS.find((x) => x.id === tutorId) || TUTORS[0];
  const tr = (k) => t(ui, k);
  const showNative = ui !== lang.code;
  const joiner = isCjk(lang.code) ? "" : " ";
  const highlight = beat.active;

  useEffect(() => { localStorage.setItem("echoo-ui", ui); }, [ui]);
  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);
  useEffect(() => {
    if (!user) return;
    api.me().then((d) => setUser(d.user)).catch(() => { clearSession(); setUser(null); });
  }, []);

  useEffect(() => {
    if (user?.role === "admin") api.users().then((d) => setNodes(d.users)).catch(() => {});
  }, [user]);

  async function submitAuth(e) {
    e.preventDefault();
    setAuthErr("");
    try {
      const fn = authMode === "login" ? api.login : api.register;
      const d = await fn(handle.trim(), pass);
      setSession(d.token, d.user);
      setUser(d.user);
    } catch {
      setAuthErr("連線被拒絕。檢查代號與通行碼。");
    }
  }

  async function gain(xp, minutes = 1) {
    try {
      const d = await api.addXp(xp, minutes);
      setUser(d.user);
    } catch { /* ignore */ }
  }

  function playDevice(text) {
    return speakOnDevice(text, { lang: lang.speech, pitch: tutor.pitch });
  }

  function waitMeta(audio) {
    return new Promise((resolve) => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        resolve(audio.duration);
        return;
      }
      const done = () => resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
      audio.addEventListener("loadedmetadata", done, { once: true });
      audio.addEventListener("error", done, { once: true });
      setTimeout(done, 800);
    });
  }

  function estimateTimes(tokens) {
    return timesEstimated(tokens, Math.max(1.2, tokens.join("").length * 0.12));
  }

  async function loadTrack(id, text, tokens) {
    armAudio();
    const want = engine === "device" ? "clock" : "cloud";
    if (trackRef.current.id === id && trackRef.current.mode === want && beat.audioRef.current) {
      setTrackId(id);
      return;
    }
    if (want === "clock") {
      beat.attachClock(estimateTimes(tokens));
      trackRef.current = { id, tokens, text, mode: "clock" };
      setTrackId(id);
      return;
    }
    try {
      const voices = (await api.voices(lang.speech)).voices || [];
      const voice = pickGoogleVoice(voices, tutor, lang.speech);
      if (!voice) throw new Error("NO_VOICE");
      const data = await api.synthesize({
        ssml: ssmlFromBeats(tokens, lang.code),
        marks: true,
        voice: { languageCode: voice.languageCodes?.[0] || lang.speech, name: voice.name },
        audioConfig: { audioEncoding: "MP3", speakingRate: 0.95 },
      });
      if (!data.audioContent) throw new Error("NO_AUDIO");
      const audio = new Audio("data:audio/mp3;base64," + data.audioContent);
      const duration = await waitMeta(audio);
      const dur = duration > 0 && Number.isFinite(duration)
        ? duration
        : Math.max(1.2, tokens.join("").length * 0.11);
      beat.attach(audio, timesFromPoints(data.timepoints, tokens, dur));
      trackRef.current = { id, tokens, text, mode: "cloud" };
      setTrackId(id);
    } catch (e) {
      if (e.status === 429) setErr(tr("voiceQuota"));
      beat.attachClock(estimateTimes(tokens));
      trackRef.current = { id, tokens, text, mode: "clock" };
      setTrackId(id);
    }
  }

  async function playTokens(id, text, tokens, startAt = 0, loopRange = null) {
    if (!text || !tokens?.length) return;
    await loadTrack(id, text, tokens);
    const start = Math.max(0, Math.min(startAt, tokens.length - 1));
    beat.setLoop(loopRange, trackRef.current.mode === "clock" && loopRange
      ? () => playDevice(joinBeats(tokens.slice(loopRange[0], loopRange[1] + 1), lang.code))
      : null);
    if (trackRef.current.mode === "clock") {
      playDevice(joinBeats(tokens.slice(start), lang.code) || text);
    }
    try {
      await beat.playFrom(start);
    } catch {
      playDevice(joinBeats(tokens.slice(start), lang.code) || text);
    }
  }

  async function speak(text) {
    if (!text) return;
    const tokens = beatsOf(text, lang.code);
    await playTokens(`plain-${text.slice(0, 24)}`, text, tokens, 0, null);
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    armAudio();
    setInput(""); setBusy(true); setErr("");
    const next = [...msgs, { role: "me", text }];
    setMsgs(next);
    try {
      const history = next.map((m) => ({
        role: m.role === "me" ? "user" : "assistant",
        content: m.text,
      }));
      const nativeName = nativeLangName(ui);
      const system = `You are ${tutor.name}, ${tutor.style}. Reply in ${lang.name} at CEFR ${level}, 1-3 sentences, end with a question. Also give a faithful mother-tongue gloss in ${nativeName}. JSON only: {"reply":"...","native":"...","corrections":[],"praise":""}`;
      const data = await api.llm(system, history);
      const raw = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      const p = JSON.parse(raw.replace(/```json|```/g, "").trim());
      const reply = p.reply || "";
      const native = showNative ? (p.native || p.reply_zh || "") : "";
      const tm = { role: "ai", text: reply, native, tokens: beatsOf(reply, lang.code), corrections: p.corrections || [] };
      setMsgs((m) => [...m, tm]);
      await playTokens(`chat-${next.length}`, reply, tm.tokens, 0, null);
      await gain(8, 2);
    } catch {
      setErr("鏈路中斷。可先練朗讀與單字。");
    } finally { setBusy(false); }
  }

  function openPassage() {
    const p = PASSAGES[lang.code] || PASSAGES.en;
    let offset = 0;
    const sentences = p.sentences.map((s) => {
      const tokens = beatsOf(s.text, lang.code);
      const start = offset;
      offset += tokens.length;
      return { ...s, tokens, start };
    });
    setPassage({ ...p, sentences, allTokens: sentences.flatMap((s) => s.tokens) });
    trackRef.current = { id: "", tokens: [], text: "" };
    beat.stop();
    beat.setLoop(null);
    gain(6, 2);
  }

  function passageText() {
    return (passage?.sentences || []).map((s) => s.text).join(isCjk(lang.code) ? "" : " ");
  }

  async function playPassageFrom(globalIndex, loopRange = beat.loop) {
    if (!passage) return;
    await playTokens("read", passageText(), passage.allTokens, globalIndex, loopRange);
  }

  function toggleLoopSentence(i) {
    if (!passage) return;
    const range = sentenceRange(passage.sentences, i);
    const on = beat.loop && beat.loop[0] === range[0] && beat.loop[1] === range[1];
    if (on) {
      beat.setLoop(null);
      return;
    }
    playPassageFrom(range[0], range);
  }

  async function installApp() {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }
    setInstallHint(true);
  }

  const standalone = typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone);

  async function startChat() {
    setErr("");
    armAudio();
    const g = GREET[lang.code] || GREET.en;
    const tokens = beatsOf(g.text, lang.code);
    setMsgs([{ role: "ai", text: g.text, native: showNative ? g.zh : "", tokens }]);
    await playTokens("chat-0", g.text, tokens, 0, null);
  }

  function gloss(text) {
    return showNative ? text : "";
  }

  if (!user) {
    return (
      <div className="app-shell is-auth items-center justify-center">
        <form onSubmit={submitAuth} className="panel w-full max-w-md p-5 flex flex-col min-h-0 my-auto">
          <img src="/logo.png" alt="ECHOO" className="brand-seal mx-auto" />
          <p className="slogan">{tr("tag")}</p>
          <h1 className="text-2xl mt-2 text-center">{authMode === "login" ? tr("login") : tr("register")}</h1>
          <label className="block mt-4 text-sm text-[var(--mute)]">{tr("username")}
            <input value={handle} onChange={(e) => setHandle(e.target.value)} className="field mt-1" />
          </label>
          <label className="block mt-3 text-sm text-[var(--mute)]">{tr("password")}
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="field mt-1" />
          </label>
          {authErr && <p className="mag text-sm mt-2">{authErr}</p>}
          <button className="btn btn-primary w-full mt-4">{authMode === "login" ? tr("enter") : tr("create")}</button>
          <button type="button" className="btn btn-ghost w-full mt-2 text-sm" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
            {authMode === "login" ? tr("needAccount") : tr("haveAccount")}
          </button>
          {!standalone && (
            <>
              <button type="button" onClick={installApp} className="btn btn-line w-full mt-2">
                {tr("install")}
              </button>
              {installHint && <p className="text-sm mt-2 text-[var(--mute)]">{tr("installHint")}</p>}
            </>
          )}
        </form>
      </div>
    );
  }

  const nav = [
    { id: "chat", label: tr("chat") },
    { id: "read", label: tr("read") },
    { id: "vocab", label: tr("vocab") },
    { id: "examples", label: tr("examples") },
    { id: "scenes", label: tr("scenes") },
    { id: "exams", label: tr("exams") },
    { id: "board", label: tr("board") },
    { id: "settings", label: tr("settings") },
  ];

  const vocab = VOCAB[lang.code] || VOCAB.en;
  const v = vocab[vocabI % vocab.length];
  const exam = EXAMS[lang.code] || EXAMS.en;
  const item = exam.items[examI % exam.items.length];
  const scene = (SCENES[lang.code] || SCENES.en)[0];
  const vocabTokens = beatsOf(v.word, lang.code);
  const vocabSentTokens = beatsOf(v.sentence, lang.code);
  const sceneTokens = beatsOf(scene.prompt, lang.code);

  return (
    <div className="app-shell">
      <header className="panel app-header">
        <img src="/logo.png" alt="ECHOO" className="brand-seal brand-seal-sm shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="display text-lg leading-none">ECHOO</div>
          <div className="slogan slogan-inline">{tr("tagShort")}</div>
          <div className="text-xs text-[var(--mute)] truncate">
            {user.username}{user.role === "admin" ? ` · ${tr("admin")}` : ""} · {tr("xp")} {user.xp}
            {user.quota ? ` · ${user.plan}` : ""}
          </div>
        </div>
        <button className="btn btn-ghost shrink-0" style={{ minHeight: 40, padding: "0 12px" }} onClick={() => { clearSession(); setUser(null); }}>
          {tr("logout")}
        </button>
      </header>
      <nav className="app-nav">
        {nav.map((n) => {
          const closed = ["vocab", "examples", "scenes", "exams"].includes(n.id) && !canAccess(user, n.id);
          return (
            <button key={n.id} onClick={() => { if (!closed) { setErr(""); setTab(n.id); } }}
              className={`nav-btn ${tab === n.id ? "active" : ""} ${closed ? "lock" : ""}`}>
              {n.label}
            </button>
          );
        })}
      </nav>
      <main className="app-main">
        {tab === "settings" && (
          <section className="panel">
            <h2>{tr("settings")}</h2>
            <div className="scroll-pane mt-3 space-y-3">
            <label className="block text-sm">{tr("uiLang")}
              <select value={ui} onChange={(e) => setUi(e.target.value)} className="field mt-1">
                <option value="zh">繁體中文</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
              </select>
            </label>
            <label className="block text-sm">{tr("learnLang")}
              <select value={lang.code} onChange={(e) => {
                const next = LEARN_LANGS.find((l) => l.code === e.target.value);
                setLang(next);
                setMsgs([]);
                setPassage(null);
                trackRef.current = { id: "", tokens: [], text: "" };
                beat.stop();
              }} className="field mt-1">
                {LEARN_LANGS.map((l) => <option key={l.code} value={l.code}>{l.name} / {l.exam}</option>)}
              </select>
            </label>
            <label className="block text-sm">{tr("level")}
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="field mt-1">
                {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.id} {l.zh}</option>)}
              </select>
            </label>
            <p className="text-sm text-[var(--mute)]">{tr("tutor")}</p>
            <div className="tutor-grid">
              {TUTORS.map((x) => (
                <button key={x.id} onClick={() => setTutorId(x.id)} className={`p-3 text-left rounded-xl border ${tutorId === x.id ? "border-[var(--magenta)] bg-[var(--paper)]" : "border-[var(--line)]"}`}>
                  <div className="display text-sm">{x.name}</div>
                  <div className="text-xs text-[var(--mute)]">{x.gender === "f" ? "FEM" : "MASC"} · {x.style}</div>
                </button>
              ))}
            </div>
            <label className="block text-sm">{tr("voiceEngine")}
              <select value={engine} onChange={(e) => {
                setEngine(e.target.value);
                trackRef.current = { id: "", tokens: [], text: "", mode: "" };
                beat.stop();
              }} className="field mt-1">
                <option value="cloud">{tr("cloud")}</option>
                <option value="device">{tr("device")}</option>
              </select>
            </label>
            <button onClick={() => speak((GREET[lang.code] || GREET.en).text)} className="btn btn-line">{tr("listen")}</button>
            {user.role === "admin" && (
              <div>
                <h3 className="display text-sm">{tr("users")}</h3>
                {nodes.map((n) => (
                  <div key={n.id} className="text-sm border-b border-[var(--line)] py-2 flex gap-2 items-center">
                    <span className="flex-1 min-w-0 truncate">{n.username} · XP {n.xp} · {n.plan}</span>
                    {n.role !== "admin" && (
                      <select value={n.plan || "free"} onChange={async (e) => {
                        const d = await api.setPlan(n.id, e.target.value);
                        setNodes((list) => list.map((x) => x.id === n.id ? d.user : x));
                      }} className="field" style={{ width: "auto", padding: "6px 8px" }}>
                        <option value="free">free $0</option>
                        <option value="starter">starter $9</option>
                        <option value="plus">plus $19</option>
                        <option value="pro">pro $49</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
            )}
            </div>
          </section>
        )}

        {tab === "chat" && (
          <section className="panel">
            <h2>{tr("chat")} · {tutor.name}</h2>
            <div className="scroll-pane space-y-3 mt-3">
              {msgs.length === 0 && (
                <div className="empty-pane">
                  <button className="btn btn-accent w-full max-w-sm" onClick={startChat}>{tr("startChat")}</button>
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={m.role === "me" ? "text-right" : ""}>
                  {m.role === "me" ? (
                    <div className="bubble me">{m.text}</div>
                  ) : (
                    <div className="bubble">
                      <BeatLine
                        tokens={m.tokens || beatsOf(m.text, lang.code)}
                        joiner={joiner}
                        active={trackId === `chat-${i}` ? highlight : -1}
                        native={m.native}
                        nativeOn={trackId === `chat-${i}` && highlight >= 0}
                        fromHere={tr("fromHere")}
                        onToken={(tok) => playTokens(`chat-${i}`, m.text, m.tokens || beatsOf(m.text, lang.code), tok, null)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {err && <p className="notice mt-1">{err}</p>}
            <div className="composer">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} className="field" rows={2} />
              <button disabled={busy} onClick={send} className="btn btn-primary">{tr("send")}</button>
            </div>
          </section>
        )}

        {tab === "read" && (
          <section className="panel">
            <h2>{tr("reading")}</h2>
            {!passage && <button className="btn btn-line mt-3 w-full" onClick={openPassage}>{tr("reading")}</button>}
            {passage && (
              <div className="scroll-pane mt-3">
                <h3 className="display">{passage.title}</h3>
                {gloss(passage.title_zh) ? <p className="text-[var(--mute)] text-sm">{passage.title_zh}</p> : null}
                <div className="read-tools mt-3">
                  <button className="btn btn-accent" onClick={() => playPassageFrom(0, beat.loop)}>{tr("playAll")}</button>
                  <button className="btn btn-ghost" onClick={() => beat.stop()}>{tr("stop")}</button>
                </div>
                {passage.sentences.map((s, i) => {
                  const range = sentenceRange(passage.sentences, i);
                  const local = highlight >= range[0] && highlight <= range[1] ? highlight - s.start : -1;
                  const looping = beat.loop && beat.loop[0] === range[0] && beat.loop[1] === range[1];
                  return (
                    <article key={i} className={`read-sent ${local >= 0 ? "live" : ""} ${looping ? "looping" : ""}`}>
                      <BeatLine
                        tokens={s.tokens}
                        joiner={joiner}
                        active={trackId === "read" ? local : -1}
                        native={gloss(s.zh)}
                        nativeOn={trackId === "read" && local >= 0}
                        fromHere={tr("fromHere")}
                        onToken={(tok) => playPassageFrom(s.start + tok, beat.loop)}
                      />
                      <div className="sent-tools">
                        <button className="btn btn-ghost btn-mini" onClick={() => playPassageFrom(s.start, beat.loop)}>{tr("replay")}</button>
                        <button className={`btn btn-mini ${looping ? "btn-accent" : "btn-line"}`} onClick={() => toggleLoopSentence(i)}>{tr("loop")}</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tab === "vocab" && canAccess(user, "vocab") && (
          <section className="panel">
            <h2>{tr("review")}</h2>
            <div className="scroll-pane flex flex-col justify-center">
              <BeatLine
                className="beat-hero"
                tokens={vocabTokens}
                joiner={joiner}
                active={trackId === "vocab-word" ? highlight : -1}
                native={gloss(v.hint)}
                nativeOn={trackId === "vocab-word" && highlight >= 0}
                fromHere={tr("fromHere")}
                onToken={(tok) => playTokens("vocab-word", v.word, vocabTokens, tok, null)}
              />
              {showAns && (
                <div className="mt-4">
                  <BeatLine
                    tokens={vocabSentTokens}
                    joiner={joiner}
                    active={trackId === "vocab-sent" ? highlight : -1}
                    native={gloss(v.sentence_zh)}
                    nativeOn={trackId === "vocab-sent" && highlight >= 0}
                    fromHere={tr("fromHere")}
                    onToken={(tok) => playTokens("vocab-sent", v.sentence, vocabSentTokens, tok, null)}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 shrink-0">
              <button className="btn btn-ghost" onClick={() => setShowAns(true)}>{tr("reveal")}</button>
              <button className="btn btn-line" onClick={() => { setShowAns(false); setVocabI(vocabI + 1); gain(4); }}>{tr("next")}</button>
              <button className="btn btn-ghost" onClick={() => playTokens("vocab-word", v.word, vocabTokens, 0, null)}>{tr("listen")}</button>
            </div>
          </section>
        )}

        {tab === "examples" && canAccess(user, "examples") && (
          <section className="panel">
            <h2>{tr("drill")}</h2>
            <div className="scroll-pane flex items-center">
              <BeatLine
                tokens={vocabSentTokens}
                joiner={joiner}
                active={trackId === "example" ? highlight : -1}
                native={gloss(v.sentence_zh)}
                nativeOn={trackId === "example" && highlight >= 0}
                fromHere={tr("fromHere")}
                onToken={(tok) => { playTokens("example", v.sentence, vocabSentTokens, tok, null); gain(2); }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 shrink-0">
              <button className="btn btn-line" onClick={() => { playTokens("example", v.sentence, vocabSentTokens, 0, null); gain(5); }}>{tr("listen")}</button>
              <button className="btn btn-ghost" onClick={() => playTokens("example", v.sentence, vocabSentTokens, 0, [0, vocabSentTokens.length - 1])}>{tr("loop")}</button>
            </div>
          </section>
        )}

        {tab === "scenes" && canAccess(user, "scenes") && (
          <section className="panel">
            <h2>{tr("scene")}</h2>
            <div className="scroll-pane">
              <p className="display mt-2">{scene.title}</p>
              {gloss(scene.title_zh) ? <p className="text-sm text-[var(--mute)]">{scene.title_zh}</p> : null}
              <div className="mt-3">
                <BeatLine
                  tokens={sceneTokens}
                  joiner={joiner}
                  active={trackId === "scene" ? highlight : -1}
                  native={gloss(scene.prompt_zh)}
                  nativeOn={trackId === "scene" && highlight >= 0}
                  fromHere={tr("fromHere")}
                  onToken={(tok) => playTokens("scene", scene.prompt, sceneTokens, tok, null)}
                />
              </div>
            </div>
            <button className="btn btn-ghost w-full mt-3 shrink-0" onClick={() => { playTokens("scene", scene.prompt, sceneTokens, 0, null); gain(6); }}>{tr("listen")}</button>
          </section>
        )}

        {tab === "exams" && canAccess(user, "exams") && (
          <section className="panel">
            <h2>{tr("exam")} · {exam.board}</h2>
            <div className="scroll-pane mt-2">
              <p>{item.q}</p>
              {gloss(item.q_zh) ? <p className="beat-native on mt-1">{item.q_zh}</p> : null}
              <div className="grid gap-2 mt-3">
                {item.options.map((opt, i) => (
                  <button key={i} onClick={() => setExamPick(i)} className={`btn btn-wrap ${examPick === i ? "btn-line" : "btn-ghost"}`}>
                    <span>{opt}</span>
                    {gloss(item.options_zh?.[i]) ? <span className="opt-native">{item.options_zh[i]}</span> : null}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary w-full mt-3 shrink-0" onClick={() => {
              if (examPick === item.a) { gain(12); setErr(tr("correct")); }
              else setErr(tr("wrong"));
              setExamPick(-1); setExamI(examI + 1);
            }}>{tr("check")}</button>
            {err && <p className="mt-2 shrink-0">{err}</p>}
          </section>
        )}

        {tab === "board" && (
          <section className="panel">
            <h2>{tr("board")}</h2>
            <div className="scroll-pane mt-2">
              <p>{user.username} · XP {user.xp} · min {user.minutes}</p>
              <p className="text-sm text-[var(--mute)] mt-3">{tr("unlockHint")}</p>
              <ul className="mt-2 space-y-2 text-sm">
                {UNLOCKS.map((u) => (
                  <li key={u.id} className="flex justify-between border-b border-[var(--line)] py-1">
                    <span>{u.id}</span>
                    <span>{u.xp} XP · {canAccess(user, u.id) ? "OPEN" : "LOCK"}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {["vocab", "examples", "scenes", "exams"].includes(tab) && !canAccess(user, tab) && (
          <section className="panel"><h2>{tr("locked")}</h2><p className="mt-2">{tr("xp")} {UNLOCKS.find((u) => u.id === tab)?.xp}</p></section>
        )}
      </main>
    </div>
  );
}
