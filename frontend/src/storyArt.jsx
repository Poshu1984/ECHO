import { useId } from "react";
import { MASCOTS } from "./brandMascots.js";
import { partnerFor } from "./storyDirector.js";

// Original vector artwork for the story stage. Everything is inline SVG so
// it works offline, costs nothing per story and scales to any screen.
// The Lingostep mascots act out the scene: Koto (A) with the language
// partner (B): Pip for English, Nami for Japanese.

function Rainy() {
  return (
    <g className="fx-rain">
      {Array.from({ length: 18 }, (_, i) => (
        <line
          key={i}
          x1={(i * 71) % 640}
          y1={-20}
          x2={(i * 71) % 640 - 10}
          y2={14}
          style={{ animationDelay: `${(i * 0.17) % 1.4}s`, animationDuration: `${0.8 + (i % 4) * 0.15}s` }}
        />
      ))}
    </g>
  );
}

function Lamp({ x, y, color = "#ffd58a" }) {
  return (
    <g className="fx-sway" style={{ transformOrigin: `${x}px ${y - 40}px` }}>
      <line x1={x} y1={y - 40} x2={x} y2={y} stroke="#3b2f27" strokeWidth="2" />
      <path d={`M${x - 16} ${y + 14} L${x - 8} ${y} L${x + 8} ${y} L${x + 16} ${y + 14} Z`} fill="#3b2f27" />
      <ellipse cx={x} cy={y + 30} rx="46" ry="26" fill={color} opacity="0.18" className="fx-glow" />
    </g>
  );
}

const BOKEH = ["#ff9d5c", "#7fb2ff", "#ffd27a", "#ff7a7a", "#9fe0c0"];

function SceneRain({ uid }) {
  return (
    <g>
      <rect width="640" height="360" fill={`url(#${uid}rain)`} />
      {[[80, 120], [190, 90], [330, 130], [470, 100], [580, 140]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={34 + (i % 3) * 10} fill={`url(#${uid}bk${i})`} className="fx-twinkle" style={{ animationDelay: `${i * 0.6}s` }} />
      ))}
      <rect x="0" y="210" width="640" height="150" fill="#14161f" />
    </g>
  );
}

// Drawn in front of the characters: glass, rain, wipers and dashboard.
function RainFront() {
  return (
    <g>
      <Rainy />
      <g className="fx-wiper-l"><line x1="150" y1="252" x2="40" y2="120" stroke="#090a0f" strokeWidth="6" strokeLinecap="round" /></g>
      <g className="fx-wiper-r"><line x1="470" y1="252" x2="360" y2="120" stroke="#090a0f" strokeWidth="6" strokeLinecap="round" /></g>
      <path d="M0 0 H640 V360 H0 Z M40 30 Q320 6 600 30 L620 250 Q320 272 20 250 Z" fill="#0b0c12" fillRule="evenodd" />
      <path d="M40 30 Q320 6 600 30 L620 250 Q320 272 20 250 Z" fill="none" stroke="#2a2d3a" strokeWidth="6" />
      <rect x="0" y="262" width="640" height="98" fill="#1d1f29" />
      <rect x="250" y="276" width="140" height="28" rx="8" fill="#2c303d" />
      <circle cx="320" cy="290" r="5" fill="#7fe3b0" className="fx-twinkle" />
    </g>
  );
}

