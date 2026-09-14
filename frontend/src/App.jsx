import { useEffect, useMemo, useRef, useState } from "react";
import { api, clearSession, loadUser, setSession } from "./api.js";
import { t } from "./i18n.js";
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
  const audioRef = useRef(null);
  const tutor = TUTORS.find((x) => x.id === tutorId) || TUTORS[0];
  const tr = (k) => t(ui, k);

  useEffect(() => { localStorage.setItem("echoo-ui", ui); }, [ui]);
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

  async function speak(text) {
    if (engine === "device" && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang.speech;
      u.pitch = tutor.pitch;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      return;
    }
    try {
      const voices = (await api.voices(lang.speech)).voices || [];
      const want = tutor.gender === "f" ? "FEMALE" : "MALE";
      const voice = voices.find((v) => v.ssmlGender === want && v.name.includes(tutor.preferred.split("-")[0]))
        || voices.find((v) => v.ssmlGender === want) || voices[0];
      if (!voice) return;
      const data = await api.synthesize({
        ssml: `<speak>${escapeXml(text)}</speak>`,
        voice: { languageCode: voice.languageCodes?.[0] || lang.speech, name: voice.name },
        audioConfig: { audioEncoding: "MP3", speakingRate: 0.95 },
        enableTimePointing: ["SSML_MARK"],
      });
      if (!data.audioContent) return;
      if (audioRef.current) { audioRef.current.pause(); }
      const a = new Audio("data:audio/mp3;base64," + data.audioContent);
      audioRef.current = a;
      a.play();
    } catch (e) { setErr(e.message); }
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
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

  function startChat() {
    const g = GREET[lang.code] || GREET.en;
    setMsgs([{ role: "ai", text: g }]);
    setTimeout(() => speak(g), 200);
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="scan" />
        <form onSubmit={submitAuth} className="panel w-full max-w-md p-6 md:p-8">
          <p className="neon text-xs">{tr("tag")}</p>
          <h1 className="text-3xl mt-2">{authMode === "login" ? tr("login") : tr("register")}</h1>
          <label className="block mt-6 text-sm text-[var(--mute)]">{tr("username")}
            <input value={handle} onChange={(e) => setHandle(e.target.value)} className="mt-1 w-full bg-[var(--paper)] border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="block mt-4 text-sm text-[var(--mute)]">{tr("password")}
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="mt-1 w-full bg-[var(--paper)] border border-[var(--line)] px-3 py-2" />
          </label>
          {authErr && <p className="mag text-sm mt-3">{authErr}</p>}
          <button className="mt-6 w-full py-3 bg-[var(--cyan)] text-white font-bold">{authMode === "login" ? tr("enter") : tr("create")}</button>
          <button type="button" className="mt-3 w-full text-sm text-[var(--mute)]" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
            {authMode === "login" ? tr("needAccount") : tr("haveAccount")}
          </button>
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
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="scan" />
      <aside className="panel m-3 md:m-4 md:w-64 p-4 flex md:flex-col gap-3 overflow-x-auto">
        <div>
          <div className="neon text-xs">{tr("tag")}</div>
          <div className="display text-xl">ECHOO</div>
          <div className="text-sm mt-1">{user.username} {user.role === "admin" ? tr("admin") : ""}</div>
            <div className="text-[var(--amber)] text-sm">{tr("xp")} {user.xp}</div>
            {user.quota && (
              <div className="text-xs text-[var(--mute)] mt-1">
                PLAN {user.plan} // TTS {user.quota.ttsUsed}/{user.quota.ttsLimit === null || user.quota.ttsLimit === Infinity ? "INF" : user.quota.ttsLimit} // AI {user.quota.llmUsed}/{user.quota.llmLimit === null || user.quota.llmLimit === Infinity ? "INF" : user.quota.llmLimit}
              </div>
            )}
        </div>
        <nav className="flex md:flex-col gap-1 min-w-max">
          {nav.map((n) => {
            const closed = ["vocab", "examples", "scenes", "exams"].includes(n.id) && !canAccess(user, n.id);
            return (
              <button key={n.id} onClick={() => !closed && setTab(n.id)}
                className={`text-left px-3 py-2 border ${tab === n.id ? "border-[var(--cyan)] neon" : "border-transparent"} ${closed ? "lock" : ""}`}>
                {n.label}{closed ? ` / ${tr("locked")}` : ""}
              </button>
            );
          })}
        </nav>
        <button className="mt-auto text-sm text-[var(--mute)]" onClick={() => { clearSession(); setUser(null); }}>{tr("logout")}</button>
      </aside>

      <main className="flex-1 p-4 md:p-8 max-w-3xl w-full mx-auto">
        {tab === "settings" && (
          <section className="panel p-5 space-y-4">
            <h2>{tr("settings")}</h2>
            <label className="block text-sm">{tr("uiLang")}
              <select value={ui} onChange={(e) => setUi(e.target.value)} className="mt-1 w-full bg-[var(--paper)] border border-[var(--line)] px-3 py-2">
                <option value="zh">繁體中文</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
              </select>
            </label>
            <label className="block text-sm">{tr("learnLang")}
              <select value={lang.code} onChange={(e) => setLang(LEARN_LANGS.find((l) => l.code === e.target.value))} className="mt-1 w-full bg-[var(--paper)] border border-[var(--line)] px-3 py-2">
                {LEARN_LANGS.map((l) => <option key={l.code} value={l.code}>{l.name} / {l.exam}</option>)}
              </select>
            </label>
            <label className="block text-sm">{tr("level")}
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="mt-1 w-full bg-[var(--paper)] border border-[var(--line)] px-3 py-2">
                {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.id} {l.zh}</option>)}
              </select>
            </label>
            <p className="text-sm text-[var(--mute)]">{tr("tutor")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TUTORS.map((x) => (
                <button key={x.id} onClick={() => setTutorId(x.id)} className={`p-3 text-left border ${tutorId === x.id ? "border-[var(--magenta)]" : "border-[var(--line)]"}`}>
                  <div className="display text-sm">{x.name}</div>
                  <div className="text-xs text-[var(--mute)]">{x.gender === "f" ? "FEM" : "MASC"} // {x.style}</div>
                  <div className="text-xs mt-1">{x.blurb}</div>
                </button>
              ))}
            </div>
            <label className="block text-sm">{tr("voiceEngine")}
              <select value={engine} onChange={(e) => setEngine(e.target.value)} className="mt-1 w-full bg-[var(--paper)] border border-[var(--line)] px-3 py-2">
                <option value="cloud">{tr("cloud")}</option>
                <option value="device">{tr("device")}</option>
              </select>
            </label>
            <button onClick={() => speak(GREET[lang.code])} className="px-4 py-2 border border-[var(--cyan)] neon">{tr("listen")}</button>
            <p className="text-xs text-[var(--mute)]">{tr("unlockHint")}: {UNLOCKS.map((u) => `${u.id} ${u.xp}`).join(" / ")}</p>
            {user.role === "admin" && (
              <div>
                <h3 className="display text-sm mt-4">{tr("users")}</h3>
                {nodes.map((n) => (
                  <div key={n.id} className="text-sm border-b border-[var(--line)] py-1 flex gap-2 items-center">
                    <span className="flex-1">{n.username} // {n.role} // XP {n.xp} // {n.plan}</span>
                    {n.role !== "admin" && (
                      <select value={n.plan || "free"} onChange={async (e) => {
                        const d = await api.setPlan(n.id, e.target.value);
                        setNodes((list) => list.map((x) => x.id === n.id ? d.user : x));
                      }} className="bg-[var(--paper)] border border-[var(--line)]">
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
          </section>
        )}

        {tab === "chat" && (
          <section className="panel p-5 min-h-[60vh] flex flex-col">
            <h2>{tr("chat")} // {tutor.name}</h2>
            {msgs.length === 0 && <button className="mt-4 py-3 bg-[var(--magenta)] text-white font-bold" onClick={startChat}>{tr("startChat")}</button>}
            <div className="flex-1 space-y-3 mt-4">
              {msgs.map((m, i) => (
                <div key={i} className={m.role === "me" ? "text-right" : ""}>
                  <div className={`inline-block px-3 py-2 border ${m.role === "me" ? "border-[var(--cyan)]" : "border-[var(--line)]"}`}>{m.text}</div>
                  {m.zh && <div className="text-xs text-[var(--mute)] mt-1">{m.zh}</div>}
                </div>
              ))}
            </div>
            {err && <p className="mag text-sm">{err}</p>}
            <div className="flex gap-2 mt-4">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 bg-[var(--paper)] border border-[var(--line)] px-3 py-2" rows={2} />
              <button disabled={busy} onClick={send} className="px-4 bg-[var(--cyan)] text-white font-bold">{tr("send")}</button>
            </div>
          </section>
        )}

        {tab === "read" && (
          <section className="panel p-5">
            <h2>{tr("reading")}</h2>
            {!passage && <button className="mt-4 py-3 px-4 border border-[var(--cyan)]" onClick={openPassage}>{tr("reading")}</button>}
            {passage && (
              <div className="mt-4">
                <h3 className="display">{passage.title}</h3>
                <p className="text-[var(--mute)]">{passage.title_zh}</p>
                {passage.sentences.map((s, i) => (
                  <p key={i} className="text-xl mt-3 leading-relaxed">{s.tokens.join(lang.code === "ja" || lang.code === "zh" ? "" : " ")}</p>
                ))}
                <button className="mt-4 px-4 py-2 bg-[var(--magenta)] text-white" onClick={() => speak(passage.sentences.map((s) => s.text).join(" "))}>{tr("listen")}</button>
              </div>
            )}
          </section>
        )}

        {tab === "vocab" && canAccess(user, "vocab") && (
          <section className="panel p-5">
            <h2>{tr("review")}</h2>
            <div className="display text-4xl mt-6">{v.word}</div>
            {showAns && <p className="mt-2">{v.hint}<br />{v.sentence}</p>}
            <div className="flex gap-2 mt-6">
              <button className="px-4 py-2 border" onClick={() => setShowAns(true)}>{tr("reveal")}</button>
              <button className="px-4 py-2 border border-[var(--cyan)]" onClick={() => { setShowAns(false); setVocabI(vocabI + 1); gain(4); }}>{tr("next")}</button>
              <button className="px-4 py-2 border" onClick={() => speak(v.word)}>{tr("listen")}</button>
            </div>
          </section>
        )}

        {tab === "examples" && canAccess(user, "examples") && (
          <section className="panel p-5">
            <h2>{tr("drill")}</h2>
            <p className="text-2xl mt-4">{v.sentence}</p>
            <button className="mt-4 px-4 py-2 border border-[var(--cyan)]" onClick={() => { speak(v.sentence); gain(5); }}>{tr("listen")}</button>
          </section>
        )}

        {tab === "scenes" && canAccess(user, "scenes") && (
          <section className="panel p-5">
            <h2>{tr("scene")}</h2>
            <p className="display mt-4">{scene.title}</p>
            <p className="mt-2">{scene.prompt}</p>
            <button className="mt-4 px-4 py-2 border" onClick={() => { speak(scene.prompt); gain(6); }}>{tr("listen")}</button>
          </section>
        )}

        {tab === "exams" && canAccess(user, "exams") && (
          <section className="panel p-5">
            <h2>{tr("exam")} // {exam.board}</h2>
            <p className="mt-4">{item.q}</p>
            <div className="grid gap-2 mt-3">
              {item.options.map((opt, i) => (
                <button key={i} onClick={() => setExamPick(i)} className={`text-left px-3 py-2 border ${examPick === i ? "border-[var(--cyan)]" : "border-[var(--line)]"}`}>{opt}</button>
              ))}
            </div>
            <button className="mt-4 px-4 py-2 bg-[var(--cyan)] text-white" onClick={() => {
              if (examPick === item.a) { gain(12); setErr(tr("correct")); }
              else setErr(tr("wrong"));
              setExamPick(-1); setExamI(examI + 1);
            }}>{tr("check")}</button>
            {err && <p className="mt-2">{err}</p>}
          </section>
        )}

        {tab === "board" && (
          <section className="panel p-5">
            <h2>{tr("board")}</h2>
            <p className="mt-2">{user.username} // XP {user.xp} // min {user.minutes}</p>
            <p className="text-sm text-[var(--mute)] mt-4">{tr("unlockHint")}</p>
            <ul className="mt-2 space-y-1 text-sm">
              {UNLOCKS.map((u) => (
                <li key={u.id}>{u.id} // {u.xp} XP // {canAccess(user, u.id) ? "OPEN" : "LOCK"}</li>
              ))}
            </ul>
          </section>
        )}

        {["vocab", "examples", "scenes", "exams"].includes(tab) && !canAccess(user, tab) && (
          <section className="panel p-5"><h2>{tr("locked")}</h2><p>{tr("xp")} {UNLOCKS.find((u) => u.id === tab)?.xp}</p></section>
        )}
      </main>
    </div>
  );
}
