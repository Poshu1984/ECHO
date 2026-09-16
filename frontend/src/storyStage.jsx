import { inferScene, formatClock, liveSentence } from "./story.js";
import { beatsOf } from "./beats.js";
import { BeatLine } from "./karaoke.jsx";

function RainDrop({ i }) {
  const left = `${(i * 17) % 100}%`;
  const delay = `${(i * 0.13) % 1.8}s`;
  const dur = `${0.7 + (i % 5) * 0.12}s`;
  return <i className="drop" style={{ left, animationDelay: delay, animationDuration: dur }} />;
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
}) {
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
  return (
    <div className={`story-stage is-${scene} ${playing ? "is-live" : ""} ${preview ? "is-preview" : ""}`}>
      <button type="button" className="story-hit" onClick={onToggle} aria-label={playing ? pauseLabel : playLabel} />
      <div className="story-fx" aria-hidden="true">
        {scene === "rain" && (
          <>
            <div className="bokeh b1" />
            <div className="bokeh b2" />
            <div className="bokeh b3" />
            <div className="car-cabin">
              <div className="dash" />
              <div className="wheel" />
              <div className="rider r-left" />
              <div className="rider r-right" />
            </div>
            <div className="rain-sheet">
              {Array.from({ length: 18 }, (_, i) => <RainDrop key={i} i={i} />)}
            </div>
          </>
        )}
        {scene === "cafe" && (
          <>
            <div className="cafe-window" />
            <div className="steam s1" />
            <div className="steam s2" />
            <div className="cup" />
            <div className="lamp" />
          </>
        )}
        {scene === "commute" && (
          <>
            <div className="window-pass p1" />
            <div className="window-pass p2" />
            <div className="window-pass p3" />
            <div className="seat" />
          </>
        )}
        {scene === "market" && (
          <>
            <div className="stall st1" />
            <div className="stall st2" />
            <div className="stall st3" />
            <div className="awning" />
          </>
        )}
        {scene === "office" && (
          <>
            <div className="blinds" />
            <div className="monitor" />
            <div className="cursor-blink" />
          </>
        )}
        {scene === "night" && (
          <>
            <div className="corridor" />
            <div className="flicker" />
            <div className="door" />
          </>
        )}
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
      <span className={`story-play ${playing ? "is-pause" : ""}`} />
    </div>
  );
}
