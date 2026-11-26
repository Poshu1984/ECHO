import { inferScene, formatClock, liveSentence } from "./story.js";
import { beatsOf } from "./beats.js";
import { BeatLine } from "./karaoke.jsx";
import { StoryArt } from "./storyArt.jsx";
import { useEffect, useMemo, useState } from "react";
import { directStory, mouthOpen, progressOf } from "./storyDirector.js";

function useReducedMotion() {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState(() => (
    typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false
  ));
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

export function StoryStage({
  passage,
  playing,
  preview = false,
  current = 0,
  duration = 0,
  highlight = -1,
  joiner = " ",
  langCode = "en",
  showNative = true,
  onToggle,
  onToken,
  playLabel,
  pauseLabel,
  theaterLabel = "全螢幕",
  exitTheaterLabel = "離開全螢幕",
}) {
  const [theater, setTheater] = useState(false);
  const reduced = useReducedMotion();
  const plan = useMemo(() => directStory(passage), [passage]);
  useEffect(() => {
    if (!theater) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setTheater(false); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [theater]);
  const scene = inferScene(passage);
  const hook = passage?.hook_zh || passage?.title_zh || passage?.title || "";
  const clock = playing ? formatClock(current) : formatClock(duration);
  const live = liveSentence(passage, highlight, langCode);
  const sentence = live?.sentence;
  const tokens = live?.tokens || [];
  let local = -1;
  if (playing && highlight >= 0 && live) {
    let offset = 0;
    for (let i = 0; i < live.index; i += 1) {
      const s = passage.sentences[i];
      offset += (s.tokens?.length ? s.tokens : beatsOf(s.text || "", langCode)).length;
    }
    local = highlight - offset;
  }
  const lineIndex = live?.index || 0;
  const cue = plan[lineIndex] || { speaker: "narrator", focus: null, shot: "wide", mood: "neutral" };
  const engaged = playing || highlight >= 0;
  const shot = engaged && !reduced ? cue.shot : "wide";
  const speaker = playing ? cue.speaker : "narrator";
  const progress = highlight >= 0 ? progressOf(current, duration) : 0;
  const close = shot !== "wide";
  return (
    <div className={`story-stage is-${scene} ${playing ? "is-live" : ""} ${preview ? "is-preview" : ""} ${theater ? "is-theater" : ""} ${close ? "is-close" : ""}`}>
      <button type="button" className="story-hit" onClick={onToggle} aria-label={playing ? pauseLabel : playLabel} />
      <div className="story-fx" aria-hidden="true">
        <div className={`story-cam shot-${shot}`}>
          <StoryArt
            scene={scene}
            speaker={speaker}
            focus={engaged ? cue.focus : null}
            mood={engaged ? cue.mood : "neutral"}
            open={mouthOpen(playing, local)}
            langCode={langCode}
          />
        </div>
        <span className={`story-play ${playing ? "is-pause" : ""}`} />
      </div>
      <div className="story-scrim" />
      {hook ? <p className="story-hook">{hook}</p> : null}
      {tokens.length ? (
        <div className="story-caption" onClick={(e) => e.stopPropagation()}>
          <BeatLine
            variant="story"
            tokens={tokens}
            joiner={joiner}
            active={local}
            native={showNative ? (sentence?.zh || "") : ""}
            nativeRatio={local >= 0 ? Math.min(1, (local + 1) / tokens.length) : (playing ? 0 : 0)}
            onToken={onToken ? (tok) => onToken(live?.index || 0, tok) : undefined}
          />
        </div>
      ) : null}
      <span className="story-clock">{clock}</span>
      <div className="story-progress" aria-hidden="true"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div>
      <button
        type="button"
        className="story-theater"
        onClick={(e) => { e.stopPropagation(); setTheater((v) => !v); }}
        aria-label={theater ? exitTheaterLabel : theaterLabel}
        aria-pressed={theater}
      >
        {theater ? "✕" : "⛶"}
      </button>
    </div>
  );
}
