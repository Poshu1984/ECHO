import { useState, useRef, useEffect, useMemo } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const LANGS = [
  { code: "en", name: "English", zh: "英文", speech: "en-US", greet: "Hi! I'm here. What did you do this morning?" },
  { code: "ja", name: "日本語", zh: "日文", speech: "ja-JP", greet: "こんにちは。今朝は何をしましたか？" },
  { code: "fr", name: "Français", zh: "法文", speech: "fr-FR", greet: "Salut ! Qu'as-tu fait ce matin ?" },
  { code: "ko", name: "한국어", zh: "韓文", speech: "ko-KR", greet: "안녕하세요. 오늘 아침에 뭐 했어요?" },
  { code: "es", name: "Español", zh: "西文", speech: "es-ES", greet: "¡Hola! ¿Qué hiciste esta mañana?" },
];
// Approximate public correspondence tables (CEFR<->TOEIC<->IELTS) — commonly
// cited reference ranges, not an official conversion; a compass, not a score guarantee.
const LEVELS = [
  { id: "A2", zh: "初級", toeic: "225–549", ielts: "3.0–3.5" },
  { id: "B1", zh: "中級", toeic: "550–784", ielts: "4.0–5.0" },
  { id: "B2", zh: "中高級", toeic: "785–944", ielts: "5.5–6.5" },
];
const TUTORS = {
  f: { name: "Audrey", zh: "女聲", preferred: "Audrey" },
  m: { name: "Brad", zh: "男聲", preferred: "Brad" },
};
const SPEEDS = [{ id: 0.5, label: "慢" }, { id: 0.9, label: "正常" }, { id: 1.15, label: "快" }];

const C = { paper: "#FBF8F3", ink: "#1B2A41", red: "#D8493A", green: "#2E7D5B", gold: "#C9971F", mute: "#8A8F98", line: "#E6E1D8" };
const FONT = { fontFamily: "'Avenir Next', 'Helvetica Neue', 'Noto Sans TC', 'PingFang TC', sans-serif" };

async function askClaude(system, messages) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1200, system, messages }),
  });
  const data = await res.json();
  const raw = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

function chatPrompt(lang, level, tutor) {
  const band = LEVELS.find(l => l.id === level);
  return `You are ${tutor.name}, a warm ${lang.name} conversation tutor. The learner is Taiwanese, native language Traditional Chinese, level ${lang.name} CEFR ${level} (roughly TOEIC ${band?.toeic}, IELTS ${band?.ielts}).
Rules:
- Keep the conversation going naturally in ${lang.name}. Reply in 1-3 short sentences suited to level ${level}, and always end with a question.
- Check the learner's latest message for errors (grammar, word choice, unnatural phrasing). List each one.
- Never lecture. Corrections go in the JSON, not in your reply text.
Respond ONLY with JSON, no markdown fences:
{"reply":"<your ${lang.name} reply>","reply_zh":"<繁體中文翻譯>","corrections":[{"original":"<learner's exact wording>","fixed":"<natural version>","why":"<一句繁體中文說明>"}],"praise":"<if there were no errors, one short 繁體中文 encouragement, else empty string>"}`;
}

function readingPrompt(lang, level, topic) {
  const band = LEVELS.find(l => l.id === level);
  return `Write a short ${lang.name} passage for read-aloud practice, CEFR ${level} (roughly TOEIC ${band?.toeic}, IELTS ${band?.ielts}), 4-6 sentences total, everyday topic${topic ? `: ${topic}` : ""}. Natural spoken rhythm, no lists.
Break it into individual sentences. For EACH sentence provide the ${lang.name} text and its Traditional Chinese translation, sentence-for-sentence (same meaning, same order).
Respond ONLY with JSON, no markdown fences:
{"title":"<short ${lang.name} title>","title_zh":"<繁體中文標題>","sentences":[{"text":"<sentence in ${lang.name}>","zh":"<對應的繁體中文翻譯>"}]}`;
}

function tokenizeSentence(text, code) {
  if (code === "ja") {
    const out = []; let buf = "";
    for (const ch of text) { buf += ch; if (/[、。！？!?\n]/.test(ch) || buf.length >= 3) { out.push(buf); buf = ""; } }
    if (buf) out.push(buf);
    return out;
  }
  return text.split(/(\s+)/).filter(t => t.trim().length > 0);
}

function pickDeviceVoice(speechLang, gender, preferredName, overrideName) {
  if (!("speechSynthesis" in window)) return { voice: null, matchedPreferred: false };
  const voices = window.speechSynthesis.getVoices();
  const base = speechLang.split("-")[0];
  const cands = voices.filter(v => v.lang.replace("_", "-").toLowerCase().startsWith(base));
  if (!cands.length) return { voice: null, matchedPreferred: false };
  if (overrideName) {
    const chosen = cands.find(v => v.name === overrideName);
    if (chosen) return { voice: chosen, matchedPreferred: true };
  }
  const exact = cands.find(v => v.name.toLowerCase().includes(preferredName.toLowerCase()));
  if (exact) return { voice: exact, matchedPreferred: true };
  const female = /female|woman|samantha|karen|moira|tessa|kyoko|o-ren|amelie|audrey|marie|yuna|sora|monica|paulina|lucia|zira|aria|jenny|nanami|denise|sunhi|elvira|siri/i;
  const male = /male|man\b|daniel|alex|fred|tom|otoya|ichiro|thomas|nicolas|minsu|jorge|diego|david|guy|keita|henri|injoon|alvaro|arthur|brad/i;
  const want = gender === "f" ? female : male;
  const avoid = gender === "f" ? male : female;
  const guess = cands.find(v => want.test(v.name) && !avoid.test(v.name)) || cands.find(v => !avoid.test(v.name)) || cands[0];
  return { voice: guess, matchedPreferred: false };
}

