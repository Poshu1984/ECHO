import { useEffect, useRef, useState } from "react";
import { nativeProgress } from "./beats.js";

export function useBeatAudio() {
  const audioRef = useRef(null);
  const timesRef = useRef([]);
  const rafRef = useRef(0);
  const loopRef = useRef(null);
  const onLoopRef = useRef(null);
  const [active, setActive] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoopState] = useState(null);

  function stopRaf() {
    cancelAnimationFrame(rafRef.current);
  }

  function pump() {
    const a = audioRef.current;
    const times = timesRef.current;
    if (!a || !times.length) return;
    const t = a.currentTime;
    const range = loopRef.current;
    if (range && times[range[0]] && times[range[1]]) {
      if (t >= times[range[1]].end - 0.04) {
        a.currentTime = times[range[0]].start;
        onLoopRef.current?.();
      }
    } else if (times[times.length - 1] && t >= times[times.length - 1].end - 0.02) {
      a.ended = true;
      a.paused = true;
      setPlaying(false);
      setActive(-1);
      return;
    }
    let i = times.findIndex((x) => t < x.end - 0.001);
    if (i < 0) i = times.length - 1;
    setActive(i);
    if (!a.paused && !a.ended) rafRef.current = requestAnimationFrame(pump);
    else setPlaying(false);
  }

  function attach(audio, times) {
    stopRaf();
    if (audioRef.current && audioRef.current !== audio) {
      try { audioRef.current.pause(); } catch { /* ignore */ }
    }
    audioRef.current = audio;
    timesRef.current = times;
    audio.onended = () => {
      if (loopRef.current && timesRef.current[loopRef.current[0]]) {
        playFrom(loopRef.current[0]);
        onLoopRef.current?.();
        return;
      }
      setPlaying(false);
      setActive(-1);
    };
  }

  function attachClock(times) {
    let origin = performance.now();
    const last = times[times.length - 1]?.end || 0;
    const fake = {
      get currentTime() {
        return Math.min(last + 0.08, (performance.now() - origin) / 1000);
      },
      set currentTime(v) {
        origin = performance.now() - Math.max(0, v) * 1000;
      },
      paused: true,
      ended: false,
      pause() {
        this.paused = true;
        try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
      },
      play() {
        this.paused = false;
        this.ended = false;
        return Promise.resolve();
      },
    };
    attach(fake, times);
    return fake;
  }

  async function playFrom(i = 0) {
    const a = audioRef.current;
    const times = timesRef.current;
    if (!a || !times[i]) return;
    a.ended = false;
    a.currentTime = Math.max(0, times[i].start);
    setPlaying(true);
    setActive(i);
    try {
      await a.play();
    } catch {
      setPlaying(false);
      throw new Error("PLAY_BLOCKED");
    }
    stopRaf();
    rafRef.current = requestAnimationFrame(pump);
  }

  function stop() {
    stopRaf();
    audioRef.current?.pause();
    setPlaying(false);
    setActive(-1);
  }

  function setLoop(range, onLoop) {
    loopRef.current = range;
    onLoopRef.current = onLoop || null;
    setLoopState(range);
  }

  useEffect(() => () => stopRaf(), []);

  return { active, playing, loop, attach, attachClock, playFrom, stop, setLoop, audioRef, timesRef };
}

export function BeatLine({ tokens, joiner = " ", active, onToken, native, nativeRatio, fromHere, className = "", variant = "karaoke" }) {
  const { lit, rest } = nativeProgress(native, nativeRatio);
  return (
    <div className={`beat-block is-${variant} ${className}`.trim()}>
      <p className="beat-line">
        {tokens.map((tok, i) => (
          <span key={i}>
            <button
              type="button"
              title={fromHere || undefined}
              className={`beat ${i === active ? "on" : i < active && active >= 0 ? "done" : ""}`}
              onClick={() => onToken?.(i)}
            >
              {tok}
            </button>
            {joiner && i < tokens.length - 1 ? joiner : null}
          </span>
        ))}
      </p>
      {native ? (
        <p className="beat-native">
          <span className="zh-lit">{lit}</span>
          <span className="zh-rest">{rest}</span>
        </p>
      ) : null}
    </div>
  );
}
