import { inferScene, formatClock } from "./story.js";

function RainDrop({ i }) {
  const left = `${(i * 17) % 100}%`;
  const delay = `${(i * 0.13) % 1.8}s`;
  const dur = `${0.7 + (i % 5) * 0.12}s`;
  return <i className="drop" style={{ left, animationDelay: delay, animationDuration: dur }} />;
}

export function StoryStage({ passage, playing, preview = false, current = 0, duration = 0, onToggle, playLabel, pauseLabel }) {
  const scene = inferScene(passage);
  const hook = passage?.hook_zh || passage?.title_zh || passage?.title || "";
  const clock = playing ? formatClock(current) : formatClock(duration);
  return (
    <button type="button" className={`story-stage is-${scene} ${playing ? "is-live" : ""} ${preview ? "is-preview" : ""}`} onClick={onToggle} aria-label={playing ? pauseLabel : playLabel}>
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
      <span className="story-clock">{clock}</span>
      <span className={`story-play ${playing ? "is-pause" : ""}`} />
    </button>
  );
}
