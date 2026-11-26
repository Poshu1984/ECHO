import { useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { LEARN_LANGS, TUTORS, previewPassage } from "./content.js";
import { armAudio, cachedVoices, createCloudAudio, pickGoogleVoice } from "./tts.js";
import { chirpVoiceFor, monthlyCostLine, sampleRequest, sampleText } from "./voiceLab.js";

function friendlyError(e) {
  if (e?.status === 429) return "這個月的語音額度用完了。";
  if (e?.status === 401) return "登入已過期，請重新登入。";
  if (e?.message === "NO_VOICE") return "這個語言找不到可用的聲音。";
  if (e?.name === "NotAllowedError") return "瀏覽器擋住了自動播放，請再按一次。";
  return "現在無法播放，請稍後再試。";
}

// Admin-only A/B listening panel: compares the previous voice with Chirp 3: HD
// (which learners use since the owner's 2026-11-26 decision).
export function VoiceLab({ tutor: appTutor, lang: appLang, speakRate = 1 }) {
  const [langCode, setLangCode] = useState(appLang.code);
  const [tutorId, setTutorId] = useState(appTutor.id);
  const [sampleId, setSampleId] = useState("story");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [blind, setBlind] = useState(false);
  const [flip, setFlip] = useState(false);
  const [picked, setPicked] = useState("");
  const audioRef = useRef(null);

  const lang = LEARN_LANGS.find((l) => l.code === langCode) || appLang;
  const tutor = TUTORS.find((t) => t.id === tutorId) || appTutor;
  const text = sampleText(previewPassage(lang.code), sampleId, lang.code);
  const chirpName = chirpVoiceFor(tutor, lang.speech);
  const order = blind && flip ? ["chirp", "current"] : ["current", "chirp"];

  useEffect(() => () => {
    try { audioRef.current?.pause(); } catch { /* ignore */ }
  }, []);

  function stop() {
    try { audioRef.current?.pause(); } catch { /* ignore */ }
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  }

  async function play(kind) {
    armAudio();
    stop();
    setNote("");
    setBusy(kind);
    try {
      let name = chirpName;
      if (kind === "current") {
        const voices = await cachedVoices(lang.speech, (code) => api.voices(code));
        name = pickGoogleVoice(voices, tutor, lang.speech)?.name;
      }
      if (!name) throw new Error("NO_VOICE");
      const data = await api.synthesize(sampleRequest(text, name, lang.speech, sampleId === "line" ? 0.8 : speakRate));
      if (!data.audioContent) throw new Error("NO_AUDIO");
      const audio = createCloudAudio(data.audioContent);
      audioRef.current = audio;
      await audio.play();
    } catch (e) {
      setNote(friendlyError(e));
    } finally {
      setBusy("");
    }
  }

  function label(kind, i) {
    if (blind && !picked) return `聲音 ${i + 1}`;
    return kind === "current" ? "舊聲音" : "Chirp 3 HD";
  }

  function startBlind(on) {
    setBlind(on);
    setPicked("");
    setFlip(Math.random() < 0.5);
  }

  return (
    <div className="voice-lab">
      <h3 className="display text-sm">語音 A/B 試聽（僅管理員）</h3>
      <p className="text-xs text-[var(--mute)] mt-1">只有您看得到。學員目前聽到的是 Chirp 3 HD（中文維持台灣口音聲音）；這裡可以和舊聲音對照。</p>
      <div className="voice-lab-row">
        <label className="text-sm">語言
          <select className="field mt-1" value={langCode} onChange={(e) => { setLangCode(e.target.value); setPicked(""); }}>
            {LEARN_LANGS.map((l) => <option key={l.code} value={l.code}>{l.zh}</option>)}
          </select>
        </label>
        <label className="text-sm">家教
          <select className="field mt-1" value={tutorId} onChange={(e) => { setTutorId(e.target.value); setPicked(""); }}>
            {TUTORS.map((t) => <option key={t.id} value={t.id}>{t.name}（{t.gender === "f" ? "女" : "男"}）</option>)}
          </select>
        </label>
      </div>
      <label className="text-sm block mt-2">試聽內容
        <select className="field mt-1" value={sampleId} onChange={(e) => { setSampleId(e.target.value); setPicked(""); }}>
          <option value="story">故事旁白（兩句）</option>
          <option value="line">單句慢讀（適合孩子）</option>
        </select>
      </label>
      <p className="text-sm mt-2">「{text}」</p>
      {!chirpName ? (
        <small>Google 沒有台灣口音的 Chirp 3 HD，中文會維持目前的台灣口音聲音。</small>
      ) : (
        <>
          <div className="voice-lab-row">
            {order.map((kind, i) => (
              <button key={kind} type="button" className="btn btn-line" disabled={Boolean(busy)} onClick={() => play(kind)}>
                {busy === kind ? "…" : `▶ ${label(kind, i)}`}
              </button>
            ))}
          </div>
          <label className="text-sm flex items-center gap-2 mt-2">
            <input type="checkbox" checked={blind} onChange={(e) => startBlind(e.target.checked)} />
            盲測：不告訴您哪個是哪個，聽完先選喜歡的
          </label>
          {blind && !picked && (
            <div className="voice-lab-row">
              {order.map((kind, i) => (
                <button key={kind} type="button" className="btn btn-ghost text-sm" onClick={() => setPicked(kind)}>我比較喜歡 {i + 1}</button>
              ))}
            </div>
          )}
          {blind && picked && (
            <p className="notice is-ok mt-2">您選的是「{picked === "chirp" ? "Chirp 3 HD" : "舊聲音"}」。</p>
          )}
          <small>{monthlyCostLine()}</small>
          <small>切換的取捨：Chirp 3 HD 聲音更自然，但 Google 不提供逐字時間點，字幕逐字變色會改用估算，可能和聲音差一點點。</small>
        </>
      )}
      {note && <p className="notice mt-2">{note}</p>}
    </div>
  );
}
