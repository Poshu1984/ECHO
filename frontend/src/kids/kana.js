// Kids' hiragana unit: the 46 basic kana (seion) in gojūon row order.
// Teaching notes are written for Taiwanese children and parents (zhuyin
// comparisons) and checked by src/kids/kana.test.js.
//
// Fields: romaji (Hepburn, as pronounced), word (example word in hiragana),
// at (index of the kana inside the word), emoji (picture), meaning_zh/en,
// tip_zh/en (pronunciation note).

const K = (kana, romaji, word, at, emoji, meaning_zh, meaning_en, tip_zh, tip_en) => ({
  kana, romaji, word, at, emoji, meaning_zh, meaning_en, tip_zh, tip_en,
});

const ROWS = [
  {
    id: "a", title_zh: "あ行", title_en: "A row",
    kana: [
      K("あ", "a", "あり", 0, "🐜", "螞蟻", "ant", "像注音「ㄚ」，嘴巴張大。", "Like the a in “father”, mouth wide open."),
      K("い", "i", "いぬ", 0, "🐶", "狗", "dog", "像「ㄧ」，嘴角往兩邊拉。", "Like the ee in “see”, but short."),
      K("う", "u", "うさぎ", 0, "🐰", "兔子", "rabbit", "像「ㄨ」，但嘴唇不要嘟圓，放鬆一點。", "Like oo in “book”, lips relaxed, not rounded."),
      K("え", "e", "えんぴつ", 0, "✏️", "鉛筆", "pencil", "像「ㄝ」，短短的。", "Like the e in “egg”."),
      K("お", "o", "おばけ", 0, "👻", "妖怪（鬼）", "ghost", "像「ㄛ」，嘴唇圓圓的。", "Like the o in “go”, but short and pure."),
    ],
  },
  {
    id: "k", title_zh: "か行", title_en: "K row",
    kana: [
      K("か", "ka", "かさ", 0, "☂️", "雨傘", "umbrella", "像「ㄎㄚ」，但氣不要噴太多，介於「ㄍ」和「ㄎ」之間。", "Like “ka”, with only a little puff of air."),
      K("き", "ki", "きのこ", 0, "🍄", "香菇", "mushroom", "像「ㄎㄧ」，輕輕的。", "Like “key”, but short."),
      K("く", "ku", "くま", 0, "🐻", "熊", "bear", "像「ㄎㄨ」，嘴唇不要嘟圓。", "Like “coo”, lips relaxed."),
      K("け", "ke", "けむし", 0, "🐛", "毛毛蟲", "caterpillar", "像「ㄎㄝ」。", "Like “ke” in “kettle”."),
      K("こ", "ko", "ことり", 0, "🐦", "小鳥", "little bird", "像「ㄎㄛ」，嘴唇圓。", "Like “co” in “cold”, short."),
    ],
  },
  {
    id: "s", title_zh: "さ行", title_en: "S row",
    kana: [
      K("さ", "sa", "さかな", 0, "🐟", "魚", "fish", "像「ㄙㄚ」。", "Like “sa” in “salsa”."),
      K("し", "shi", "しか", 0, "🦌", "鹿", "deer", "念「shi」，像「西」，不是「ㄙ」+「ㄧ」（si）。", "Say “shi” as in “she”, not “si”."),
      K("す", "su", "すいか", 0, "🍉", "西瓜", "watermelon", "像「ㄙㄨ」，ㄨ很輕，有時幾乎聽不到。", "Like “su”; the u is very light."),
      K("せ", "se", "せっけん", 0, "🧼", "肥皂", "soap", "像「ㄙㄝ」。", "Like “se” in “set”."),
      K("そ", "so", "そり", 0, "🛷", "雪橇", "sled", "像「ㄙㄛ」。", "Like “so”, short."),
    ],
  },
  {
    id: "t", title_zh: "た行", title_en: "T row",
    kana: [
      K("た", "ta", "たこ", 0, "🐙", "章魚", "octopus", "像「ㄊㄚ」，氣輕一點。", "Like “ta”, with a light puff."),
      K("ち", "chi", "ちず", 0, "🗺️", "地圖", "map", "念「chi」，像「七」，不是 ti。", "Say “chi” as in “cheese”, not “ti”."),
      K("つ", "tsu", "つき", 0, "🌙", "月亮", "moon", "念「tsu」：像「ㄘ」接很輕的「ㄨ」，舌尖先頂住上排牙齒後面再放開。", "Say “tsu” like the end of “cats” + a light u."),
      K("て", "te", "て", 0, "✋", "手", "hand", "像「ㄊㄝ」。", "Like “te” in “ten”."),
      K("と", "to", "とけい", 0, "⏰", "時鐘", "clock", "像「ㄊㄛ」。", "Like “to” in “toe”, short."),
    ],
  },
  {
    id: "n", title_zh: "な行", title_en: "N row",
    kana: [
      K("な", "na", "なす", 0, "🍆", "茄子", "eggplant", "像「ㄋㄚ」。", "Like “na”."),
      K("に", "ni", "にんじん", 0, "🥕", "紅蘿蔔", "carrot", "像「ㄋㄧ」。", "Like “knee”, short."),
      K("ぬ", "nu", "ぬいぐるみ", 0, "🧸", "布偶", "stuffed toy", "像「ㄋㄨ」。小心和「め」長得很像，ぬ 的尾巴有個小圈圈。", "Like “noo”. Looks like め, but ぬ has a little loop."),
      K("ね", "ne", "ねこ", 0, "🐱", "貓", "cat", "像「ㄋㄝ」。尾巴捲成小圈圈（れ、わ 沒有）。", "Like “ne” in “net”. Its tail curls into a loop (れ and わ don’t)."),
      K("の", "no", "のこぎり", 0, "🪚", "鋸子", "saw", "像「ㄋㄛ」。", "Like “no”, short."),
    ],
  },
  {
    id: "h", title_zh: "は行", title_en: "H row",
    kana: [
      K("は", "ha", "はな", 0, "🌸", "花", "flower", "像「ㄏㄚ」，但氣從喉嚨輕輕出來，不要像「哈」那麼重。當助詞時念 wa（之後會學）。", "Like “ha”. As a particle it is read “wa” (later lesson)."),
      K("ひ", "hi", "ひこうき", 0, "✈️", "飛機", "airplane", "念「hi」：舌頭靠近上顎輕輕吹氣，聽起來介於「嘻」和「西」之間。", "Like “he”, with air brushing the roof of the mouth."),
      K("ふ", "fu", "ふね", 0, "🚢", "船", "ship", "嘴唇輕輕靠近吹氣，像吹蠟燭；不要用牙齒咬下唇（不是英文的 f）。", "Blow gently through both lips, like blowing a candle — no teeth on the lip."),
      K("へ", "he", "へび", 0, "🐍", "蛇", "snake", "像「ㄏㄝ」。當助詞時念 e（之後會學）。", "Like “he” in “hen”. As a particle it is read “e” (later lesson)."),
      K("ほ", "ho", "ほし", 0, "⭐", "星星", "star", "像「ㄏㄛ」。和「は」很像，ほ 的右邊上面多一橫。", "Like “ho”. Looks like は, but ほ has an extra line on top."),
    ],
  },
  {
    id: "m", title_zh: "ま行", title_en: "M row",
    kana: [
      K("ま", "ma", "まど", 0, "🪟", "窗戶", "window", "像「ㄇㄚ」。", "Like “ma”."),
      K("み", "mi", "みみ", 0, "👂", "耳朵", "ear", "像「ㄇㄧ」。", "Like “me”, short."),
      K("む", "mu", "むし", 0, "🐞", "蟲子", "bug", "像「ㄇㄨ」，嘴唇不要嘟太圓。", "Like “moo”, lips relaxed."),
      K("め", "me", "めがね", 0, "👓", "眼鏡", "glasses", "像「ㄇㄝ」。和「ぬ」很像，め 沒有小圈圈。", "Like “me” in “met”. Looks like ぬ, but め has no loop."),
      K("も", "mo", "もも", 0, "🍑", "桃子", "peach", "像「ㄇㄛ」。", "Like “mo”, short."),
    ],
  },
  {
    id: "y", title_zh: "や行", title_en: "Y row",
    kana: [
      K("や", "ya", "やま", 0, "⛰️", "山", "mountain", "像「ㄧㄚ」（呀）。", "Like “ya” in “yard”."),
      K("ゆ", "yu", "ゆき", 0, "❄️", "雪", "snow", "像「ㄧㄨ」（優），短短的。", "Like “you”, short."),
      K("よ", "yo", "ようふく", 0, "👕", "衣服", "clothes", "像「ㄧㄛ」（喲）。", "Like “yo” in “yoga”."),
    ],
  },
  {
    id: "r", title_zh: "ら行", title_en: "R row",
    kana: [
      K("ら", "ra", "らくだ", 0, "🐪", "駱駝", "camel", "舌尖在上排牙齒後面輕輕彈一下，介於「ㄌㄚ」和「ㄖㄚ」之間；不要捲舌。", "Flick the tongue tip once behind the top teeth — between l and r, no rolling."),
      K("り", "ri", "りんご", 0, "🍎", "蘋果", "apple", "舌尖輕彈一下，像很輕的「ㄌㄧ」。", "A light tongue flick, like a soft “li”."),
      K("る", "ru", "くるま", 1, "🚗", "汽車", "car", "舌尖輕彈一下，像很輕的「ㄌㄨ」。日文單字很少用る開頭，所以用「くるま」中間的る來練。", "A light tongue flick, like a soft “lu”. Few words start with る, so we use the る inside くるま."),
      K("れ", "re", "れっしゃ", 0, "🚆", "火車", "train", "舌尖輕彈一下，像很輕的「ㄌㄝ」。", "A light tongue flick, like a soft “le”."),
      K("ろ", "ro", "ろうそく", 0, "🕯️", "蠟燭", "candle", "舌尖輕彈一下，像很輕的「ㄌㄛ」。和「る」很像，る 的尾巴有小圈圈，ろ 沒有。", "A light flick, like a soft “lo”. Looks like る, but ろ has no loop."),
    ],
  },
  {
    id: "w", title_zh: "わ行", title_en: "W row",
    kana: [
      K("わ", "wa", "わに", 0, "🐊", "鱷魚", "crocodile", "像「ㄨㄚ」（哇）。", "Like “wa” in “wow”."),
      K("を", "o", "ほんを よむ", 2, "📖", "讀書（を 是助詞）", "read a book (を is a particle)", "寫法拼成 wo，但念起來和「お」一樣是 o；只用在句子裡當助詞，例如「ほんを よむ」。", "Spelled “wo” but sounds like お (o). It is only used as a particle, as in ほんを よむ."),
      K("ん", "n", "みかん", 2, "🍊", "橘子", "mandarin orange", "鼻音：嘴巴輕輕閉著「嗯」一聲。不會放在單字的第一個字。", "A nasal hum, like “n” in “sun”. It never starts a word."),
    ],
  },
];

export const HIRAGANA_ROWS = ROWS.map(({ kana, ...row }) => ({ ...row, kana: kana.map((k) => k.kana) }));

export const HIRAGANA = Object.fromEntries(
  ROWS.flatMap((row) => row.kana.map((k) => [k.kana, { ...k, row: row.id }])),
);

// Shapes children commonly mix up. Used as preferred distractors in the
// advanced quiz. Kept symmetric (checked by tests).
const PAIRS = [
  ["ぬ", "め"], ["ね", "れ"], ["ね", "わ"], ["れ", "わ"], ["さ", "ち"], ["る", "ろ"],
  ["は", "ほ"], ["い", "り"], ["き", "さ"], ["あ", "お"], ["こ", "に"], ["う", "つ"],
];
export const LOOKALIKES = PAIRS.reduce((acc, [a, b]) => {
  (acc[a] ||= []).push(b);
  (acc[b] ||= []).push(a);
  return acc;
}, {});

const ROW_BY_KANA = Object.fromEntries(HIRAGANA_ROWS.flatMap((r) => r.kana.map((k) => [k, r])));

export function rowOf(kana) {
  return ROW_BY_KANA[kana] || null;
}
