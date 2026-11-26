import { useMemo, useRef, useState } from "react";
import { api } from "./api.js";
import { previewPassage } from "./content.js";
import { cachedVoices, createCloudAudio, pickGoogleVoice } from "./tts.js";
import { CHIRP_PRICE_PER_M, NEURAL2_PRICE_PER_M, WAVENET_PRICE_PER_M, chirpVoiceFor, sampleRequest } from "./voiceLab.js";

// Admin-only A/B listening panel. It never changes the voice learners get;
// it only lets the owner compare the current voice with Chirp 3: HD.
export function VoiceLab({ tutor, lang, speakRate = 1 }) {
  const passage = previewPassage(lang.code);
  const text = (passage?.sentences || []).slice(0, 2).map((s) => s.text).join(lang.code === "zh" || lang.code === "ja" ? "" : " ");
  const chirpName = chirpVoiceFor(tutor, lang.speech);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [blind, setBlind] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [seed, setSeed] = useState(0);
  const audioRef = useRef(null);

  const order = useMemo(() => {
    const pair = ["current", "chirp"];
    return blind && (seed + text.length) % 2 === 1 ? pair.reverse() : pair;
  }, [blind, seed, text.length]);

  async function play(kind) {
    setNote("");
    setBusy(kind);
    try {
      try { audioRef.current?.pause(); } catch { /* ignore */ }
      let name = chirpName;
      if (kind === "current") {
        const voices = await cachedVoices(lang.speech, (code) => api.voices(code));
        name = pickGoogleVoice(voices, tutor, lang.speech)?.name;
      }
      if (!name) throw new Error("NO_VOICE");
      const data = await api.synthesize(sampleRequest(text, name, lang.speech, speakRate));
      if (!data.audioContent) throw new Error("NO_AUDIO");
      const audio = createCloudAudio(data.audioContent);
      audioRef.current = audio;
      await audio.play();
    } catch (e) {
      setNote(e.status === 401 || e.status === 403 ? "需要管理員登入。" : `無法播放：${e.message || "錯誤"}`);
    } finally {
      setBusy("");
    }
  }

  function label(kind, i) {
    if (blind && !revealed) return `聲音 ${i + 1}`;
    return kind === "current" ? "目前聲音" : "Chirp 3 HD";
  }

  return (
    <div className="voice-lab">
      <h3 className="display text-sm">語音 A/B 試聽（僅管理員）</h3>
      <p className="text-sm mt-1">{tutor.name} · {lang.name}：「{text}」</p>
      {!chirpName ? (
        <small>這個語言 Google 沒有提供 Chirp 3 HD（台灣中文），維持目前的台灣口音聲音。</small>
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
            <input type="checkbox" checked={blind} onChange={(e) => { setBlind(e.target.checked); setRevealed(false); setSeed((n) => n + 1); }} />
            盲測（隨機順序，聽完再揭曉）
          </label>
          {blind && !revealed && (
            <button type="button" className="btn btn-ghost text-sm mt-1" onClick={() => setRevealed(true)}>揭曉哪個是哪個</button>
          )}
          <small>
            這段約 {text.length} 字。每 100 萬字價格：目前聲音（WaveNet／Neural2）約 US${WAVENET_PRICE_PER_M}–{NEURAL2_PRICE_PER_M}、Chirp 3 HD 約 US${CHIRP_PRICE_PER_M}（Neural2 與 Chirp 3 HD 每月前 100 萬字免費，WaveNet 前 400 萬字免費）。
            試聽不會改變學員聽到的聲音；要不要切換由老闆決定。
          </small>
        </>
      )}
      {note && <p className="notice mt-2">{note}</p>}
    </div>
  );
}