function SceneCafe() {
  return (
    <g>
      <rect width="640" height="360" fill="#e9c9a2" />
      <rect x="0" y="0" width="640" height="18" fill="#c98f5f" />
      <rect x="380" y="50" width="220" height="150" rx="10" fill="#9fd0e8" />
      <rect x="380" y="50" width="220" height="150" rx="10" fill="none" stroke="#7a4a2e" strokeWidth="8" />
      <line x1="490" y1="50" x2="490" y2="200" stroke="#7a4a2e" strokeWidth="6" />
      <g className="fx-drift">
        <rect x="400" y="140" width="40" height="60" fill="#cfe7f2" />
        <rect x="450" y="120" width="30" height="80" fill="#b8dcec" />
        <rect x="520" y="130" width="50" height="70" fill="#cfe7f2" />
      </g>
      <rect x="40" y="92" width="170" height="80" rx="8" fill="#5b3a29" />
      <text x="125" y="122" textAnchor="middle" fill="#f6e6cf" fontSize="16" fontFamily="Sora, sans-serif">MENU</text>
      <rect x="60" y="136" width="80" height="6" rx="3" fill="#f6e6cf" opacity="0.6" />
      <rect x="60" y="150" width="110" height="6" rx="3" fill="#f6e6cf" opacity="0.6" />
      <Lamp x={170} y={40} />
      <Lamp x={470} y={30} />
      <rect x="0" y="262" width="640" height="98" fill="#a8693f" />
      <rect x="0" y="254" width="640" height="14" fill="#8a5232" />
      <g>
        <rect x="300" y="226" width="30" height="30" rx="5" fill="#fff6ea" />
        <path d="M330 234 q12 4 0 14" stroke="#fff6ea" strokeWidth="4" fill="none" />
        <path className="fx-steam" d="M310 220 q-8 -14 0 -26 q8 -12 0 -24" stroke="#fff" strokeWidth="3" fill="none" opacity="0.7" />
        <path className="fx-steam s2" d="M320 220 q8 -14 0 -26 q-8 -12 0 -24" stroke="#fff" strokeWidth="3" fill="none" opacity="0.6" />
      </g>
    </g>
  );
}

function SceneCommute({ uid }) {
  return (
    <g>
      <rect width="640" height="360" fill="#d8dee6" />
      {[30, 230, 430].map((x) => (
        <g key={x}>
          <rect x={x} y="40" width="180" height="120" rx="14" fill="#7ec3e6" />
          <g clipPath={`url(#${uid}win${x})`}>
            <g className="fx-passby">
              {Array.from({ length: 8 }, (_, i) => (
                <rect key={i} x={x - 60 + i * 60} y={70 + ((i * 37) % 40)} width="42" height={120} fill={i % 2 ? "#5d7d96" : "#45657e"} />
              ))}
            </g>
          </g>
          <clipPath id={`${uid}win${x}`}><rect x={x} y="40" width="180" height="120" rx="14" /></clipPath>
          <rect x={x} y="40" width="180" height="120" rx="14" fill="none" stroke="#9aa6b3" strokeWidth="8" />
        </g>
      ))}
      <rect x="0" y="12" width="640" height="8" fill="#9aa6b3" />
      {[120, 320, 520].map((x, i) => (
        <g key={x} className="fx-sway" style={{ transformOrigin: `${x}px 20px`, animationDelay: `${i * 0.3}s` }}>
          <line x1={x} y1="20" x2={x} y2="44" stroke="#6b7682" strokeWidth="3" />
          <circle cx={x} cy="54" r="10" fill="none" stroke="#f08a3c" strokeWidth="4" />
        </g>
      ))}
      <rect x="0" y="250" width="640" height="110" fill="#5b6672" />
      <rect x="0" y="244" width="640" height="12" fill="#f08a3c" />
    </g>
  );
}

function SceneMarket({ uid }) {
  const fruit = ["#f6a623", "#e94e3c", "#7cb342", "#ffcf3f", "#f07c2a"];
  return (
    <g>
      <rect width="640" height="360" fill={`url(#${uid}market)`} />
      <circle cx="560" cy="60" r="30" fill="#fff3c4" className="fx-twinkle" />
      <g className="fx-sway-soft">
        <path d="M0 40 Q160 70 320 40 Q480 70 640 40" stroke="#7a4a2e" strokeWidth="2" fill="none" />
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d={`M${20 + i * 52} ${48 + Math.sin(i) * 6} l12 22 l12 -22 z`} fill={fruit[i % fruit.length]} />
        ))}
      </g>
      {[[20, "#e94e3c"], [230, "#556b3d"], [440, "#f08a3c"]].map(([x, c], i) => (
        <g key={x}>
          <rect x={x + 10} y="130" width="160" height="120" fill="#c98f5f" />
          <g className="fx-awning" style={{ transformOrigin: `${x + 90}px 110px`, animationDelay: `${i * 0.4}s` }}>
            {Array.from({ length: 6 }, (_, j) => (
              <rect key={j} x={x + j * 30} y="100" width="30" height="34" fill={j % 2 ? "#fff6ea" : c} />
            ))}
            <path d={`M${x} 134 ${Array.from({ length: 6 }, () => "q15 14 30 0").join(" ")}`} fill={c} />
          </g>
          {Array.from({ length: 9 }, (_, j) => (
            <circle key={j} cx={x + 34 + (j % 5) * 28 + (j > 4 ? 14 : 0)} cy={j > 4 ? 200 : 218} r="12" fill={fruit[(j + i) % fruit.length]} />
          ))}
        </g>
      ))}
      <rect x="0" y="250" width="640" height="110" fill="#d9b98a" />
    </g>
  );
}

