"""Draws the new language partners in the CI v2 style (same baseline, limb
weight, feet and face sizes as Koto / Pip / Nami) and writes
public/brand/mascots/<id>-<look>.svg. Run from frontend/."""
import math

FEET = ('<path d="M 55 238 Q 55 217 77 217 L 89 217 Q 108 217 108 237 Q 108 247 98 247 L 65 247 Q 55 247 55 238 Z" fill="{c}"/>'
        '<path d="M 137 238 Q 137 217 155 217 L 167 217 Q 190 217 190 238 Q 190 247 181 247 L 146 247 Q 137 247 137 238 Z" fill="{c}"/>')

def limbs(c, legs, arms, hands):
    s = f'<path d="{arms}" fill="none" stroke="{c}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>'
    s += f'<path d="{legs}" fill="none" stroke="{c}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>'
    s += FEET.format(c=c)
    for (x, y) in hands:
        s += f'<ellipse cx="{x}" cy="{y}" rx="12" ry="12" fill="{c}"/>'
    return s

def face(look, ex1, ex2, ey, mx, my, fc, body):
    if look == "hello":
        return (f'<ellipse cx="{ex1}" cy="{ey}" rx="9" ry="14" fill="{fc}"/><ellipse cx="{ex2}" cy="{ey}" rx="9" ry="14" fill="{fc}"/>'
                f'<path d="M {mx-8} {my-6} Q {mx} {my+6} {mx+8} {my-6}" fill="none" stroke="{fc}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>')
    if look == "focus":
        return (f'<ellipse cx="{ex1}" cy="{ey}" rx="6" ry="10" fill="{fc}"/><path d="M {ex1-7} {ey-16} L {ex1+6} {ey-18}" fill="none" stroke="{fc}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
                f'<ellipse cx="{ex2}" cy="{ey}" rx="6" ry="10" fill="{fc}"/><path d="M {ex2-7} {ey-14} L {ex2+6} {ey-16}" fill="none" stroke="{fc}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
                f'<path d="M {mx-7} {my-6} L {mx+7} {my-6}" fill="none" stroke="{fc}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>')
    # celebrate
    sp = lambda x, y: f'<path d="M {x} {y-8} L {x+3} {y-3} L {x+8} {y} L {x+3} {y+3} L {x} {y+8} L {x-3} {y+3} L {x-8} {y} L {x-3} {y-3} Z" fill="{body}"/>'
    return (f'<path d="M {ex1-9} {ey+4} Q {ex1} {ey-13} {ex1+9} {ey+4}" fill="none" stroke="{fc}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="M {ex2-9} {ey+4} Q {ex2} {ey-13} {ex2+9} {ey+4}" fill="none" stroke="{fc}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<ellipse cx="{mx}" cy="{my}" rx="10" ry="7" fill="{fc}"/>' + sp(35, 46) + sp(204, 29))

def sun_body(c):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        pts.append(f'<circle cx="{120 + 84 * math.cos(a):.1f}" cy="{112 + 84 * math.sin(a):.1f}" r="17" fill="{c}"/>')
    return "".join(pts) + f'<circle cx="120" cy="112" r="78" fill="{c}"/>'

CHARS = {
    # French: an ink drop with an acute accent (é) - writing and spelling.
    "leo": dict(name="Léo", lang="法文", color="#2E5BCC", fc="#FFFFFF", bg="#D6E2FF",
        body=lambda c: (f'<path d="M 120 34 C 158 72 190 108 190 146 C 190 184 160 202 120 202 C 80 202 50 184 50 146 C 50 108 82 72 120 34 Z" fill="{c}"/>'
                        f'<path d="M 146 30 L 170 10" fill="none" stroke="{c}" stroke-width="13" stroke-linecap="round"/>'),
        legs="M 96 198 Q 88 207 85 216 M 146 198 Q 154 207 158 216",
        arms="M 56 150 Q 38 160 26 176 M 186 140 Q 204 124 213 101", hands=[(24, 178), (214, 96)],
        eyes=(102, 140, 138), mouth=(120, 168)),
    # Spanish: a sun - warm, open conversation.
    "sol": dict(name="Sol", lang="西文", color="#F7B32B", fc="#212033", bg="#FFF0C7",
        body=sun_body, legs="M 98 186 Q 88 202 85 216 M 142 186 Q 154 202 158 216",
        arms="M 44 128 Q 28 142 22 162 M 196 122 Q 212 108 218 88", hands=[(20, 166), (219, 84)],
        eyes=(102, 104, 138), mouth=(120, 132)),
    # Chinese: a seal stamp (印章) with a brush-stroke tuft - characters.
    "mo": dict(name="Mo", lang="中文", color="#C8402F", fc="#FAF8F2", bg="#FFE1D9",
        body=lambda c: (f'<path d="M 72 44 L 168 44 Q 192 44 192 68 L 192 172 Q 192 196 168 196 L 72 196 Q 48 196 48 172 L 48 68 Q 48 44 72 44 Z" fill="{c}"/>'
                        f'<path d="M 64 60 L 176 60 L 176 180 L 64 180 Z" fill="none" stroke="#F2A493" stroke-width="4" stroke-linejoin="round"/>'
                        f'<path d="M 108 40 Q 116 14 140 12 Q 128 24 128 42 Z" fill="{c}"/>'),
        legs="M 94 196 Q 87 206 85 216 M 146 196 Q 154 206 158 216",
        arms="M 50 126 Q 32 140 24 160 M 190 120 Q 208 108 216 88", hands=[(22, 164), (217, 84)],
        eyes=(102, 112, 138), mouth=(120, 140)),
    # Russian: an onion dome - Cyrillic letters built step by step.
    "mira": dict(name="Mira", lang="俄文", color="#1E6A7E", fc="#FFFFFF", bg="#D3ECF1",
        body=lambda c: (f'<circle cx="120" cy="14" r="9" fill="{c}"/><path d="M 116 22 L 124 22 L 124 30 L 116 30 Z" fill="{c}"/>'
                        f'<path d="M 120 26 Q 130 44 160 58 Q 198 80 194 132 Q 190 194 120 198 Q 50 194 46 132 Q 42 80 80 58 Q 110 44 120 26 Z" fill="{c}"/>'
                        f'<path d="M 66 160 Q 120 184 174 160" fill="none" stroke="#8CC3D0" stroke-width="5" stroke-linecap="round"/>'),
        legs="M 96 194 Q 88 205 85 216 M 144 194 Q 154 205 158 216",
        arms="M 54 132 Q 36 144 26 164 M 186 126 Q 206 112 214 92", hands=[(24, 168), (215, 88)],
        eyes=(103, 112, 137), mouth=(120, 140)),
}

for cid, d in CHARS.items():
    for look in ("hello", "focus", "celebrate"):
        c = d["color"]
        ex1, ey, ex2 = d["eyes"]
        mx, my = d["mouth"]
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 270" role="img"><title>{d["name"]} · {look}</title>'
               + limbs(c, d["legs"], d["arms"], d["hands"]) + d["body"](c) + face(look, ex1, ex2, ey, mx, my, d["fc"], c) + "</svg>")
        open(f"public/brand/mascots/{cid}-{look}.svg", "w").write(svg)
print("ok", list(CHARS))
