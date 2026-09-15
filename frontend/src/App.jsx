import { useEffect, useRef, useState } from "react";
import { api, clearSession, loadUser, setSession } from "./api.js";
import { t } from "./i18n.js";
import { armAudio, pickGoogleVoice, speakOnDevice } from "./tts.js";
import {
  LEARN_LANGS, LEVELS, TUTORS, UNLOCKS, canAccess, GREET, VOCAB, SCENES, EXAMS, PASSAGES,
} from "./content.js";

function tokenize(text, code) {
  if (code === "ja" || code === "zh") {
    const out = []; let buf = "";
    for (const ch of text) { buf += ch; if (/[、。！？!?\n]/.test(ch) || buf.length >= 2) { out.push(buf); buf = ""; } }
    if (buf) out.push(buf);
    return out;
  }
  return text.split(/(\s+)/).filter((x) => x.trim());
}

function escapeXml(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

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
  const audioRef = useRef(null);
  const tutor = TUTORS.find((x) => x.id === tutorId) || TUTORS[0];
  const tr = (k) => t(ui, k);

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

  async function speak(text) {
    if (!text) return;
    armAudio();
    if (engine === "device") {
      playDevice(text);
      return;
    }
    try {
      const voices = (await api.voices(lang.speech)).voices || [];
      const voice = pickGoogleVoice(voices, tutor, lang.speech);
      if (!voice) {
        playDevice(text);
        return;
      }
      const data = await api.synthesize({
        ssml: `<speak>${escapeXml(text)}</speak>`,
        voice: { languageCode: voice.languageCodes?.[0] || lang.speech, name: voice.name },
        audioConfig: { audioEncoding: "MP3", speakingRate: 0.95 },
      });
      if (!data.audioContent) {
        playDevice(text);
        return;
      }
      if (audioRef.current) { audioRef.current.pause(); }
      const a = new Audio("data:audio/mp3;base64," + data.audioContent);
      audioRef.current = a;
      try {
        await a.play();
      } catch {
        playDevice(text);
      }
    } catch (e) {
      playDevice(text);
      if (e.status === 429) setErr(tr("voiceQuota"));
    }
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
      const system = `You are ${tutor.name}, ${tutor.style}. Reply in ${lang.name} at CEFR ${level}, 1-3 sentences, end with a question. JSON only: {"reply":"...","reply_zh":"...","corrections":[],"praise":""}`;
      const data = await api.llm(system, history);
      const raw = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      const p = JSON.parse(raw.replace(/```json|```/g, "").trim());
      const tm = { role: "ai", text: p.reply, zh: p.reply_zh, corrections: p.corrections || [] };
      setMsgs((m) => [...m, tm]);
      speak(tm.text);
      await gain(8, 2);
    } catch {
      setErr("鏈路中斷。可先練朗讀與單字。");
    } finally { setBusy(false); }
  }

  function openPassage() {
    const p = PASSAGES[lang.code] || PASSAGES.en;
    const sentences = p.sentences.map((s) => ({ ...s, tokens: tokenize(s.text, lang.code) }));
    setPassage({ ...p, sentences });
    gain(6, 2);
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
    setMsgs([{ role: "ai", text: g }]);
    await speak(g);
  }

  if (!user) {
    return (
      <div className="app-shell is-auth items-center justify-center">
        <form onSubmit={submitAuth} className="panel w-full max-w-md p-5 flex flex-col min-h-0 my-auto">
          <img src="/logo.png" alt="ECHOO" className="w-16 h-16 mx-auto rounded-2xl" />
          <p className="neon text-xs text-center mt-3">{tr("tag")}</p>
          <h1 className="text-2xl mt-1 text-center">{authMode === "login" ? tr("login") : tr("register")}</h1>
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

  return (
    <div className="app-shell">
      <header className="panel app-header">
        <img src="/logo.png" alt="ECHOO" className="w-10 h-10 rounded-lg shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="display text-lg leading-none">ECHOO</div>
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
              <select value={lang.code} onChange={(e) => setLang(LEARN_LANGS.find((l) => l.code === e.target.value))} className="field mt-1">
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
              <select value={engine} onChange={(e) => setEngine(e.target.value)} className="field mt-1">
                <option value="cloud">{tr("cloud")}</option>
                <option value="device">{tr("device")}</option>
              </select>
            </label>
            <button onClick={() => speak(GREET[lang.code])} className="btn btn-line">{tr("listen")}</button>
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
                  <div className={`bubble ${m.role === "me" ? "me" : ""}`}>{m.text}</div>
                  {m.zh && <div className="text-xs text-[var(--mute)] mt-1">{m.zh}</div>}
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
                <p className="text-[var(--mute)] text-sm">{passage.title_zh}</p>
                {passage.sentences.map((s, i) => (
                  <p key={i} className="text-lg mt-3 leading-relaxed">{s.tokens.join(lang.code === "ja" || lang.code === "zh" ? "" : " ")}</p>
                ))}
                <button className="btn btn-accent mt-4 w-full" onClick={() => speak(passage.sentences.map((s) => s.text).join(" "))}>{tr("listen")}</button>
              </div>
            )}
          </section>
        )}

        {tab === "vocab" && canAccess(user, "vocab") && (
          <section className="panel">
            <h2>{tr("review")}</h2>
            <div className="scroll-pane flex flex-col justify-center">
              <div className="display text-4xl mt-2">{v.word}</div>
              {showAns && <p className="mt-2">{v.hint}<br />{v.sentence}</p>}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 shrink-0">
              <button className="btn btn-ghost" onClick={() => setShowAns(true)}>{tr("reveal")}</button>
              <button className="btn btn-line" onClick={() => { setShowAns(false); setVocabI(vocabI + 1); gain(4); }}>{tr("next")}</button>
              <button className="btn btn-ghost" onClick={() => speak(v.word)}>{tr("listen")}</button>
            </div>
          </section>
        )}

        {tab === "examples" && canAccess(user, "examples") && (
          <section className="panel">
            <h2>{tr("drill")}</h2>
            <div className="scroll-pane flex items-center">
              <p className="text-2xl">{v.sentence}</p>
            </div>
            <button className="btn btn-line w-full mt-3 shrink-0" onClick={() => { speak(v.sentence); gain(5); }}>{tr("listen")}</button>
          </section>
        )}

        {tab === "scenes" && canAccess(user, "scenes") && (
          <section className="panel">
            <h2>{tr("scene")}</h2>
            <div className="scroll-pane">
              <p className="display mt-2">{scene.title}</p>
              <p className="mt-2">{scene.prompt}</p>
            </div>
            <button className="btn btn-ghost w-full mt-3 shrink-0" onClick={() => { speak(scene.prompt); gain(6); }}>{tr("listen")}</button>
          </section>
        )}

        {tab === "exams" && canAccess(user, "exams") && (
          <section className="panel">
            <h2>{tr("exam")} · {exam.board}</h2>
            <div className="scroll-pane mt-2">
              <p>{item.q}</p>
              <div className="grid gap-2 mt-3">
                {item.options.map((opt, i) => (
                  <button key={i} onClick={() => setExamPick(i)} className={`btn btn-wrap ${examPick === i ? "btn-line" : "btn-ghost"}`}>{opt}</button>
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