function SceneOffice() {
  return (
    <g>
      <rect width="640" height="360" fill="#eae6df" />
      <rect x="40" y="40" width="250" height="160" fill="#b9d7ea" />
      <g className="fx-drift">
        <rect x="60" y="110" width="40" height="90" fill="#8fb3cb" />
        <rect x="110" y="80" width="50" height="120" fill="#7aa0ba" />
        <rect x="175" y="120" width="45" height="80" fill="#8fb3cb" />
        <rect x="230" y="95" width="40" height="105" fill="#7aa0ba" />
      </g>
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x="40" y={44 + i * 18} width="250" height="7" fill="#f4f1ec" opacity="0.85" />
      ))}
      <circle cx="500" cy="70" r="30" fill="#fff" stroke="#556b3d" strokeWidth="5" />
      <line x1="500" y1="70" x2="500" y2="50" stroke="#2e2c28" strokeWidth="3" className="fx-clock-m" style={{ transformOrigin: "500px 70px" }} />
      <line x1="500" y1="70" x2="514" y2="70" stroke="#2e2c28" strokeWidth="4" />
      <path d="M580 250 q-10 -60 6 -90 q8 40 -6 90 z M590 250 q20 -50 40 -60 q-10 40 -40 60 z" fill="#6f9a4a" className="fx-sway-soft" />
      <rect x="0" y="250" width="640" height="110" fill="#8a7f72" />
      <rect x="250" y="160" width="140" height="90" rx="8" fill="#2e2c28" />
      <rect x="258" y="168" width="124" height="70" rx="4" fill="#3d5a73" />
      <rect x="268" y="180" width="60" height="6" fill="#f4f1ec" opacity="0.8" />
      <rect x="268" y="194" width="90" height="6" fill="#f4f1ec" opacity="0.6" />
      <rect x="268" y="208" width="4" height="10" fill="#f08a3c" className="fx-blink" />
      <rect x="310" y="250" width="20" height="10" fill="#2e2c28" />
    </g>
  );
}

function SceneNight({ uid }) {
  return (
    <g>
      <rect width="640" height="360" fill={`url(#${uid}night)`} />
      {Array.from({ length: 22 }, (_, i) => (
        <circle key={i} cx={(i * 97) % 640} cy={(i * 41) % 140} r={i % 3 ? 1.4 : 2.2} fill="#fff" className="fx-twinkle" style={{ animationDelay: `${(i % 7) * 0.4}s` }} />
      ))}
      <circle cx="90" cy="70" r="26" fill="#fff6d8" />
      <circle cx="102" cy="62" r="24" fill="#1c2240" />
      {[[180, 120, 80], [280, 90, 70], [370, 140, 90], [480, 100, 80]].map(([x, h, w], i) => (
        <g key={x}>
          <rect x={x} y={250 - h} width={w} height={h} fill="#262c4a" />
          {Array.from({ length: 6 }, (_, j) => (
            <rect key={j} x={x + 10 + (j % 3) * 22} y={250 - h + 14 + Math.floor(j / 3) * 26} width="12" height="14" fill="#ffd27a" opacity={(i + j) % 3 ? 0.85 : 0.15} className={(i + j) % 4 === 0 ? "fx-flicker" : ""} />
          ))}
        </g>
      ))}
      <rect x="0" y="250" width="640" height="110" fill="#2a2d3a" />
      <g>
        <line x1="560" y1="250" x2="560" y2="150" stroke="#14161f" strokeWidth="6" />
        <circle cx="560" cy="146" r="9" fill="#ffe5a8" className="fx-flicker" />
        <ellipse cx="560" cy="250" rx="70" ry="14" fill="#ffe5a8" opacity="0.18" className="fx-flicker" />
      </g>
    </g>
  );
}

