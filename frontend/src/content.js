export const LEARN_LANGS = [
  { code: "en", name: "English", zh: "英文", speech: "en-US", exam: "IELTS / TOEIC" },
  { code: "ja", name: "日本語", zh: "日文", speech: "ja-JP", exam: "JLPT" },
  { code: "fr", name: "Français", zh: "法文", speech: "fr-FR", exam: "DELF" },
  { code: "ko", name: "한국어", zh: "韓文", speech: "ko-KR", exam: "TOPIK" },
  { code: "es", name: "Español", zh: "西文", speech: "es-ES", exam: "DELE" },
  { code: "zh", name: "中文", zh: "中文", speech: "zh-TW", exam: "TOCFL" },
];

export const LEVELS = [
  { id: "A2", zh: "初級", toeic: "225-549", ielts: "3.0-3.5" },
  { id: "B1", zh: "中級", toeic: "550-784", ielts: "4.0-5.0" },
  { id: "B2", zh: "中高級", toeic: "785-944", ielts: "5.5-6.5" },
];

export const TUTORS = [
  { id: "nova", gender: "f", name: "NOVA", style: "冷冽精準", preferred: "Neural2-C", pitch: 1.02, blurb: "短指令、零廢話。" },
  { id: "nyx", gender: "f", name: "NYX", style: "沉穩帶路", preferred: "Wavenet-F", pitch: 0.98, blurb: "慢、清楚、會等你。" },
  { id: "vesper", gender: "f", name: "VESPER", style: "高壓特訓", preferred: "News-K", pitch: 1.08, blurb: "節奏快，逼你開口。" },
  { id: "hex", gender: "m", name: "HEX", style: "分析口吻", preferred: "Neural2-D", pitch: 0.92, blurb: "拆句、標錯誤。" },
  { id: "orion", gender: "m", name: "ORION", style: "沉著教練", preferred: "Wavenet-D", pitch: 0.95, blurb: "穩定、鼓勵但不甜。" },
  { id: "drift", gender: "m", name: "DRIFT", style: "敘事noir", preferred: "Studio-Q", pitch: 0.88, blurb: "用故事帶出句型。" },
];

export const UNLOCKS = [
  { id: "chat", xp: 0 },
  { id: "read", xp: 0 },
  { id: "vocab", xp: 40 },
  { id: "examples", xp: 90 },
  { id: "scenes", xp: 150 },
  { id: "exams", xp: 240 },
];

export function canAccess(user, featureId) {
  if (!user) return false;
  if (user.role === "admin" || (user.unlocked || []).includes("*")) return true;
  const need = UNLOCKS.find((u) => u.id === featureId)?.xp ?? 0;
  return (user.xp || 0) >= need;
}

export const GREET = {
  en: "Signal locked. What did you do this morning?",
  ja: "回線接続。今朝は何をしましたか？",
  fr: "Signal verrouille. Qu'as-tu fait ce matin ?",
  ko: "신호 접속. 오늘 아침에 뭐 했어요?",
  es: "Senal fija. Que hiciste esta manana?",
  zh: "訊號鎖定。你今天早上做了什麼？",
};

export const VOCAB = {
  en: [
    { word: "deadline", hint: "最後期限", sentence: "The deadline is tonight." },
    { word: "negotiate", hint: "談判", sentence: "We need to negotiate the terms." },
    { word: "reliable", hint: "可靠的", sentence: "She is a reliable operator." },
  ],
  zh: [
    { word: "期限", hint: "deadline", sentence: "這份報告的期限是今晚。" },
    { word: "交涉", hint: "negotiate", sentence: "我們必須交涉條件。" },
    { word: "可靠", hint: "reliable", sentence: "她是可靠的操作員。" },
  ],
  ja: [
    { word: "締切", hint: "deadline", sentence: "締切は今夜です。" },
    { word: "交渉", hint: "negotiate", sentence: "条件を交渉する必要がある。" },
    { word: "信頼", hint: "reliable", sentence: "彼女は信頼できる。" },
  ],
  fr: [
    { word: "delai", hint: "期限", sentence: "Le delai est ce soir." },
    { word: "negocier", hint: "談判", sentence: "Il faut negocier les termes." },
    { word: "fiable", hint: "可靠", sentence: "Elle est fiable." },
  ],
  ko: [
    { word: "마감", hint: "deadline", sentence: "마감은 오늘 밤입니다." },
    { word: "협상", hint: "negotiate", sentence: "조건을 협상해야 합니다." },
    { word: "신뢰", hint: "reliable", sentence: "그녀는 신뢰할 수 있습니다." },
  ],
  es: [
    { word: "plazo", hint: "期限", sentence: "El plazo es esta noche." },
    { word: "negociar", hint: "談判", sentence: "Hay que negociar los terminos." },
    { word: "fiable", hint: "可靠", sentence: "Ella es fiable." },
  ],
};

