import { useEffect, useRef, useState } from "react";
import { api, clearSession, loadUser, setSession } from "./api.js";
import { t } from "./i18n.js";
import { armAudio, listDeviceVoices, pickGoogleVoice, speakOnDevice } from "./tts.js";
import {
  LEARN_LANGS, LEVELS, LEVEL_DISCLAIMER, TUTORS, UNLOCKS, canAccess,
  GREET, VOCAB, EXAMPLES, SCENES, EXAMS,
  greetOf, examBoard, fallbackPassage, previewPassage,
} from "./content.js";
import {
  beatsOf, isCjk, joinBeats, sentenceRange, ssmlFromBeats,
  timesEstimated, timesFromPoints,
} from "./beats.js";
import { BeatLine, useBeatAudio } from "./karaoke.jsx";
import { StoryStage } from "./storyStage.jsx";
import { inferScene } from "./story.js";
import {
  chatPrompt, chatStartPrompt, parseModelJson, readingPrompt, SPEAK_RATES,
  vocabPrompt, examplePrompt, scenePrompt, examPrompt,
} from "./prompts.js";
import { computeScore, fakeFriends, loadWeek, recordPractice } from "./score.js";
import { isSaved, loadSaves, removeSave, savePassage } from "./bookmarks.js";
import { createRecognizer, micErrorKey, speechSupported } from "./speech.js";
import { pickFresh, rememberKey } from "./vary.js";

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11a4 4 0 0 0 8 0M12 15v3M9 19h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

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
  const [tutorId, setTutorId] = useState(() => {
    const saved = localStorage.getItem("echoo-tutor") || "audrey";
    return TUTORS.some((x) => x.id === saved) ? saved : "audrey";
  });
  const [ttsLive, setTtsLive] = useState(null);
  const [engine, setEngine] = useState("cloud");
  const [rate, setRate] = useState("normal");
  const [pitchTrim, setPitchTrim] = useState(0);
  const [deviceVoice, setDeviceVoice] = useState("");
  const [deviceVoices, setDeviceVoices] = useState([]);
  const [voiceNote, setVoiceNote] = useState("");
  const [showZh, setShowZh] = useState(true);
  const [saves, setSaves] = useState(loadSaves);
  const [week, setWeek] = useState(loadWeek);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [passage, setPassage] = useState(null);
  const [vocabItem, setVocabItem] = useState(null);
  const [exampleItem, setExampleItem] = useState(null);
  const [sceneItem, setSceneItem] = useState(null);
  const [examItem, setExamItem] = useState(null);
  const [showAns, setShowAns] = useState(false);
  const [examPick, setExamPick] = useState(-1);
  const [nodes, setNodes] = useState([]);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installHint, setInstallHint] = useState(false);
  const [trackId, setTrackId] = useState("");
  const beat = useBeatAudio();
  const trackRef = useRef({ id: "", tokens: [], text: "", mode: "" });
  const recRef = useRef(null);
  const seenRef = useRef({ vocab: [], examples: [], scenes: [], exams: [], greet: [] });
  const tutor = TUTORS.find((x) => x.id === tutorId) || TUTORS[0];
  const tr = (k) => t(ui, k);
  const levelRow = LEVELS.find((l) => l.id === level) || LEVELS[1];
  const joiner = isCjk(lang.code) ? "" : " ";
  const highlight = beat.active;
  const speakPitch = (tutor.pitch || 1) + Number(pitchTrim || 0);
  const speakRate = SPEAK_RATES[rate] || SPEAK_RATES.normal;
  const trackKey = `${engine}:${rate}:${tutorId}:${pitchTrim}:${deviceVoice}`;

  useEffect(() => { localStorage.setItem("echoo-ui", ui); }, [ui]);
  useEffect(() => { localStorage.setItem("echoo-tutor", tutorId); }, [tutorId]);
  useEffect(() => {
    if (!user) return undefined;
    let gone = false;
    setTtsLive(null);
    (async () => {
      try {
        const health = await api.health();
        if (!health.ttsConfigured) {
          if (!gone) setTtsLive(false);
          return;
        }
        const status = await api.ttsStatus();
        if (!gone) setTtsLive(Boolean(status.ok));
      } catch {
        if (!gone) setTtsLive(false);
      }
    })();
    return () => { gone = true; };
  }, [user]);
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

  useEffect(() => {
    function refresh() {
      setDeviceVoices(listDeviceVoices(lang.speech));
    }
    refresh();
    window.speechSynthesis?.addEventListener?.("voiceschanged", refresh);
    return () => window.speechSynthesis?.removeEventListener?.("voiceschanged", refresh);
  }, [lang.speech]);

  useEffect(() => () => {
    try { recRef.current?.stop(); } catch { /* ignore */ }
    recRef.current = null;
  }, []);

  useEffect(() => {
    setVocabItem(null);
    setExampleItem(null);
    setSceneItem(null);
    setExamItem(null);
    setShowAns(false);
    setExamPick(-1);
    seenRef.current = { vocab: [], examples: [], scenes: [], exams: [], greet: seenRef.current.greet };
  }, [lang.code, level]);

  async function submitAuth(e) {
    e.preventDefault();
    setAuthErr("");
    try {
      const fn = authMode === "login" ? api.login : api.register;
      const d = await fn(handle.trim(), pass);
      setSession(d.token, d.user);
      setUser(d.user);
    } catch {
      setAuthErr(tr("authFail"));
    }
  }

  async function gain(xp, minutes = 1) {
    try {
      const d = await api.addXp(xp, minutes);
      setUser(d.user);
    } catch { /* ignore */ }
  }

  function notePractice(mode, minutes = 1) {
    setWeek(recordPractice({ lang: lang.code, mode, minutes }));
  }

  function playDevice(text) {
    const result = speakOnDevice(text, {
      lang: lang.speech,
      pitch: speakPitch,
      rate: speakRate,
      voiceName: deviceVoice,
      tutor,
    });
    if (result?.substituted) setVoiceNote(tr("voiceSub"));
    else setVoiceNote("");
    return result?.ok;
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
    const want = engine === "device" || ttsLive === false ? "clock" : "cloud";
    if (trackRef.current.id === id && trackRef.current.mode === want && trackRef.current.key === trackKey && beat.audioRef.current) {
      setTrackId(id);
      return;
    }
    if (want === "clock") {
      beat.attachClock(estimateTimes(tokens));
      trackRef.current = { id, tokens, text, mode: "clock", key: trackKey };
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
        audioConfig: { audioEncoding: "MP3", speakingRate: speakRate },
      });
      if (!data.audioContent) throw new Error("NO_AUDIO");
      const audio = new Audio("data:audio/mp3;base64," + data.audioContent);
      const duration = await waitMeta(audio);
      const dur = duration > 0 && Number.isFinite(duration)
        ? duration
        : Math.max(1.2, tokens.join("").length * 0.11);
      beat.attach(audio, timesFromPoints(data.timepoints, tokens, dur));
      trackRef.current = { id, tokens, text, mode: "cloud", key: trackKey };
      setTrackId(id);
    } catch (e) {
      if (e.status === 429) setErr(tr("voiceQuota"));
      beat.attachClock(estimateTimes(tokens));
      trackRef.current = { id, tokens, text, mode: "clock", key: trackKey };
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
      beat.attachClock(estimateTimes(tokens));
      trackRef.current = { ...trackRef.current, mode: "clock" };
      playDevice(joinBeats(tokens.slice(start), lang.code) || text);
      try { await beat.playFrom(start); } catch { /* ignore */ }
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
    stopMic();
    armAudio();
    setInput(""); setBusy(true); setErr("");
    const next = [...msgs, { role: "me", text }];
    setMsgs(next);
    try {
      const history = next.map((m) => ({
        role: m.role === "me" ? "user" : "assistant",
        content: m.text,
      }));
      const system = chatPrompt(tutor, lang, levelRow);
      const data = await api.llm(system, history);
      const raw = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      const p = parseModelJson(raw);
      const reply = p.reply || "";
      const native = p.reply_zh || p.native || "";
      const tm = {
        role: "ai",
        text: reply,
        native,
        tokens: beatsOf(reply, lang.code),
        corrections: Array.isArray(p.corrections) ? p.corrections : [],
        praise: p.praise || "",
      };
      setMsgs((m) => [...m, tm]);
      await playTokens(`chat-${next.length}`, reply, tm.tokens, 0, null);
      await gain(8, 2);
      notePractice("chat", 2);
    } catch {
      setErr(tr("chatFail"));
    } finally { setBusy(false); }
  }

  function hydratePassage(raw, meta = {}) {
    let offset = 0;
    const sentences = (raw.sentences || []).map((s) => {
      const tokens = beatsOf(s.text, lang.code);
      const start = offset;
      offset += tokens.length;
      return { ...s, tokens, start };
    });
    return {
      id: raw.id || `${lang.code}-${level}-${Date.now()}`,
      title: raw.title,
      title_zh: raw.title_zh,
      hook_zh: raw.hook_zh || raw.title_zh || "",
      scene: inferScene(raw),
      lang: meta.lang || lang.code,
      level: meta.level || level,
      sentences,
      allTokens: sentences.flatMap((s) => s.tokens),
    };
  }

  function openPassage(raw) {
    const packed = hydratePassage(raw || fallbackPassage(lang.code));
    setPassage(packed);
    trackRef.current = { id: "", tokens: [], text: "", mode: "", key: "" };
    beat.stop();
    beat.setLoop(null);
    gain(6, 2);
    notePractice("read", 2);
    return packed;
  }

  async function generatePassage() {
    armAudio();
    setBusy(true);
    setErr("");
    try {
      const data = await api.llm(readingPrompt(lang, levelRow), [
        { role: "user", content: "Please write the story passage now. Pick a new everyday scene." },
      ], 1800, 0.95);
      const raw = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      const p = parseModelJson(raw);
      if (!p.sentences?.length) throw new Error("NO_PASSAGE");
      const packed = openPassage(p);
      await playPassageFrom(0, null, packed);
    } catch {
      const packed = openPassage(fallbackPassage(lang.code));
      setErr(tr("genFallback"));
      try { await playPassageFrom(0, null, packed); } catch { /* ignore */ }
    } finally {
      setBusy(false);
    }
  }

  function passageText(packed = passage) {
    return (packed?.sentences || []).map((s) => s.text).join(isCjk(lang.code) ? "" : " ");
  }

  async function playPassageFrom(globalIndex, loopRange = beat.loop, packed = passage) {
    if (!packed) return;
    await playTokens("read", passageText(packed), packed.allTokens, globalIndex, loopRange);
  }

  function toggleLoopSentence(i, packed = passage) {
    if (!packed) return;
    const range = sentenceRange(packed.sentences, i);
    const on = beat.loop && beat.loop[0] === range[0] && beat.loop[1] === range[1];
    if (on) {
      beat.setLoop(null);
      return;
    }
    playPassageFrom(range[0], range, packed);
  }

  function toggleStoryPlay() {
    if (!passage) return;
    if (beat.playing && trackId === "read") {
      beat.stop();
      return;
    }
    const start = trackId === "read" && highlight >= 0 ? highlight : 0;
    playPassageFrom(start, beat.loop, passage);
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
    try {
      const data = await api.llm(chatStartPrompt(tutor, lang, levelRow, seenRef.current.greet), [
        { role: "user", content: "Please start the conversation with a fresh greeting and a new question." },
      ], 900, 0.95);
      const raw = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      const p = parseModelJson(raw);
      const reply = p.reply || "";
      const tokens = beatsOf(reply, lang.code);
      if (reply) seenRef.current.greet = rememberKey(seenRef.current.greet, reply);
      setMsgs([{ role: "ai", text: reply, native: p.reply_zh || "", tokens, corrections: [], praise: "" }]);
      await playTokens("chat-0", reply, tokens, 0, null);
      notePractice("chat", 1);
    } catch {
      const g = greetOf(lang.code);
      const tokens = beatsOf(g.text, lang.code);
      setMsgs([{ role: "ai", text: g.text, native: g.zh, tokens }]);
      setErr(tr("genFallback"));
      await playTokens("chat-0", g.text, tokens, 0, null);
    }
  }

  function stopMic() {
    try { recRef.current?.stop(); } catch { /* ignore */ }
    recRef.current = null;
    setListening(false);
  }

  function startMic() {
    setErr("");
    if (!speechSupported()) {
      setErr(tr("micOff"));
      return;
    }
    armAudio();
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    beat.stop();
    const rec = createRecognizer(lang.speech, {
      onPartial: (text) => setInput(text),
      onFinal: (text) => setInput(text),
      onError: (event) => {
        const key = micErrorKey(event);
        if (key) setErr(tr(key));
        recRef.current = null;
        setListening(false);
      },
      onEnd: () => {
        recRef.current = null;
        setListening(false);
      },
    });
    if (!rec) {
      setErr(tr("micOff"));
      return;
    }
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch (e) {
      const key = micErrorKey(e);
      setErr(tr(key || "micError"));
      recRef.current = null;
      setListening(false);
    }
  }

  function toggleMic() {
    if (listening) stopMic();
    else startMic();
  }

  async function askJson(system, userMsg, maxTokens = 800, temperature = 0.95) {
    const data = await api.llm(system, [{ role: "user", content: userMsg }], maxTokens, temperature);
    const raw = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    return parseModelJson(raw);
  }

  async function nextVocab(manual = true) {
    setShowAns(false);
    setBusy(true);
    if (manual) setErr("");
    const bank = VOCAB[lang.code] || VOCAB.en;
    try {
      const p = await askJson(vocabPrompt(lang, levelRow, seenRef.current.vocab), "Give one new vocabulary item now.");
      if (!p?.word || !p?.sentence) throw new Error("BAD_VOCAB");
      seenRef.current.vocab = rememberKey(seenRef.current.vocab, p.word);
      setVocabItem(p);
    } catch {
      const fb = pickFresh(bank, seenRef.current.vocab, (x) => x.word) || bank[0];
      seenRef.current.vocab = rememberKey(seenRef.current.vocab, fb.word);
      setVocabItem(fb);
      if (manual) setErr(tr("genFallback"));
    } finally {
      setBusy(false);
    }
  }

  async function nextExample(manual = true) {
    setBusy(true);
    if (manual) setErr("");
    const bank = EXAMPLES[lang.code] || EXAMPLES.en;
    try {
      const p = await askJson(examplePrompt(lang, levelRow, seenRef.current.examples), "Give one new example sentence now.");
      if (!p?.sentence) throw new Error("BAD_EXAMPLE");
      seenRef.current.examples = rememberKey(seenRef.current.examples, p.sentence);
      setExampleItem(p);
    } catch {
      const fb = pickFresh(bank, seenRef.current.examples, (x) => x.sentence) || bank[0];
      seenRef.current.examples = rememberKey(seenRef.current.examples, fb.sentence);
      setExampleItem(fb);
      if (manual) setErr(tr("genFallback"));
    } finally {
      setBusy(false);
    }
  }

  async function nextScene(manual = true) {
    setBusy(true);
    if (manual) setErr("");
    const bank = SCENES[lang.code] || SCENES.en;
    try {
      const p = await askJson(scenePrompt(lang, levelRow, seenRef.current.scenes), "Give one new scene now.");
      if (!p?.title || !p?.prompt) throw new Error("BAD_SCENE");
      seenRef.current.scenes = rememberKey(seenRef.current.scenes, p.title);
      setSceneItem(p);
    } catch {
      const fb = pickFresh(bank, seenRef.current.scenes, (x) => x.title) || bank[0];
      seenRef.current.scenes = rememberKey(seenRef.current.scenes, fb.title);
      setSceneItem(fb);
      if (manual) setErr(tr("genFallback"));
    } finally {
      setBusy(false);
    }
  }

  async function nextExam(manual = true) {
    setExamPick(-1);
    setBusy(true);
    if (manual) setErr("");
    const bank = (EXAMS[lang.code] || EXAMS.en).items;
    try {
      const p = await askJson(examPrompt(lang, levelRow, seenRef.current.exams), "Give one new quiz item now.");
      if (!p?.q || !Array.isArray(p.options) || p.options.length < 2) throw new Error("BAD_EXAM");
      const a = Number(p.a);
      if (!Number.isInteger(a) || a < 0 || a >= p.options.length) throw new Error("BAD_EXAM_A");
      seenRef.current.exams = rememberKey(seenRef.current.exams, p.q);
      setExamItem({ ...p, a });
    } catch {
      const fb = pickFresh(bank, seenRef.current.exams, (x) => x.q) || bank[0];
      seenRef.current.exams = rememberKey(seenRef.current.exams, fb.q);
      setExamItem(fb);
      if (manual) setErr(tr("genFallback"));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    if (tab === "vocab" && canAccess(user, "vocab") && !vocabItem) nextVocab(false);
    if (tab === "examples" && canAccess(user, "examples") && !exampleItem) nextExample(false);
    if (tab === "scenes" && canAccess(user, "scenes") && !sceneItem) nextScene(false);
    if (tab === "exams" && canAccess(user, "exams") && !examItem) nextExam(false);
  }, [tab, user, vocabItem, exampleItem, sceneItem, examItem, lang.code, level]);

  function gloss(text) {
    return showZh ? text : "";
  }

  function zhRatio(local, tokenCount) {
    if (!tokenCount) return 0;
    if (local < 0) return 0;
    return Math.min(1, (local + 1) / tokenCount);
  }

  useEffect(() => {
    if (tab !== "read" || trackId !== "read") return;
    document.querySelector(".read-sent.live")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlight, tab, trackId]);

  if (!user) {
    return (
      <div className="app-shell is-auth items-center justify-center">
        <form onSubmit={submitAuth} className="panel w-full max-w-md p-5 flex flex-col min-h-0 my-auto">
          <img src="/logo.png" alt="Echo Studio" className="brand-seal mx-auto" />
          <p className="slogan">{tr("tag")}</p>
          <div className="brand-dots" aria-hidden="true">
            <i className="d-olive" /><i className="d-orange" /><i className="d-beige" /><i className="d-gray" />
          </div>
          <h1 className="text-2xl mt-3 text-center">{authMode === "login" ? tr("login") : tr("register")}</h1>
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
    { id: "saves", label: tr("saves") },
    { id: "board", label: tr("board") },
    { id: "settings", label: tr("settings") },
  ];

  const v = vocabItem || (VOCAB[lang.code] || VOCAB.en)[0];
  const ex = exampleItem || (EXAMPLES[lang.code] || EXAMPLES.en)[0];
  const scene = sceneItem || (SCENES[lang.code] || SCENES.en)[0];
  const item = examItem || (EXAMS[lang.code] || EXAMS.en).items[0];
  const vocabTokens = beatsOf(v.word, lang.code);
  const vocabSentTokens = beatsOf(v.sentence, lang.code);
  const exampleTokens = beatsOf(ex.sentence, lang.code);
  const sceneTokens = beatsOf(scene.prompt, lang.code);

  return (
    <div className="app-shell">
      <header className="panel app-header">
        <img src="/mark.png" alt="" className="brand-seal brand-seal-sm shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="brand-lockup">
            <span className="echo">Echo</span>
            <span className="studio">studio</span>
          </div>
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
                trackRef.current = { id: "", tokens: [], text: "", mode: "", key: "" };
                beat.stop();
              }} className="field mt-1">
                {LEARN_LANGS.map((l) => <option key={l.code} value={l.code}>{l.name} / {l.exam}</option>)}
              </select>
            </label>
            <label className="block text-sm">{tr("level")}
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="field mt-1">
                {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.id} {l.zh} · TOEIC {l.toeic} · IELTS {l.ielts}</option>)}
              </select>
            </label>
            <p className="text-xs text-[var(--mute)]">{LEVEL_DISCLAIMER}</p>
            <p className="text-sm text-[var(--mute)]">{tr("tutor")}</p>
            <div className="tutor-grid">
              {TUTORS.map((x) => (
                <button key={x.id} type="button" onClick={() => setTutorId(x.id)} className={`p-3 text-left rounded-xl border ${tutorId === x.id ? "border-[var(--orange)] bg-[var(--paper)]" : "border-[var(--line)]"}`}>
                  <div className="display text-sm">{x.name}</div>
                  <div className="text-xs">{x.style}</div>
                  <div className="text-xs text-[var(--mute)]">{x.gender === "f" ? tr("female") : tr("male")} · {x.blurb}</div>
                </button>
              ))}
            </div>
            <p className={`notice ${ttsLive ? "is-ok" : ""}`}>
              {ttsLive === null ? tr("ttsChecking") : ttsLive ? tr("ttsOk") : tr("ttsOff")}
            </p>
            <label className="block text-sm">{tr("voiceEngine")}
              <select value={engine} onChange={(e) => {
                setEngine(e.target.value);
                trackRef.current = { id: "", tokens: [], text: "", mode: "", key: "" };
                beat.stop();
              }} className="field mt-1">
                <option value="cloud">{tr("cloud")}</option>
                <option value="device">{tr("device")}</option>
              </select>
            </label>
            {engine === "device" && (
              <>
                <label className="block text-sm">{tr("deviceVoice")}
                  <select value={deviceVoice} onChange={(e) => setDeviceVoice(e.target.value)} className="field mt-1">
                    <option value="">{tr("autoVoice")}</option>
                    {deviceVoices.map((v) => (
                      <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">{tr("pitch")} {pitchTrim.toFixed(2)}
                  <input type="range" min="-0.3" max="0.3" step="0.05" value={pitchTrim} onChange={(e) => setPitchTrim(Number(e.target.value))} className="w-full mt-1" />
                </label>
              </>
            )}
            {voiceNote && <p className="notice">{voiceNote}</p>}
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
                    <div className="ai-turn">
                      {(m.corrections || []).map((c, ci) => (
                        <div key={ci} className="fix-card">
                          <p>
                            <span className="fix-orig">{c.original}</span>
                            <span className="fix-arrow"> → </span>
                            <span className="fix-new">{c.fixed}</span>
                          </p>
                          {c.why ? <p className="fix-why">{c.why}</p> : null}
                        </div>
                      ))}
                      {m.praise ? <p className="praise">{m.praise}</p> : null}
                      <div className="bubble">
                        <BeatLine
                          tokens={m.tokens || beatsOf(m.text, lang.code)}
                          joiner={joiner}
                          active={trackId === `chat-${i}` ? highlight : -1}
                          native={gloss(m.native)}
                          nativeRatio={trackId === `chat-${i}` ? zhRatio(highlight, (m.tokens || []).length) : 0}
                          fromHere={tr("fromHere")}
                          onToken={(tok) => playTokens(`chat-${i}`, m.text, m.tokens || beatsOf(m.text, lang.code), tok, null)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {err && <p className="notice mt-1">{err}</p>}
            <div className="composer">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="field"
                rows={2}
                placeholder={listening ? tr("listening") : tr("composerPh")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <div className="composer-actions">
                <button
                  type="button"
                  className={`btn btn-mic ${listening ? "live" : "btn-ghost"}`}
                  onClick={toggleMic}
                  disabled={busy}
                  aria-label={tr("mic")}
                  title={tr("speakReply")}
                >
                  <MicIcon />
                  <span className="btn-mic-label">{listening ? tr("micOn") : tr("mic")}</span>
                </button>
                <button disabled={busy} onClick={send} className="btn btn-primary">{tr("send")}</button>
              </div>
            </div>
          </section>
        )}

        {tab === "read" && (
          <section className="panel story-read">
            {!passage && (
              <div className="story-empty">
                <StoryStage
                  passage={previewPassage(lang.code)}
                  playing={false}
                  preview
                  duration={29}
                  onToggle={generatePassage}
                  playLabel={tr("playStory")}
                  pauseLabel={tr("pauseStory")}
                />
                <div className="story-empty-copy">
                  <p>{tr("storyHint")}</p>
                  <button className="btn btn-accent w-full max-w-sm" disabled={busy} onClick={generatePassage}>{busy ? "…" : tr("playStory")}</button>
                  {err && <p className="notice">{err}</p>}
                </div>
              </div>
            )}
            {passage && (
              <>
                <StoryStage
                  passage={passage}
                  playing={beat.playing && trackId === "read"}
                  current={trackId === "read" && highlight >= 0 ? (beat.timesRef.current[highlight]?.start || 0) : 0}
                  duration={trackId === "read" ? (beat.timesRef.current[beat.timesRef.current.length - 1]?.end || 0) : 0}
                  onToggle={toggleStoryPlay}
                  playLabel={tr("playStory")}
                  pauseLabel={tr("pauseStory")}
                />
                <div className="scroll-pane story-page">
                  <h2 className="story-title">{passage.title}</h2>
                  {gloss(passage.title_zh) ? <p className="story-title-zh">{passage.title_zh}</p> : null}
                  {passage.sentences.map((s, i) => {
                    const range = sentenceRange(passage.sentences, i);
                    const local = trackId === "read" && highlight >= range[0] && highlight <= range[1] ? highlight - s.start : -1;
                    const done = trackId === "read" && highlight > range[1];
                    const looping = beat.loop && beat.loop[0] === range[0] && beat.loop[1] === range[1];
                    const ratio = local >= 0 ? zhRatio(local, s.tokens.length) : (done ? 1 : 0);
                    return (
                      <article key={i} className={`read-sent ${local >= 0 ? "live" : ""} ${looping ? "looping" : ""}`}>
                        <BeatLine
                          variant="story"
                          tokens={s.tokens}
                          joiner={joiner}
                          active={local}
                          native={gloss(s.zh)}
                          nativeRatio={ratio}
                          fromHere={tr("fromHere")}
                          onToken={(tok) => playPassageFrom(s.start + tok, beat.loop, passage)}
                        />
                      </article>
                    );
                  })}
                </div>
                <div className="story-tools">
                  <button className="btn btn-accent btn-mini" onClick={() => playPassageFrom(0, beat.loop, passage)}>{tr("playAll")}</button>
                  <button className="btn btn-ghost btn-mini" onClick={() => beat.stop()}>{tr("stop")}</button>
                  <button className="btn btn-ghost btn-mini" onClick={() => setShowZh((v) => !v)}>{showZh ? tr("hideZh") : tr("showZh")}</button>
                  <button className="btn btn-line btn-mini" onClick={() => setSaves(savePassage(passage))}>{isSaved(passage.id) ? tr("saved") : tr("save")}</button>
                  <button className="btn btn-ghost btn-mini" disabled={busy} onClick={generatePassage}>{tr("newPassage")}</button>
                  {["slow", "normal", "fast"].map((id) => (
                    <button key={id} className={`btn btn-mini ${rate === id ? "btn-accent" : "btn-ghost"}`} onClick={() => { setRate(id); trackRef.current = { id: "", tokens: [], text: "", mode: "", key: "" }; }}>{tr(id)}</button>
                  ))}
                  {err && <p className="notice w-full">{err}</p>}
                </div>
              </>
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
                nativeRatio={trackId === "vocab-word" ? zhRatio(highlight, vocabTokens.length) : 0}
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
                    nativeRatio={trackId === "vocab-sent" ? zhRatio(highlight, vocabSentTokens.length) : 0}
                    fromHere={tr("fromHere")}
                    onToken={(tok) => playTokens("vocab-sent", v.sentence, vocabSentTokens, tok, null)}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 shrink-0">
              <button className="btn btn-ghost" onClick={() => setShowAns(true)}>{tr("reveal")}</button>
              <button className="btn btn-line" disabled={busy} onClick={() => { gain(4); notePractice("vocab", 1); nextVocab(true); }}>{tr("next")}</button>
              <button className="btn btn-ghost" onClick={() => playTokens("vocab-word", v.word, vocabTokens, 0, null)}>{tr("listen")}</button>
            </div>
            {err && <p className="notice mt-2 shrink-0">{err}</p>}
          </section>
        )}

        {tab === "examples" && canAccess(user, "examples") && (
          <section className="panel">
            <h2>{tr("drill")}</h2>
            <div className="scroll-pane flex items-center">
              <BeatLine
                tokens={exampleTokens}
                joiner={joiner}
                active={trackId === "example" ? highlight : -1}
                native={gloss(ex.sentence_zh)}
                nativeRatio={trackId === "example" ? zhRatio(highlight, exampleTokens.length) : 0}
                fromHere={tr("fromHere")}
                onToken={(tok) => { playTokens("example", ex.sentence, exampleTokens, tok, null); gain(2); }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 shrink-0">
              <button className="btn btn-line" onClick={() => { playTokens("example", ex.sentence, exampleTokens, 0, null); gain(5); }}>{tr("listen")}</button>
              <button className="btn btn-ghost" onClick={() => playTokens("example", ex.sentence, exampleTokens, 0, [0, exampleTokens.length - 1])}>{tr("loop")}</button>
              <button className="btn btn-ghost" disabled={busy} onClick={() => { notePractice("examples", 1); nextExample(true); }}>{tr("newExample")}</button>
            </div>
            {err && <p className="notice mt-2 shrink-0">{err}</p>}
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
                  nativeRatio={trackId === "scene" ? zhRatio(highlight, sceneTokens.length) : 0}
                  fromHere={tr("fromHere")}
                  onToken={(tok) => playTokens("scene", scene.prompt, sceneTokens, tok, null)}
                />
              </div>
            </div>
            <button className="btn btn-ghost w-full mt-3 shrink-0" onClick={() => { playTokens("scene", scene.prompt, sceneTokens, 0, null); gain(6); }}>{tr("listen")}</button>
            <button className="btn btn-line w-full mt-2 shrink-0" disabled={busy} onClick={() => { notePractice("scenes", 1); nextScene(true); }}>{tr("newScene")}</button>
            {err && <p className="notice mt-2 shrink-0">{err}</p>}
          </section>
        )}

        {tab === "exams" && canAccess(user, "exams") && (
          <section className="panel">
            <h2>{tr("exam")} · {examBoard(lang.code)}</h2>
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
            <div className="grid grid-cols-2 gap-2 mt-3 shrink-0">
              <button className="btn btn-primary" onClick={() => {
                if (examPick === item.a) { gain(12); setErr(tr("correct")); }
                else setErr(tr("wrong"));
                setExamPick(-1);
                notePractice("exams", 1);
                nextExam(false);
              }}>{tr("check")}</button>
              <button className="btn btn-ghost" disabled={busy} onClick={() => nextExam(true)}>{tr("next")}</button>
            </div>
            {err && <p className="mt-2 shrink-0">{err}</p>}
          </section>
        )}

        {tab === "saves" && (
          <section className="panel">
            <h2>{tr("saves")}</h2>
            <div className="scroll-pane mt-2 space-y-2">
              <p className="text-sm text-[var(--mute)]">{tr("savesHint")}</p>
              {saves.length === 0 && <p className="empty-pane">{tr("savesEmpty")}</p>}
              {saves.map((row) => (
                <div key={row.id} className="save-row">
                  <button className="btn btn-ghost btn-wrap flex-1" onClick={() => {
                    const packed = openPassage(row);
                    setTab("read");
                    playPassageFrom(0, null, packed);
                  }}>
                    <span>{row.title}</span>
                    {row.title_zh ? <span className="opt-native">{row.title_zh}</span> : null}
                  </button>
                  <button className="btn btn-line btn-mini" onClick={() => setSaves(removeSave(row.id))}>{tr("remove")}</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "board" && (
          <section className="panel">
            <h2>{tr("board")}</h2>
            <div className="scroll-pane mt-2">
              {(() => {
                const score = computeScore(week);
                const rows = fakeFriends(score.total, user.username);
                return (
                  <>
                    <p className="display text-3xl">{score.total}</p>
                    <p className="text-sm text-[var(--mute)]">{tr("weekScore")} · {week.week}</p>
                    <button className="btn btn-ghost mt-3" onClick={() => setScoreOpen((v) => !v)}>{tr("scoreHow")}</button>
                    {scoreOpen && (
                      <ul className="score-bars mt-3">
                        {[
                          ["frequency", tr("freq"), 400],
                          ["duration", tr("dur"), 300],
                          ["diversity", tr("div"), 200],
                          ["streak", tr("streak"), 100],
                        ].map(([key, label, max]) => (
                          <li key={key}>
                            <div className="flex justify-between text-sm"><span>{label}</span><span>{score[key]} / {max}</span></div>
                            <div className="bar"><i style={{ width: `${Math.min(100, (score[key] / max) * 100)}%` }} /></div>
                          </li>
                        ))}
                      </ul>
                    )}
                    <h3 className="display text-sm mt-4">{tr("friends")}</h3>
                    <p className="text-xs text-[var(--mute)]">{tr("friendsHint")}</p>
                    <ul className="mt-2 space-y-2 text-sm">
                      {rows.map((row) => (
                        <li key={row.name} className={`flex justify-between border-b border-[var(--line)] py-1 ${row.me ? "font-bold" : ""}`}>
                          <span>{row.rank}. {row.name}{row.me ? ` · ${tr("you")}` : ""}</span>
                          <span>{row.score}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                );
              })()}
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