function escapeXml(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function buildMarkedSSML(tokens, noSpace) {
  let ssml = "<speak>";
  tokens.forEach((tok, i) => { ssml += `<mark name="w${i}"/>${escapeXml(tok)}`; if (!noSpace) ssml += " "; });
  ssml += "</speak>";
  return ssml;
}

// ---------- scoring ----------
// Weekly score, max ~1000. Weighted: frequency 40%, duration 30%, diversity 20%, streak 10%.
function computeScore(stats) {
  const freqPart = Math.min(stats.sessions / 7, 1) * 400;
  const durPart = Math.min(stats.minutes / 210, 1) * 300;
  const langDiv = Math.min(stats.langs.size / 3, 1);
  const modeDiv = Math.min(stats.modes.size / 2, 1);
  const divPart = (langDiv * 0.6 + modeDiv * 0.4) * 200;
  const streakPart = Math.min(stats.streak / 14, 1) * 100;
  return Math.round(freqPart + durPart + divPart + streakPart);
}
function scoreBreakdown(stats) {
  return [
    { label: "頻率", value: Math.round(Math.min(stats.sessions / 7, 1) * 400), max: 400, detail: `本週 ${stats.sessions} 次練習` },
    { label: "時長", value: Math.round(Math.min(stats.minutes / 210, 1) * 300), max: 300, detail: `本週約 ${stats.minutes} 分鐘` },
    { label: "多元性", value: Math.round(((Math.min(stats.langs.size / 3, 1)) * 0.6 + (Math.min(stats.modes.size / 2, 1)) * 0.4) * 200), max: 200, detail: `${stats.langs.size} 種語言 · ${stats.modes.size} 種練習方式` },
    { label: "連續天數", value: Math.round(Math.min(stats.streak / 14, 1) * 100), max: 100, detail: `連續 ${stats.streak} 天` },
  ];
}
const MOCK_FRIENDS = [
  { name: "阿凱", avatar: "🏋️", sessions: 9, minutes: 190, langs: 3, modes: 2, streak: 21 },
  { name: "Yuki", avatar: "🎧", sessions: 6, minutes: 140, langs: 2, modes: 2, streak: 9 },
  { name: "小美", avatar: "📚", sessions: 5, minutes: 95, langs: 1, modes: 1, streak: 5 },
  { name: "Ben", avatar: "🎯", sessions: 8, minutes: 160, langs: 2, modes: 1, streak: 14 },
  { name: "Chloe", avatar: "🌱", sessions: 3, minutes: 60, langs: 1, modes: 2, streak: 2 },
].map(f => ({ ...f, score: computeScore({ sessions: f.sessions, minutes: f.minutes, langs: new Set(Array(f.langs).fill(0).map((_, i) => i)), modes: new Set(Array(f.modes).fill(0).map((_, i) => i)), streak: f.streak }) }));

export default function App() {
  const [screen, setScreen] = useState("setup"); // setup | chat | read | favs | board
  const [lang, setLang] = useState(LANGS[0]);
  const [level, setLevel] = useState("B1");
  const [gender, setGender] = useState("f");
  const [voiceOn, setVoiceOn] = useState(true);
  const [err, setErr] = useState("");
  const [activeVoiceName, setActiveVoiceName] = useState("");
  const [matchedPreferred, setMatchedPreferred] = useState(false);
  const tutor = TUTORS[gender];

  // ---- TTS engine: device (free, built-in) or Google Cloud TTS (proxied by backend) ----
  const [ttsProvider, setTtsProvider] = useState("google"); // device | google
  const [googleVoicesForLang, setGoogleVoicesForLang] = useState([]);
  const [googleVoiceOverride, setGoogleVoiceOverride] = useState({ f: "", m: "" });
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleErr, setGoogleErr] = useState("");
  const audioRef = useRef(null);

  const [voiceOverride, setVoiceOverride] = useState({ f: "", m: "" });
  const [pitchTrim, setPitchTrim] = useState({ f: 0, m: 0 });
  const [availVoices, setAvailVoices] = useState([]);
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => setAvailVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", load);
  }, []);
  const voicesForLang = availVoices.filter(v => v.lang.replace("_", "-").toLowerCase().startsWith(lang.speech.split("-")[0]));

  useEffect(() => {
    if (ttsProvider !== "google") { setGoogleVoicesForLang([]); return; }
    let cancelled = false;
    setGoogleLoading(true); setGoogleErr("");
    fetch(`${API_URL}/api/tts/voices?languageCode=${encodeURIComponent(lang.speech)}`)
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ d }) => {
        if (cancelled) return;
        if (d.error) { setGoogleErr(d.error.message || d.error || "無法取得語音清單"); setGoogleVoicesForLang([]); }
        else setGoogleVoicesForLang(d.voices || []);
      })
      .catch(() => { if (!cancelled) { setGoogleErr("無法連線到語音服務"); setGoogleVoicesForLang([]); } })
      .finally(() => { if (!cancelled) setGoogleLoading(false); });
    return () => { cancelled = true; };
  }, [ttsProvider, lang.code, lang.speech]);

  function pickGoogleVoice(g) {
    const override = googleVoiceOverride[g];
    if (override) { const found = googleVoicesForLang.find(v => v.name === override); if (found) return found; }
    const wantGender = g === "f" ? "FEMALE" : "MALE";
    const byTier = tier => googleVoicesForLang.find(v => v.ssmlGender === wantGender && v.name.includes(tier));
    return byTier("Neural2") || byTier("Wavenet") || googleVoicesForLang.find(v => v.ssmlGender === wantGender) || googleVoicesForLang[0] || { languageCodes: [lang.speech], name: `${lang.speech}-Standard-${g === "f" ? "A" : "B"}` };
  }

  async function synthGoogle(ssml, voice, rate) {
    const res = await fetch(`${API_URL}/api/tts/synthesize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ssml,
        voice: { languageCode: voice.languageCodes?.[0] || lang.speech, name: voice.name },
        audioConfig: { audioEncoding: "MP3", speakingRate: Math.max(0.25, Math.min(4, rate)) },
        enableTimePointing: ["SSML_MARK"],
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "Google TTS 呼叫失敗");
    return data;
  }

  // ---- favorites: saved passages the learner can reopen later (in-memory only) ----
  const [favorites, setFavorites] = useState([]);
  function isFavorited(p) { return p && favorites.some(f => f.title === p.title && f.lang === lang.code); }
  function toggleFavorite() {
    if (!passage) return;
    if (isFavorited(passage)) setFavorites(fs => fs.filter(f => !(f.title === passage.title && f.lang === lang.code)));
    else setFavorites(fs => [{ id: Date.now(), title: passage.title, title_zh: passage.title_zh, lang: lang.code, langName: lang.name, level, sentences: passage.sentences, savedAt: new Date() }, ...fs]);
  }
  function openFavorite(f) {
    setLang(LANGS.find(l => l.code === f.lang) || lang);
    setLevel(f.level);
    buildPassageFromSentences(f.sentences, f.title, f.title_zh, f.lang);
    setScreen("read");
  }
  function buildPassageFromSentences(sentences, title, title_zh, langCode) {
    const fullText = sentences.map(s => s.text).join(langCode === "ja" ? "" : " ");
    const flat = []; sentences.forEach((s, si) => s.tokens.forEach(tok => flat.push({ tok, sentenceIdx: si })));
    const starts = []; let pos = 0;
    for (const { tok } of flat) { const i = fullText.indexOf(tok, pos); starts.push(i < 0 ? pos : i); pos = (i < 0 ? pos : i) + tok.length; }
    setPassage({ title, title_zh, sentences, fullText, flat, starts });
    setCur(-1); setCurSentence(-1);
  }

  // ---- gamification state (in-memory only; a real build persists this server-side) ----
  const [stats, setStats] = useState({ sessions: 4, minutes: 82, langs: new Set(["en"]), modes: new Set(["chat"]), streak: 6, corrections: 0 });
  const [showBreakdown, setShowBreakdown] = useState(false);
  const myScore = useMemo(() => computeScore(stats), [stats]);
  function logActivity(mode, minutesAdded) {
    setStats(s => {
      const langs = new Set(s.langs); langs.add(lang.code);
      const modes = new Set(s.modes); modes.add(mode);
      return { ...s, sessions: s.sessions + 1, minutes: s.minutes + minutesAdded, langs, modes };
    });
  }

  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  const [passage, setPassage] = useState(null);
  const [cur, setCur] = useState(-1);
  const [curSentence, setCurSentence] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [showZh, setShowZh] = useState(true);
  const [speed, setSpeed] = useState(0.5);
  const timerRef = useRef(null);
  const boundaryRef = useRef(false);

  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  function stopSpeech() {
    try { window.speechSynthesis?.cancel(); } catch {}
    if (audioRef.current) { try { audioRef.current.pause(); } catch {} audioRef.current = null; }
    clearInterval(timerRef.current);
    setPlaying(false);
  }

  // Low-level device (Web Speech) single-shot playback — returns the utterance.
  function speakDevice(text, opts = {}) {
    if (!canSpeak) return null;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang.speech;
      u.rate = opts.rate ?? 0.92;
      u.pitch = (gender === "f" ? 1.05 : 0.9) + (pitchTrim[gender] || 0);
      const { voice, matchedPreferred: mp } = pickDeviceVoice(lang.speech, gender, tutor.preferred, voiceOverride[gender]);
      if (voice) u.voice = voice;
      setActiveVoiceName(voice ? voice.name : "系統預設");
      setMatchedPreferred(mp);
      window.speechSynthesis.speak(u);
      return u;
    } catch { return null; }
  }

  // Low-level Google single-shot playback (no word marks — used for chat bubbles / test-listen).
  async function speakGoogleSimple(text) {
    const voice = pickGoogleVoice(gender);
    if (!voice) { setErr("找不到符合的 Google 語音，請確認語言或稍後再試"); return; }
    if (audioRef.current) { try { audioRef.current.pause(); } catch {} }
    try {
      const data = await synthGoogle(`<speak>${escapeXml(text)}</speak>`, voice, 0.95);
      const audio = new Audio("data:audio/mp3;base64," + data.audioContent);
      audioRef.current = audio;
      setActiveVoiceName(voice.name);
      setMatchedPreferred(true);
      audio.play();
    } catch (e) { setErr(e.message || "Google TTS 呼叫失敗"); }
  }

  // Single entry point used by chat + test-listen. Dispatches by provider.
  function speak(text, opts = {}) {
    if (!opts.force && !voiceOn) return null;
    if (ttsProvider === "google") { speakGoogleSimple(text); return null; }
    return speakDevice(text, opts);
  }

  function startChat() {
    setMsgs([{ role: "tutor", text: lang.greet, zh: "" }]);
    setScreen("chat");
    setTimeout(() => speak(lang.greet), 200);
  }

  async function send(text) {
    const t = text.trim();
    if (!t || busy) return;
    setInput(""); setErr("");
    const next = [...msgs, { role: "me", text: t }];
    setMsgs(next); setBusy(true);
    try {
      const history = next.map(m => ({ role: m.role === "me" ? "user" : "assistant", content: m.role === "me" ? m.text : JSON.stringify({ reply: m.text, corrections: [] }) }));
      const p = await askClaude(chatPrompt(lang, level, tutor), history);
      const tm = { role: "tutor", text: p.reply || "", zh: p.reply_zh || "", corrections: Array.isArray(p.corrections) ? p.corrections : [], praise: p.praise || "" };
      setMsgs(m => [...m, tm]);
      speak(tm.text);
      logActivity("chat", 2);
    } catch {
      setErr("家教沒有回應，請再送一次。");
      setMsgs(m => m.slice(0, -1)); setInput(t);
    } finally { setBusy(false); }
  }

  async function genPassage(topic) {
    stopSpeech(); setErr(""); setBusy(true); setCur(-1); setCurSentence(-1);
    try {
      const p = await askClaude(readingPrompt(lang, level, topic), [{ role: "user", content: "Generate the passage." }]);
      const sentences = (p.sentences || []).map(s => ({ ...s, tokens: tokenizeSentence(s.text || "", lang.code) }));
      buildPassageFromSentences(sentences, p.title, p.title_zh, lang.code);
    } catch { setErr("段落生成失敗，請再試一次。"); }
    finally { setBusy(false); }
  }

  // ---- device-based word-synced playback (Web Speech boundary events + timer fallback) ----
  function playDeviceFrom(fromIdx) {
    if (!passage) return;
    if (!canSpeak) { setErr("此瀏覽器無法朗讀。"); return; }
    stopSpeech();
    const { fullText, flat, starts } = passage;
    if (fromIdx >= flat.length) fromIdx = 0;
    const offset = starts[fromIdx];
    const subText = fullText.slice(offset);
    setCur(fromIdx); setCurSentence(flat[fromIdx]?.sentenceIdx ?? 0); setPlaying(true);
    boundaryRef.current = false;
    const u = speakDevice(subText, { force: true, rate: speed });
    if (!u) { setPlaying(false); return; }
    const subStarts = starts.slice(fromIdx).map(s => s - offset);
    function applyLocal(localIdx) { const g = fromIdx + localIdx; setCur(g); setCurSentence(flat[g]?.sentenceIdx ?? 0); }
    u.onboundary = e => {
      if (e.name && e.name !== "word") return;
      boundaryRef.current = true; clearInterval(timerRef.current);
      let idx = 0; for (let i = 0; i < subStarts.length; i++) if (subStarts[i] <= e.charIndex) idx = i;
      applyLocal(idx);
    };
    u.onend = () => { clearInterval(timerRef.current); setCur(flat.length); setCurSentence(passage.sentences.length); setPlaying(false); logActivity("read", 3); };
    u.onerror = () => { clearInterval(timerRef.current); setPlaying(false); };
    const totalChars = subText.length;
    const cps = (lang.code === "ja" ? 6 : lang.code === "ko" ? 8 : 14) * speed;
    const totalMs = (totalChars / cps) * 1000; const t0 = Date.now();
    timerRef.current = setInterval(() => {
      if (boundaryRef.current) return;
      const frac = Math.min(1, (Date.now() - t0) / totalMs);
      const target = frac * totalChars;
      let idx = 0; for (let i = 0; i < subStarts.length; i++) if (subStarts[i] <= target) idx = i;
      applyLocal(idx);
    }, 80);
  }

  // ---- Google-based word-synced playback (SSML <mark> timepoints) ----
  async function playGoogleFrom(fromIdx) {
    if (!passage) return;
    const voice = pickGoogleVoice(gender);
    if (!voice) { setErr("找不到符合的 Google 語音，請確認語言或稍後再試"); return; }
    stopSpeech();
    const { flat } = passage;
    if (fromIdx >= flat.length) fromIdx = 0;
    const subFlat = flat.slice(fromIdx);
    const ssml = buildMarkedSSML(subFlat.map(f => f.tok), lang.code === "ja");
    setCur(fromIdx); setCurSentence(flat[fromIdx]?.sentenceIdx ?? 0); setPlaying(true); setBusy(true);
    try {
      const data = await synthGoogle(ssml, voice, speed);
      setBusy(false);
      const audio = new Audio("data:audio/mp3;base64," + data.audioContent);
      audioRef.current = audio;
      setActiveVoiceName(voice.name); setMatchedPreferred(true);
      const marks = (data.timepoints || []).map(tp => ({ idx: parseInt(String(tp.markName).slice(1), 10) || 0, time: tp.timeSeconds || 0 }));
      audio.ontimeupdate = () => {
        if (!marks.length) return;
        let localIdx = 0; for (const m of marks) if (m.time <= audio.currentTime) localIdx = m.idx;
        const g = fromIdx + localIdx; setCur(g); setCurSentence(flat[g]?.sentenceIdx ?? 0);
      };
      audio.onended = () => { setCur(flat.length); setCurSentence(passage.sentences.length); setPlaying(false); logActivity("read", 3); };
      audio.onerror = () => { setPlaying(false); setErr("播放失敗"); };
      audio.play();
    } catch (e) { setBusy(false); setPlaying(false); setErr(e.message || "Google TTS 呼叫失敗"); }
  }

  function playFrom(fromIdx) {
    if (ttsProvider === "google") playGoogleFrom(fromIdx);
    else playDeviceFrom(fromIdx);
  }
  function startRead() { playFrom(0); }

  function goSetup() { stopSpeech(); setScreen("setup"); setMsgs([]); setInput(""); setErr(""); setPassage(null); setCur(-1); setCurSentence(-1); }

  const Seg = ({ items, value, onChange, cols }) => (
    <div className={`grid gap-2 ${cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-3" : "grid-cols-1"}`}>
      {items.map(it => {
        const on = value === it.id;
        return (
          <button key={it.id} onClick={() => onChange(it.id)} className="text-left px-4 py-3 rounded-xl border transition-colors"
            style={{ borderColor: on ? C.ink : C.line, background: on ? C.ink : "transparent", color: on ? C.paper : C.ink }}>
            <div className="text-base font-medium">{it.label}</div>
            {it.sub && <div className="text-xs" style={{ opacity: 0.7 }}>{it.sub}</div>}
          </button>
        );
      })}
    </div>
  );

  const TabBar = () => (
    <div className="flex border-t" style={{ borderColor: C.line, background: "#fff" }}>
      {[
        { id: "chat", label: "對話", icon: "💬" },
        { id: "read", label: "朗讀", icon: "📖" },
        { id: "favs", label: "收藏", icon: "⭐" },
        { id: "board", label: "排行榜", icon: "🏆" },
      ].map(t => (
        <button key={t.id} onClick={() => { if (t.id === "chat" && msgs.length === 0) startChat(); else setScreen(t.id); }}
          className="flex-1 py-3 flex flex-col items-center gap-0.5" style={{ color: screen === t.id ? C.red : C.mute }}>
          <span className="text-lg">{t.icon}</span>
          <span className="text-xs font-medium">{t.label}</span>
        </button>
      ))}
    </div>
  );

  if (screen === "setup") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: C.paper, color: C.ink, ...FONT }}>
        <div className="px-6 pt-10 pb-6 max-w-md w-full mx-auto flex-1 flex flex-col">
          <p className="text-sm" style={{ color: C.mute }}>ECHOO · AI 語言家教</p>
          <h1 className="text-3xl font-semibold leading-tight mt-2" style={{ letterSpacing: "-0.01em" }}>邊聊邊改，<br />錯的地方當場看到。</h1>

          <p className="mt-7 mb-2 text-sm" style={{ color: C.mute }}>語言</p>
          <Seg cols={2} value={lang.code} onChange={id => setLang(LANGS.find(l => l.code === id))} items={LANGS.map(l => ({ id: l.code, label: l.name, sub: l.zh }))} />

          <p className="mt-5 mb-2 text-sm" style={{ color: C.mute }}>程度</p>
          <Seg cols={3} value={level} onChange={setLevel} items={LEVELS.map(lv => ({ id: lv.id, label: `${lv.id} ${lv.zh}`, sub: `TOEIC ${lv.toeic} · IELTS ${lv.ielts}` }))} />
          <p className="text-xs mt-1" style={{ color: C.mute }}>對照為常見公開換算區間，非官方成績預測</p>

          <p className="mt-5 mb-2 text-sm" style={{ color: C.mute }}>家教</p>
          <Seg cols={2} value={gender} onChange={setGender} items={[{ id: "f", label: "Audrey", sub: "女聲" }, { id: "m", label: "Brad", sub: "男聲" }]} />

          <p className="mt-5 mb-2 text-sm" style={{ color: C.mute }}>語音引擎</p>
          <Seg cols={2} value={ttsProvider} onChange={setTtsProvider} items={[
            { id: "device", label: "裝置內建", sub: "免費，音質普通" },
            { id: "google", label: "Google Cloud TTS（已內建）", sub: "較自然，由伺服器代理" },
          ]} />

          {ttsProvider === "device" && (
            <details className="mt-3 rounded-xl border px-4 py-3" style={{ borderColor: C.line }}>
              <summary className="text-sm font-medium cursor-pointer">手動優化 {tutor.name} 的聲音</summary>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs mb-1" style={{ color: C.mute }}>指定裝置語音（僅列出「{lang.name}」可用的聲音）</p>
                  <select value={voiceOverride[gender]} onChange={e => setVoiceOverride(v => ({ ...v, [gender]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: C.line, background: "#fff", color: C.ink }}>
                    <option value="">自動（優先找 {tutor.preferred}）</option>
                    {voicesForLang.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                  </select>
                  {!voicesForLang.length && <p className="text-xs mt-1" style={{ color: C.red }}>這台裝置目前找不到「{lang.name}」的語音</p>}
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1" style={{ color: C.mute }}><span>音調微調</span><span>{pitchTrim[gender] > 0 ? "+" : ""}{pitchTrim[gender].toFixed(2)}</span></div>
                  <input type="range" min="-0.3" max="0.3" step="0.05" value={pitchTrim[gender]} onChange={e => setPitchTrim(v => ({ ...v, [gender]: parseFloat(e.target.value) }))} className="w-full" />
                </div>
                <button onClick={() => speak(lang.greet, { force: true })} className="text-sm font-medium px-4 py-2 rounded-lg" style={{ background: C.ink, color: C.paper }}>試聽</button>
              </div>
            </details>
          )}

          {ttsProvider === "google" && (
            <details open className="mt-3 rounded-xl border px-4 py-3" style={{ borderColor: C.line }}>
              <summary className="text-sm font-medium cursor-pointer">Google Cloud TTS（已內建）</summary>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs mb-1" style={{ color: C.mute }}>{tutor.name} 使用的語音（{lang.name}）</p>
                  {googleLoading && <p className="text-xs" style={{ color: C.mute }}>讀取語音清單中…</p>}
                  {googleErr && <p className="text-xs" style={{ color: C.red }}>{googleErr}</p>}
                  {!googleLoading && (
                    <select value={googleVoiceOverride[gender]} onChange={e => setGoogleVoiceOverride(v => ({ ...v, [gender]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: C.line, background: "#fff", color: C.ink }}>
                      <option value="">自動（優先 Neural2 → Wavenet → 標準）</option>
                      {googleVoicesForLang.filter(v => v.ssmlGender === (gender === "f" ? "FEMALE" : "MALE")).map(v => (
                        <option key={v.name} value={v.name}>{v.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <button onClick={() => speak(lang.greet, { force: true })} className="text-sm font-medium px-4 py-2 rounded-lg" style={{ background: C.ink, color: C.paper }}>試聽</button>
              </div>
            </details>
          )}

          <div className="mt-6 rounded-2xl px-4 py-3 flex items-center justify-between" style={{ background: "#FFF6E0", border: "1px solid #F0DBA0" }}>
            <div>
              <div className="text-sm font-medium">本週積分</div>
              <div className="text-xs" style={{ color: C.mute }}>對話、朗讀都會計分</div>
            </div>
            <div className="text-2xl font-bold" style={{ color: C.gold }}>{myScore}</div>
          </div>

          <div className="mt-auto pt-6 space-y-2">
            <button onClick={startChat} className="w-full py-4 rounded-2xl text-lg font-medium" style={{ background: C.red, color: "#fff" }}>開始和 {tutor.name} 聊 {lang.name}</button>
            <button onClick={() => { setScreen("read"); genPassage(""); }} className="w-full py-3 rounded-2xl text-base font-medium border" style={{ borderColor: C.ink, color: C.ink }}>練朗讀</button>
            <button onClick={() => setScreen("favs")} className="w-full py-3 rounded-2xl text-base font-medium" style={{ color: C.mute }}>我的收藏 →</button>
            <button onClick={() => setScreen("board")} className="w-full py-3 rounded-2xl text-base font-medium" style={{ color: C.mute }}>查看排行榜 →</button>
          </div>
        </div>
      </div>
    );
  }

  const Header = ({ title }) => (
    <header className="flex items-center justify-between px-5 pt-5 pb-3 border-b" style={{ borderColor: C.line }}>
      <button onClick={goSetup} className="text-sm" style={{ color: C.mute }}>← 重新設定</button>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-sm font-semibold" style={{ color: C.gold }}>⭐ {myScore}</div>
    </header>
  );

  const VoiceNote = () => activeVoiceName ? (
    <p className="text-xs mt-2" style={{ color: C.mute }}>
      目前使用的{ttsProvider === "google" ? "Google" : "裝置"}語音：{activeVoiceName}
      {ttsProvider === "device" && !matchedPreferred && `（這台裝置沒有 ${tutor.preferred}，已用替代語音）`}
    </p>
  ) : null;

  if (screen === "favs") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: C.paper, color: C.ink, ...FONT }}>
        <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
          <Header title="我的收藏" />
          <main className="flex-1 overflow-y-auto px-5 py-4">
            {!favorites.length && <p className="text-sm" style={{ color: C.mute }}>還沒有收藏的文章。在朗讀畫面按 ☆ 就可以收藏。</p>}
            <div className="space-y-2">
              {favorites.map(f => (
                <button key={f.id} onClick={() => openFavorite(f)} className="w-full text-left rounded-2xl px-4 py-3" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                  <div className="flex items-center justify-between">
                    <div className="text-base font-medium">{f.title}</div>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: C.paper, color: C.mute }}>{f.langName} · {f.level}</span>
                  </div>
                  <div className="text-sm mt-0.5" style={{ color: C.mute }}>{f.title_zh}</div>
                </button>
              ))}
            </div>
          </main>
          <TabBar />
        </div>
      </div>
    );
  }

  if (screen === "board") {
    const combined = [...MOCK_FRIENDS, { name: "你", avatar: "🙂", score: myScore, isMe: true }].sort((a, b) => b.score - a.score);
    const breakdown = scoreBreakdown(stats);
    return (
      <div className="min-h-screen flex flex-col" style={{ background: C.paper, color: C.ink, ...FONT }}>
        <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
          <Header title="排行榜" />
          <main className="flex-1 overflow-y-auto px-5 py-4">
            <div className="rounded-2xl p-4 mb-4" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
              <button className="w-full flex items-center justify-between" onClick={() => setShowBreakdown(v => !v)}>
                <span className="text-sm font-medium">積分怎麼算 {showBreakdown ? "▲" : "▼"}</span>
                <span className="text-lg font-bold" style={{ color: C.gold }}>{myScore} 分</span>
              </button>
              {showBreakdown && (
                <div className="mt-3 space-y-3">
                  {breakdown.map((b, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1"><span>{b.label}</span><span style={{ color: C.mute }}>{b.value}/{b.max}</span></div>
                      <div className="h-2 rounded-full" style={{ background: C.line }}><div className="h-2 rounded-full" style={{ width: `${(b.value / b.max) * 100}%`, background: C.red }} /></div>
                      <div className="text-xs mt-0.5" style={{ color: C.mute }}>{b.detail}</div>
                    </div>
                  ))}
                  <p className="text-xs pt-1" style={{ color: C.mute }}>頻率 40% + 時長 30% + 多元性 20% + 連續天數 10%。</p>
                </div>
              )}
            </div>
            <div className="text-sm font-medium mb-2" style={{ color: C.mute }}>本週好友排行</div>
            <div className="space-y-2">
              {combined.map((f, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: f.isMe ? "#FFF3F1" : "#fff", border: `1px solid ${f.isMe ? "#F3C9C3" : C.line}` }}>
                  <div className="w-6 text-center font-bold" style={{ color: i < 3 ? C.gold : C.mute }}>{i + 1}</div>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg" style={{ background: C.paper }}>{f.avatar}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{f.name}{f.isMe && "（你）"}</div>
                    {!f.isMe && <div className="text-xs" style={{ color: C.mute }}>連續 {f.streak} 天 · {f.langs} 種語言</div>}
                  </div>
                  <div className="text-base font-bold">{f.score}</div>
                </div>
              ))}
            </div>
            <p className="text-xs mt-4" style={{ color: C.mute }}>目前是示意用的假好友清單。正式版會接你健身房會員或 LINE 社群裡「互相同意」的朋友清單。</p>
          </main>
          <TabBar />
        </div>
      </div>
    );
  }

  if (screen === "read") {
    const totalTokens = passage?.sentences.reduce((a, s) => a + s.tokens.length, 0) || 0;
    return (
      <div className="min-h-screen flex flex-col" style={{ background: C.paper, color: C.ink, ...FONT }}>
        <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
          <Header title={`${tutor.name} · ${lang.name} · ${level}`} />
          <main className="flex-1 overflow-y-auto px-6 py-6">
            {busy && !passage && <p className="text-sm" style={{ color: C.mute }}>{tutor.name} 在寫短文…</p>}
            {passage && (
              <>
                <div className="flex items-start justify-between mb-1">
                  <h2 className="text-xl font-semibold">{passage.title}</h2>
                  <button onClick={toggleFavorite} className="text-2xl leading-none px-1" style={{ color: isFavorited(passage) ? C.gold : C.line }}>{isFavorited(passage) ? "★" : "☆"}</button>
                </div>
                {showZh && <h3 className="text-sm mb-4" style={{ color: C.mute }}>{passage.title_zh}</h3>}
                <p className="text-xs mb-3" style={{ color: C.mute }}>點任何一個字，會從那裡繼續唸</p>
                <div className="space-y-5">
                  {passage.sentences.map((s, si) => {
                    let running = 0; for (let k = 0; k < si; k++) running += passage.sentences[k].tokens.length;
                    const sentDone = si < curSentence, sentActive = si === curSentence;
                    const zhChars = Array.from(s.zh || "");
                    let zhLit = 0, zhActive = -1;
                    if (sentDone) zhLit = zhChars.length;
                    else if (sentActive && s.tokens.length) {
                      const localIdx = Math.max(0, cur - running);
                      const frac = Math.min(1, localIdx / s.tokens.length);
                      zhActive = Math.min(zhChars.length - 1, Math.floor(frac * zhChars.length));
                      zhLit = zhActive;
                    }
                    return (
                      <div key={si}>
                        <p className="text-2xl leading-relaxed" style={{ letterSpacing: lang.code === "ja" ? "0.02em" : 0 }}>
                          {s.tokens.map((tk, j) => {
                            const globalIdx = running + j; const done = globalIdx < cur, now = globalIdx === cur;
                            return (
                              <span key={j} onClick={() => playFrom(globalIdx)}
                                style={{ color: now ? C.red : done ? C.ink : "#B9B4AA", fontWeight: now ? 600 : 400, transition: "color 120ms", textDecoration: now ? "underline" : "none", textDecorationColor: C.red, textUnderlineOffset: 6, cursor: "pointer", padding: "0 1px", borderRadius: 4 }}>
                                {tk}{lang.code === "ja" ? "" : " "}
                              </span>
                            );
                          })}
                        </p>
                        {showZh && (
                          <p className="text-base leading-relaxed mt-1">
                            {zhChars.map((ch, i) => (
                              <span key={i} style={{ color: i < zhLit ? C.ink : i === zhActive ? C.red : "#B9B4AA", fontWeight: i === zhActive ? 600 : 400, transition: "color 120ms" }}>{ch}</span>
                            ))}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setShowZh(v => !v)} className="mt-5 text-sm" style={{ color: C.mute }}>{showZh ? "隱藏中文" : "顯示中文"}</button>
                <div className="mt-6 flex items-center gap-3">
                  <span className="text-sm" style={{ color: C.mute }}>語速</span>
                  {SPEEDS.map(s => (
                    <button key={s.id} onClick={() => setSpeed(s.id)} className="px-3 py-1 rounded-full text-sm border" style={{ borderColor: speed === s.id ? C.ink : C.line, background: speed === s.id ? C.ink : "transparent", color: speed === s.id ? C.paper : C.ink }}>{s.label}</button>
                  ))}
                </div>
                <VoiceNote />
              </>
            )}
            {err && <div className="mt-4 text-sm" style={{ color: C.red }}>{err}</div>}
          </main>
          <div className="px-5 pb-3 pt-3 border-t flex gap-2" style={{ borderColor: C.line }}>
            <button onClick={() => genPassage("")} disabled={busy} className="flex-1 py-3 rounded-2xl text-base border" style={{ borderColor: C.ink, color: C.ink, opacity: busy ? 0.4 : 1 }}>換一篇</button>
            <button onClick={playing ? stopSpeech : startRead} disabled={!passage || busy} className="flex-1 py-3 rounded-2xl text-base font-medium" style={{ background: playing ? C.ink : C.red, color: "#fff", opacity: !passage || busy ? 0.4 : 1 }}>
              {busy && passage ? "生成語音中…" : playing ? "停止" : cur >= totalTokens && cur > 0 ? "再聽一次" : `${tutor.name} 朗讀`}
            </button>
          </div>
          <TabBar />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.paper, color: C.ink, ...FONT }}>
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
        <Header title={`${tutor.name} · ${lang.name} · ${level}`} />
        <main className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {msgs.map((m, i) => m.role === "me" ? (
            <div key={i} className="flex justify-end">
              <div className="px-4 py-3 rounded-2xl rounded-br-sm max-w-[85%] text-base leading-relaxed" style={{ background: C.ink, color: C.paper }}>{m.text}</div>
            </div>
          ) : (
            <div key={i} className="space-y-3">
              {m.corrections?.length > 0 && (
                <div className="rounded-xl px-4 py-3 space-y-3" style={{ background: "#FFF3F1", border: "1px solid #F3C9C3" }}>
                  {m.corrections.map((c, j) => (
                    <div key={j} className="text-sm leading-relaxed">
                      <div><span className="line-through" style={{ color: C.mute }}>{c.original}</span><span className="mx-2" style={{ color: C.red }}>→</span><span className="font-medium" style={{ color: C.red }}>{c.fixed}</span></div>
                      <div className="mt-1" style={{ opacity: 0.8 }}>{c.why}</div>
                    </div>
                  ))}
                </div>
              )}
              {m.praise && <div className="text-sm px-1" style={{ color: C.green }}>{m.praise}</div>}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0" style={{ background: gender === "f" ? C.red : C.ink, color: "#fff" }}>{tutor.name[0]}</div>
                <div className="flex-1">
                  <button onClick={() => speak(m.text, { force: true })} className="text-left text-lg leading-relaxed">{m.text}</button>
                  {m.zh && <div className="mt-1 text-sm" style={{ color: C.mute }}>{m.zh}</div>}
                </div>
              </div>
            </div>
          ))}
          {busy && <div className="text-sm" style={{ color: C.mute }}>{tutor.name} 在想…</div>}
          {err && <div className="text-sm px-1" style={{ color: C.red }}>{err}</div>}
          <VoiceNote />
          <div ref={endRef} />
        </main>
        <footer className="px-4 pb-3 pt-3 border-t" style={{ borderColor: C.line }}>
          <div className="flex items-end gap-2">
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder={`用 ${lang.name} 回答`} rows={1}
              className="flex-1 resize-none px-4 py-3 rounded-2xl text-base outline-none"
              style={{ background: "#fff", border: `1.5px solid ${C.line}`, color: C.ink, minHeight: 48, maxHeight: 120 }} />
            <button onClick={() => send(input)} disabled={busy || !input.trim()} className="h-12 px-4 rounded-2xl text-sm font-medium shrink-0" style={{ background: C.ink, color: C.paper, opacity: busy || !input.trim() ? 0.4 : 1 }}>送出</button>
          </div>
        </footer>
        <TabBar />
      </div>
    </div>
  );
}
