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

export const LEVEL_DISCLAIMER = "對照為常見公開換算區間，非官方成績預測";

export const TUTORS = [
  { id: "audrey", gender: "f", name: "Audrey", style: "溫暖帶路", preferred: "Neural2-C", pitch: 1, blurb: "女聲。清楚、有耐心。" },
  { id: "brad", gender: "m", name: "Brad", style: "沉穩教練", preferred: "Neural2-D", pitch: 1, blurb: "男聲。穩、不催促。" },
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
  en: { text: "Hi. How was your morning?", zh: "嗨。你今天早上過得怎麼樣？" },
  ja: { text: "こんにちは。今朝はどんな感じでしたか？", zh: "你好。你今天早上過得怎麼樣？" },
  fr: { text: "Salut. Comment s'est passee ta matinee ?", zh: "嗨。你今天早上過得怎麼樣？" },
  ko: { text: "안녕. 오늘 아침은 어땠어요?", zh: "嗨。你今天早上過得怎麼樣？" },
  es: { text: "Hola. Que tal te fue esta manana?", zh: "嗨。你今天早上過得怎麼樣？" },
  zh: { text: "嗨。你今天早上過得怎麼樣？", zh: "Hi. How was your morning?" },
};

export const VOCAB = {
  en: [
    { word: "deadline", hint: "最後期限", sentence: "The deadline is tonight.", sentence_zh: "期限是今晚。" },
    { word: "negotiate", hint: "談判", sentence: "We need to negotiate the terms.", sentence_zh: "我們必須談判條件。" },
    { word: "reliable", hint: "可靠的", sentence: "She is a reliable operator.", sentence_zh: "她是可靠的操作員。" },
  ],
  zh: [
    { word: "期限", hint: "deadline", sentence: "這份報告的期限是今晚。", sentence_zh: "The deadline for this report is tonight." },
    { word: "交涉", hint: "negotiate", sentence: "我們必須交涉條件。", sentence_zh: "We must negotiate the terms." },
    { word: "可靠", hint: "reliable", sentence: "她是可靠的操作員。", sentence_zh: "She is a reliable operator." },
  ],
  ja: [
    { word: "締切", hint: "最後期限", sentence: "締切は今夜です。", sentence_zh: "期限是今晚。" },
    { word: "交渉", hint: "談判", sentence: "条件を交渉する必要がある。", sentence_zh: "必須談判條件。" },
    { word: "信頼", hint: "可靠", sentence: "彼女は信頼できる。", sentence_zh: "她值得信賴。" },
  ],
  fr: [
    { word: "delai", hint: "期限", sentence: "Le delai est ce soir.", sentence_zh: "期限是今晚。" },
    { word: "negocier", hint: "談判", sentence: "Il faut negocier les termes.", sentence_zh: "必須談判條件。" },
    { word: "fiable", hint: "可靠", sentence: "Elle est fiable.", sentence_zh: "她很可靠。" },
  ],
  ko: [
    { word: "마감", hint: "最後期限", sentence: "마감은 오늘 밤입니다.", sentence_zh: "期限是今晚。" },
    { word: "협상", hint: "談判", sentence: "조건을 협상해야 합니다.", sentence_zh: "必須談判條件。" },
    { word: "신뢰", hint: "可靠", sentence: "그녀는 신뢰할 수 있습니다.", sentence_zh: "她值得信賴。" },
  ],
  es: [
    { word: "plazo", hint: "期限", sentence: "El plazo es esta noche.", sentence_zh: "期限是今晚。" },
    { word: "negociar", hint: "談判", sentence: "Hay que negociar los terminos.", sentence_zh: "必須談判條件。" },
    { word: "fiable", hint: "可靠", sentence: "Ella es fiable.", sentence_zh: "她很可靠。" },
  ],
};

