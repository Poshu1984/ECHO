// Kids mode · Japanese hiragana unit 1 (basic 46 gojūon).
//
// Curriculum design (standard kana sequencing used by Japanese primary
// schools and JFL courses): one 行 (row) per lesson, in gojūon order, so the
// five vowels come first and every later row reuses them (k+a, k+i ...).
// Each kana has a picture word a 3–6 year old can recognise without reading.
// `at` is the index of the kana inside `word` (most words start with it; a
// few kana that rarely start a child's word are shown inside one instead).
//
// Romaji is modified Hepburn (shi, chi, tsu, fu). を is taught as the object
// particle, pronounced "o" in modern standard Japanese.

export const KANA_ROWS = [
  {
    id: "a", label: "あ行", kana: [
      { k: "あ", r: "a", word: "あり", at: 0, pic: "🐜", zh: "螞蟻", en: "ant" },
      { k: "い", r: "i", word: "いぬ", at: 0, pic: "🐕", zh: "狗", en: "dog" },
      { k: "う", r: "u", word: "うさぎ", at: 0, pic: "🐇", zh: "兔子", en: "rabbit" },
      { k: "え", r: "e", word: "えんぴつ", at: 0, pic: "✏️", zh: "鉛筆", en: "pencil" },
      { k: "お", r: "o", word: "おにぎり", at: 0, pic: "🍙", zh: "飯糰", en: "rice ball" },
    ],
  },
  {
    id: "ka", label: "か行", kana: [
      { k: "か", r: "ka", word: "かさ", at: 0, pic: "☂️", zh: "雨傘", en: "umbrella" },
      { k: "き", r: "ki", word: "きつね", at: 0, pic: "🦊", zh: "狐狸", en: "fox" },
      { k: "く", r: "ku", word: "くま", at: 0, pic: "🐻", zh: "熊", en: "bear" },
      { k: "け", r: "ke", word: "けむし", at: 0, pic: "🐛", zh: "毛毛蟲", en: "caterpillar" },
      { k: "こ", r: "ko", word: "こおり", at: 0, pic: "🧊", zh: "冰塊", en: "ice" },
    ],
  },
  {
    id: "sa", label: "さ行", kana: [
      { k: "さ", r: "sa", word: "さかな", at: 0, pic: "🐟", zh: "魚", en: "fish" },
      { k: "し", r: "shi", word: "しか", at: 0, pic: "🦌", zh: "鹿", en: "deer" },
      { k: "す", r: "su", word: "すいか", at: 0, pic: "🍉", zh: "西瓜", en: "watermelon" },
      { k: "せ", r: "se", word: "せっけん", at: 0, pic: "🧼", zh: "肥皂", en: "soap" },
      { k: "そ", r: "so", word: "そり", at: 0, pic: "🛷", zh: "雪橇", en: "sled" },
    ],
  },
  {
    id: "ta", label: "た行", kana: [
      { k: "た", r: "ta", word: "たまご", at: 0, pic: "🥚", zh: "蛋", en: "egg" },
      { k: "ち", r: "chi", word: "ちず", at: 0, pic: "🗺️", zh: "地圖", en: "map" },
      { k: "つ", r: "tsu", word: "つき", at: 0, pic: "🌙", zh: "月亮", en: "moon" },
      { k: "て", r: "te", word: "て", at: 0, pic: "✋", zh: "手", en: "hand" },
      { k: "と", r: "to", word: "とり", at: 0, pic: "🐦", zh: "鳥", en: "bird" },
    ],
  },
  {
    id: "na", label: "な行", kana: [
      { k: "な", r: "na", word: "なし", at: 0, pic: "🍐", zh: "梨子", en: "pear" },
      { k: "に", r: "ni", word: "にんじん", at: 0, pic: "🥕", zh: "紅蘿蔔", en: "carrot" },
      { k: "ぬ", r: "nu", word: "ぬいぐるみ", at: 0, pic: "🧸", zh: "布偶", en: "stuffed toy" },
      { k: "ね", r: "ne", word: "ねこ", at: 0, pic: "🐈", zh: "貓", en: "cat" },
      { k: "の", r: "no", word: "のみもの", at: 0, pic: "🥤", zh: "飲料", en: "drink" },
    ],
  },
  {
    id: "ha", label: "は行", kana: [
      { k: "は", r: "ha", word: "はな", at: 0, pic: "🌸", zh: "花", en: "flower" },
      { k: "ひ", r: "hi", word: "ひこうき", at: 0, pic: "✈️", zh: "飛機", en: "airplane" },
      { k: "ふ", r: "fu", word: "ふね", at: 0, pic: "🚢", zh: "船", en: "ship" },
      { k: "へ", r: "he", word: "へび", at: 0, pic: "🐍", zh: "蛇", en: "snake" },
      { k: "ほ", r: "ho", word: "ほし", at: 0, pic: "⭐", zh: "星星", en: "star" },
    ],
  },
  {
    id: "ma", label: "ま行", kana: [
      { k: "ま", r: "ma", word: "まど", at: 0, pic: "🪟", zh: "窗戶", en: "window" },
      { k: "み", r: "mi", word: "みかん", at: 0, pic: "🍊", zh: "橘子", en: "mandarin orange" },
      { k: "む", r: "mu", word: "むし", at: 0, pic: "🐞", zh: "蟲", en: "bug" },
      { k: "め", r: "me", word: "め", at: 0, pic: "👁️", zh: "眼睛", en: "eye" },
      { k: "も", r: "mo", word: "もみじ", at: 0, pic: "🍁", zh: "楓葉", en: "maple leaf" },
    ],
  },
  {
    id: "ya", label: "や行", kana: [
      { k: "や", r: "ya", word: "やま", at: 0, pic: "⛰️", zh: "山", en: "mountain" },
      { k: "ゆ", r: "yu", word: "ゆき", at: 0, pic: "❄️", zh: "雪", en: "snow" },
      { k: "よ", r: "yo", word: "よる", at: 0, pic: "🌃", zh: "晚上", en: "night" },
    ],
  },
  {
    id: "ra", label: "ら行", kana: [
      { k: "ら", r: "ra", word: "らっぱ", at: 0, pic: "🎺", zh: "喇叭", en: "trumpet" },
      { k: "り", r: "ri", word: "りんご", at: 0, pic: "🍎", zh: "蘋果", en: "apple" },
      { k: "る", r: "ru", word: "くるま", at: 1, pic: "🚗", zh: "汽車", en: "car" },
      { k: "れ", r: "re", word: "はれ", at: 1, pic: "☀️", zh: "晴天", en: "sunny" },
      { k: "ろ", r: "ro", word: "ろうそく", at: 0, pic: "🕯️", zh: "蠟燭", en: "candle" },
    ],
  },
  {
    id: "wa", label: "わ行・ん", kana: [
      { k: "わ", r: "wa", word: "わに", at: 0, pic: "🐊", zh: "鱷魚", en: "crocodile" },
      { k: "を", r: "o", word: "えをかく", at: 1, pic: "🎨", zh: "畫圖", en: "draw a picture" },
      { k: "ん", r: "n", word: "ほん", at: 1, pic: "📚", zh: "書", en: "book" },
    ],
  },
];