const SCENES = {
  rain: SceneRain,
  cafe: SceneCafe,
  commute: SceneCommute,
  market: SceneMarket,
  office: SceneOffice,
  night: SceneNight,
};

// CI v2 looks: hello (start), focus (prepare / correct), celebrate (a round
// is finished). Questions use focus; exclamations keep the hello face with
// a round open mouth, so "celebrate" stays reserved for finishing a round.
const LOOK_BY_MOOD = { neutral: "hello", curious: "focus", surprised: "hello" };

function Shape({ tag, attrs }) {
  const Tag = tag;
  return <Tag {...attrs} />;
}

// Lingostep CI v2 characters: Koto (lead), Pip (English), Nami (Japanese).
// Shapes come from the brand SVGs; eyes blink and the mouth opens in time
// with the highlighted word while the character is talking.
export function Mascot({ id = "koto", x, y, talking = false, open = false, mood = "neutral", focus = false, scale = 0.55, flip = false }) {
  const data = MASCOTS[id] || MASCOTS.koto;
  const look = data.looks[(talking || focus) ? (LOOK_BY_MOOD[mood] || "hello") : "hello"];
  const [mx, my] = look.mouthCenter;
  const sx = flip ? -scale : scale;
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} ${scale}) translate(-120 -270)`}>
      <g className={`char ${talking ? "is-talking" : ""} ${focus ? "is-focus" : ""}`}>
        <ellipse cx="120" cy="252" rx="78" ry="10" fill="#000" opacity="0.14" />
        {look.body.map((shape, i) => <Shape key={`b${i}`} {...shape} />)}
        <g className="char-eyes">
          {look.eyes.map((shape, i) => <Shape key={`e${i}`} {...shape} />)}
        </g>
        {open ? (
          <ellipse cx={mx} cy={my + 2} rx="9" ry="8" fill={data.faceColor} />
        ) : (mood === "surprised" && (talking || focus)) ? (
          <ellipse cx={mx} cy={my + 1} rx="6" ry="7" fill={data.faceColor} />
        ) : (
          <Shape {...look.mouth} />
        )}
      </g>
    </g>
  );
}

export function StoryArt({ scene = "cafe", speaker = "narrator", focus = null, mood = "neutral", open = false, langCode = "en" }) {
  const uid = `s${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const Scene = SCENES[scene] || SceneCafe;
  const seated = scene === "rain";
  const props = (who) => ({
    id: who === "a" ? "koto" : partnerFor(langCode),
    x: who === "a" ? (seated ? 220 : 200) : (seated ? 420 : 450),
    y: seated ? 266 : 272,
    flip: who === "b",
    talking: speaker === who,
    open: speaker === who && open,
    focus: focus === who,
    mood,
    scale: seated ? 0.56 : 0.66,
  });
  return (
    <svg className={`story-art ${scene === "rain" || scene === "night" ? "is-dark" : ""}`} viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${uid}rain`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2440" />
          <stop offset="1" stopColor="#3a2c3e" />
        </linearGradient>
        <linearGradient id={`${uid}market`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd9a0" />
          <stop offset="1" stopColor="#ffb889" />
        </linearGradient>
        <linearGradient id={`${uid}night`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f1430" />
          <stop offset="1" stopColor="#2b2f5c" />
        </linearGradient>
        {BOKEH.map((c, i) => (
          <radialGradient key={c} id={`${uid}bk${i}`}>
            <stop offset="0" stopColor={c} stopOpacity="0.55" />
            <stop offset="1" stopColor={c} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      <Scene uid={uid} />
      <Mascot {...props("a")} />
      <Mascot {...props("b")} />
      {seated ? <RainFront /> : null}
    </svg>
  );
}