export const SCENES = {
  en: [{ title: "Airport gate", title_zh: "登機門", prompt: "You missed a connection. Ask for the next flight.", prompt_zh: "你沒趕上轉機。詢問下一班飛機。" }],
  zh: [{ title: "海關", title_zh: "Customs", prompt: "你被要求說明旅行目的。清楚回答。", prompt_zh: "You are asked to state the purpose of travel. Answer clearly." }],
  ja: [{ title: "駅の窓口", title_zh: "車站窗口", prompt: "乗り過ごした。次の案内を頼む。", prompt_zh: "你坐過站了。請對方告訴你下一班。" }],
  fr: [{ title: "Hotel", title_zh: "飯店", prompt: "La reservation a disparu. Recupere la chambre.", prompt_zh: "訂單不見了。把房間要回來。" }],
  ko: [{ title: "카페 주문", title_zh: "咖啡廳點餐", prompt: "알레르기가 있다. 메뉴를 확인하라.", prompt_zh: "你有過敏。確認菜單。" }],
  es: [{ title: "Oficina", title_zh: "辦公室", prompt: "Llegas tarde. Explica sin excusas baratas.", prompt_zh: "你遲到了。解釋，但不要廉價藉口。" }],
};

export const EXAMS = {
  en: {
    board: "IELTS / TOEIC style",
    items: [
      { q: "The report must be filed _____ Friday.", q_zh: "這份報告最晚要在週五前_____。", options: ["until", "by", "since", "at"], options_zh: ["直到", "在…之前", "自從", "在（時刻）"], a: 1 },
      { q: "She has been in the sector _____ 2019.", q_zh: "她從 2019 年起就在這個領域。", options: ["for", "since", "during", "by"], options_zh: ["為期", "自從", "在…期間", "在…之前"], a: 1 },
    ],
  },
  zh: {
    board: "TOCFL 風格",
    items: [
      { q: "這份合約最晚要在週五前_____。", q_zh: "This contract must be _____ by Friday.", options: ["簽署", "散步", "遲到", "關閉燈光"], options_zh: ["signed", "take a walk", "be late", "turn off the lights"], a: 0 },
      { q: "他對流程非常_____。", q_zh: "He is very _____ with the process.", options: ["陌生", "熟悉", "遙遠", "空白"], options_zh: ["unfamiliar", "familiar", "distant", "blank"], a: 1 },
    ],
  },
  ja: {
    board: "JLPT 風格",
    items: [
      { q: "この書類は金曜日までに（　）。", q_zh: "這份文件請在週五前（　）。", options: ["出します", "出してください", "出しましょうか", "出ています"], options_zh: ["我會交", "請交", "要交嗎", "已經交了"], a: 1 },
    ],
  },
  fr: {
    board: "DELF 風格",
    items: [{ q: "Je dois envoyer le dossier _____ lundi.", q_zh: "我必須在週一_____把檔案寄出。", options: ["avant", "depuis", "pendant", "sans"], options_zh: ["在…之前", "自從", "在…期間", "沒有"], a: 0 }],
  },
  ko: {
    board: "TOPIK 風格",
    items: [{ q: "보고서를 금요일까지 ( ).", q_zh: "報告請在週五前（ ）。", options: ["제출하세요", "제출입니다", "제출하고", "제출의"], options_zh: ["請提交", "是提交", "提交然後", "提交的"], a: 0 }],
  },
  es: {
    board: "DELE 風格",
    items: [{ q: "El informe debe estar listo _____ el viernes.", q_zh: "報告必須在週五_____準備好。", options: ["para", "desde", "sin", "entre"], options_zh: ["在…之前", "自從", "沒有", "在…之間"], a: 0 }],
  },
};

export const PASSAGES = {
  en: { title: "Night Shift", title_zh: "夜班", sentences: [
    { text: "The corridor lights flickered once, then held.", zh: "走廊的燈閃了一下，然後穩定下來。" },
    { text: "I checked the log and found a missing line.", zh: "我核對紀錄，發現少了一行。" },
    { text: "Repeat the last phrase until the rhythm sits in your mouth.", zh: "重複最後一句，直到節奏留在嘴裡。" },
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