// Pronunciation notes for parents / older kids (zh, en). Only the sounds that
// Mandarin speakers commonly get wrong get a note.
export const KANA_TIPS = {
  "う": { zh: "嘴唇不要嘟起來，比注音ㄨ更放鬆、更短。", en: "Don't round your lips; it's shorter and more relaxed than English \"oo\"." },
  "し": { zh: "念 shi，接近「西」，不是 si。", en: "Say \"shi\", not \"si\"." },
  "ち": { zh: "念 chi，接近「七」，不是 ti。", en: "Say \"chi\", not \"ti\"." },
  "つ": { zh: "念 tsu，舌尖頂住上牙後面再放開，像「ㄘ」加ㄨ。", en: "Say \"tsu\" like the end of \"cats\" plus a short u." },
  "ひ": { zh: "念 hi，氣從舌面輕輕擦出，不要念成「西」（shi）。", en: "Say \"hi\" with a light breath; not \"shi\"." },
  "ふ": { zh: "上下唇輕輕靠近吹氣，介於 hu 和 fu 之間，牙齒不碰嘴唇。", en: "Blow gently between your lips; teeth don't touch the lip." },
  "ら": { zh: "ら行的 r 是舌尖輕彈一下，介於 l 和 r 之間，不捲舌。", en: "The r is a light tap of the tongue, between l and r. No rolling." },
  "り": { zh: "舌尖輕彈一下再念 i。", en: "A light tongue tap, then i." },
  "る": { zh: "舌尖輕彈一下再念 u。", en: "A light tongue tap, then u." },
  "れ": { zh: "舌尖輕彈一下再念 e。", en: "A light tongue tap, then e." },
  "ろ": { zh: "舌尖輕彈一下再念 o。", en: "A light tongue tap, then o." },
  "は": { zh: "單獨念 ha；當助詞（例如「わたしは」）時念 wa。", en: "Say \"ha\"; as the topic particle (わたしは) it is read \"wa\"." },
  "へ": { zh: "單獨念 he；當助詞（「方向」）時念 e。", en: "Say \"he\"; as the direction particle it is read \"e\"." },
  "を": { zh: "現代標準日語念 o，和「お」同音，只用在助詞。", en: "Read \"o\", same as お. Only used as a particle." },
  "ん": { zh: "鼻音，自己就是一拍，不會出現在字的開頭。", en: "A nasal sound that takes a full beat. Never starts a word." },
  "え": { zh: "嘴巴自然張開，比注音ㄝ短而清楚。", en: "Short and clear, like the e in \"pet\"." },
};

// Pairs young learners confuse by shape. Quiz distractors prefer these so a
// child's practice targets the real mistakes, not random ones.
export const LOOKALIKES = [
  ["さ", "ち"], ["さ", "き"], ["ぬ", "め"], ["ね", "れ"], ["ね", "わ"], ["れ", "わ"],
  ["は", "ほ"], ["は", "け"], ["る", "ろ"], ["い", "こ"], ["あ", "お"], ["あ", "め"],
  ["う", "ら"], ["ら", "ち"], ["ま", "も"], ["く", "へ"], ["こ", "に"],
];

export const ALL_KANA = KANA_ROWS.flatMap((row) => row.kana.map((kana) => ({ ...kana, row: row.id })));

export function kanaByChar(ch) {
  return ALL_KANA.find((x) => x.k === ch) || null;
}

export function rowById(id) {
  return KANA_ROWS.find((row) => row.id === id) || null;
}

export function lookalikesOf(ch) {
  return LOOKALIKES.filter((pair) => pair.includes(ch)).map((pair) => (pair[0] === ch ? pair[1] : pair[0]));
}

// What the device or recording should say for a kana. Single kana are
// spoken alone; は/へ/を are spoken as letters (not particles) by most
// engines, which is what we want here.
export function sayKana(kana) {
  return kana.k;
}

export function sayWord(kana) {
  return kana.word;
}