export const SCENES = {
  en: [{ title: "Airport gate", prompt: "You missed a connection. Ask for the next flight." }],
  zh: [{ title: "海關", prompt: "你被要求說明旅行目的。清楚回答。" }],
  ja: [{ title: "駅の窓口", prompt: "乗り過ごした。次の案内を頼む。" }],
  fr: [{ title: "Hotel", prompt: "La reservation a disparu. Recupere la chambre." }],
  ko: [{ title: "카페 주문", prompt: "알레르기가 있다. 메뉴를 확인하라." }],
  es: [{ title: "Oficina", prompt: "Llegas tarde. Explica sin excusas baratas." }],
};

export const EXAMS = {
  en: {
    board: "IELTS / TOEIC style",
    items: [
      { q: "The report must be filed _____ Friday.", options: ["until", "by", "since", "at"], a: 1 },
      { q: "She has been in the sector _____ 2019.", options: ["for", "since", "during", "by"], a: 1 },
    ],
  },
  zh: {
    board: "TOCFL 風格",
    items: [
      { q: "這份合約最晚要在週五前_____。", options: ["簽署", "散步", "遲到", "關閉燈光"], a: 0 },
      { q: "他對流程非常_____。", options: ["陌生", "熟悉", "遙遠", "空白"], a: 1 },
    ],
  },
  ja: {
    board: "JLPT 風格",
    items: [
      { q: "この書類は金曜日までに（　）。", options: ["出します", "出してください", "出しましょうか", "出ています"], a: 1 },
    ],
  },
  fr: {
    board: "DELF 風格",
    items: [{ q: "Je dois envoyer le dossier _____ lundi.", options: ["avant", "depuis", "pendant", "sans"], a: 0 }],
  },
  ko: {
    board: "TOPIK 風格",
    items: [{ q: "보고서를 금요일까지 ( ).", options: ["제출하세요", "제출입니다", "제출하고", "제출의"], a: 0 }],
  },
  es: {
    board: "DELE 風格",
    items: [{ q: "El informe debe estar listo _____ el viernes.", options: ["para", "desde", "sin", "entre"], a: 0 }],
  },
};

export const PASSAGES = {
  en: { title: "Night Shift", title_zh: "夜班", sentences: [
    { text: "The corridor lights flickered once, then held.", zh: "走廊的燈閃了一下，然後穩定下來。" },
    { text: "I checked the log and found a missing line.", zh: "我核對紀錄，發現少了一行。" },
  ]},
  zh: { title: "夜班", title_zh: "Night Shift", sentences: [
    { text: "走廊的燈閃了一下，然後又亮著。", zh: "The lights flickered, then held." },
    { text: "我核對紀錄，發現少了一行。", zh: "A line was missing in the log." },
  ]},
  ja: { title: "夜勤", title_zh: "夜班", sentences: [
    { text: "廊下の明かりが一度点滅して、また安定した。", zh: "走廊燈閃了一下又穩了。" },
  ]},
  fr: { title: "Quart de nuit", title_zh: "夜班", sentences: [
    { text: "Les lumieres du couloir ont clignote, puis se sont tenues.", zh: "走廊燈閃了一下然後穩住。" },
  ]},
  ko: { title: "야간 근무", title_zh: "夜班", sentences: [
    { text: "복도 불이 한 번 깜빡이더니 다시 안정됐다.", zh: "走廊燈閃了一下又穩定了。" },
  ]},
  es: { title: "Turno de noche", title_zh: "夜班", sentences: [
    { text: "Las luces del pasillo parpadearon y se quedaron.", zh: "走廊燈閃了一下然後穩住。" },
  ]},
};
