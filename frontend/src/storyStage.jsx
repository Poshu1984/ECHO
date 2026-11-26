import { inferScene, formatClock, liveSentence } from "./story.js";
import { beatsOf } from "./beats.js";
import { BeatLine } from "./karaoke.jsx";
import { StoryArt } from "./storyArt.jsx";
import { mouthOpen, progressOf, shotFor, speakerFor } from "./storyDirector.js";

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
  const lineIndex = live?.index || 0;
  const shot = playing || highlight >= 0 ? shotFor(lineIndex, sentence) : "wide";
  const speaker = playing ? speakerFor(lineIndex, sentence) : "narrator";
  const progress = progressOf(current, duration);
  return (
    <div className={`story-stage is-${scene} ${playing ? "is-live" : ""} ${preview ? "is-preview" : ""}`}>
      <button type="button" className="story-hit" onClick={onToggle} aria-label={playing ? pauseLabel : playLabel} />
      <div className="story-fx" aria-hidden="true">
        <div className={`story-cam shot-${shot}`}>
          <StoryArt scene={scene} speaker={speaker} open={mouthOpen(playing, local)} />
        </div>
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
      <div className="story-progress" aria-hidden="true"><i style={{ width: `${Math.round((playing ? progress : 0) * 100)}%` }} /></div>
      <span className={`story-play ${playing ? "is-pause" : ""}`} />
    </div>
  );
}
