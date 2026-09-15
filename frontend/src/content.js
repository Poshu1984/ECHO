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
  {
    id: "audrey", gender: "f", name: "Audrey", style: "溫暖帶路", preferred: "Neural2-C", pitch: 1, voiceIndex: 0,
    voices: { en: "en-US-Neural2-C", ja: "ja-JP-Neural2-B", fr: "fr-FR-Neural2-A", ko: "ko-KR-Neural2-A", es: "es-ES-Neural2-A", zh: "cmn-TW-Wavenet-A" },
    blurb: "女聲。清楚、有耐心。",
  },
  {
    id: "maya", gender: "f", name: "Maya", style: "輕快清楚", preferred: "Neural2-F", pitch: 1.05, voiceIndex: 1,
    voices: { en: "en-US-Neural2-F", ja: "ja-JP-Neural2-A", fr: "fr-FR-Neural2-E", ko: "ko-KR-Wavenet-A", es: "es-ES-Neural2-C", zh: "cmn-TW-Wavenet-C" },
    blurb: "女聲。節奏明快、咬字利落。",
  },
  {
    id: "elena", gender: "f", name: "Elena", style: "沉靜溫柔", preferred: "Neural2-H", pitch: 0.96, voiceIndex: 2,
    voices: { en: "en-US-Neural2-H", ja: "ja-JP-Wavenet-B", fr: "fr-FR-Wavenet-A", ko: "ko-KR-Wavenet-B", es: "es-ES-Wavenet-C", zh: "cmn-TW-Standard-A" },
    blurb: "女聲。慢一點、聽起來安定。",
  },
  {
    id: "brad", gender: "m", name: "Brad", style: "沉穩教練", preferred: "Neural2-D", pitch: 1, voiceIndex: 0,
    voices: { en: "en-US-Neural2-D", ja: "ja-JP-Neural2-C", fr: "fr-FR-Neural2-B", ko: "ko-KR-Neural2-C", es: "es-ES-Neural2-B", zh: "cmn-TW-Wavenet-B" },
    blurb: "男聲。穩、不催促。",
  },
  {
    id: "owen", gender: "m", name: "Owen", style: "清楚穩健", preferred: "Neural2-J", pitch: 0.97, voiceIndex: 1,
    voices: { en: "en-US-Neural2-J", ja: "ja-JP-Neural2-D", fr: "fr-FR-Neural2-D", ko: "ko-KR-Wavenet-C", es: "es-ES-Neural2-D", zh: "cmn-TW-Standard-B" },
    blurb: "男聲。中氣足、適合跟讀。",
  },
  {
    id: "kai", gender: "m", name: "Kai", style: "年輕有力", preferred: "Neural2-A", pitch: 1.04, voiceIndex: 2,
    voices: { en: "en-US-Neural2-A", ja: "ja-JP-Wavenet-C", fr: "fr-FR-Wavenet-B", ko: "ko-KR-Wavenet-D", es: "es-ES-Wavenet-B", zh: "cmn-CN-Wavenet-C" },
    blurb: "男聲。比較年輕、節奏清楚。",
  },
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

export const GREETS = {
  en: [
    { text: "Hi. How was your morning?", zh: "嗨。你今天早上過得怎麼樣？" },
    { text: "Hey. Did you get a chance to rest yesterday?", zh: "嘿。你昨天有休息到嗎？" },
    { text: "Good to see you. What are you working on today?", zh: "很高興見到你。你今天在忙什麼？" },
    { text: "Hi there. Have you eaten yet?", zh: "嗨。你吃過了嗎？" },
    { text: "Hello. How was the commute?", zh: "你好。通勤還順利嗎？" },
    { text: "Hi. Anything small that went well today?", zh: "嗨。今天有什麼小事順利嗎？" },
  ],
  ja: [
    { text: "こんにちは。今朝はどんな感じでしたか？", zh: "你好。你今天早上過得怎麼樣？" },
    { text: "やあ。昨日は休めましたか？", zh: "嘿。你昨天有休息到嗎？" },
    { text: "こんにちは。今日は何をしていますか？", zh: "你好。你今天在做什麼？" },
    { text: "こんにちは。もうご飯は食べましたか？", zh: "你好。你吃過了嗎？" },
  ],
  fr: [
    { text: "Salut. Comment s'est passee ta matinee ?", zh: "嗨。你今天早上過得怎麼樣？" },
    { text: "Coucou. Tu as pu te reposer hier ?", zh: "嘿。你昨天有休息到嗎？" },
    { text: "Bonjour. Qu'est-ce que tu fais aujourd'hui ?", zh: "你好。你今天在做什麼？" },
    { text: "Salut. Tu as deja mange ?", zh: "嗨。你吃過了嗎？" },
  ],
  ko: [
    { text: "안녕. 오늘 아침은 어땠어요?", zh: "嗨。你今天早上過得怎麼樣？" },
    { text: "안녕. 어제 좀 쉬었어요?", zh: "嘿。你昨天有休息到嗎？" },
    { text: "안녕하세요. 오늘은 뭐 하고 있어요?", zh: "你好。你今天在做什麼？" },
    { text: "안녕. 밥은 먹었어요?", zh: "嗨。你吃過了嗎？" },
  ],
  es: [
    { text: "Hola. Que tal te fue esta manana?", zh: "嗨。你今天早上過得怎麼樣？" },
    { text: "Hola. Pudiste descansar ayer?", zh: "嘿。你昨天有休息到嗎？" },
    { text: "Hola. En que trabajas hoy?", zh: "你好。你今天在忙什麼？" },
    { text: "Hola. Ya comiste?", zh: "嗨。你吃過了嗎？" },
  ],
  zh: [
    { text: "嗨。你今天早上過得怎麼樣？", zh: "Hi. How was your morning?" },
    { text: "嘿。你昨天有休息到嗎？", zh: "Hey. Did you get a chance to rest yesterday?" },
    { text: "你好。你今天在忙什麼？", zh: "Hello. What are you working on today?" },
    { text: "嗨。你吃過了嗎？", zh: "Hi. Have you eaten yet?" },
  ],
};

export const GREET = Object.fromEntries(
  Object.entries(GREETS).map(([code, list]) => [code, list[0]]),
);

export function greetOf(code) {
  const pool = GREETS[code] || GREETS.en;
  return pool[Math.floor(Math.random() * pool.length)];
}

export const VOCAB = {
  en: [
    { word: "deadline", hint: "最後期限", sentence: "The deadline is tonight.", sentence_zh: "期限是今晚。" },
    { word: "negotiate", hint: "談判", sentence: "We need to negotiate the terms.", sentence_zh: "我們必須談判條件。" },
    { word: "reliable", hint: "可靠的", sentence: "She is a reliable colleague.", sentence_zh: "她是可靠的同事。" },
    { word: "receipt", hint: "收據", sentence: "Could I have a receipt, please?", sentence_zh: "可以給我收據嗎？" },
    { word: "appointment", hint: "預約", sentence: "I have a dentist appointment at three.", sentence_zh: "我三點有牙醫預約。" },
    { word: "commute", hint: "通勤", sentence: "My commute takes about forty minutes.", sentence_zh: "我通勤大概要四十分鐘。" },
    { word: "refund", hint: "退款", sentence: "I would like a refund for this jacket.", sentence_zh: "這件外套我想退款。" },
    { word: "allergy", hint: "過敏", sentence: "I have a peanut allergy.", sentence_zh: "我對花生過敏。" },
    { word: "postpone", hint: "延期", sentence: "Can we postpone the meeting until Friday?", sentence_zh: "會議可以延到星期五嗎？" },
    { word: "convenient", hint: "方便的", sentence: "Is this time convenient for you?", sentence_zh: "這個時間對你方便嗎？" },
    { word: "warranty", hint: "保固", sentence: "Please keep the receipt for the warranty.", sentence_zh: "請保留收據以利保固。" },
    { word: "crowded", hint: "擁擠的", sentence: "The train is crowded after six.", sentence_zh: "六點後火車很擠。" },
  ],
  zh: [
    { word: "期限", hint: "deadline", sentence: "這份報告的期限是今晚。", sentence_zh: "The deadline for this report is tonight." },
    { word: "交涉", hint: "negotiate", sentence: "我們必須交涉條件。", sentence_zh: "We must negotiate the terms." },
    { word: "可靠", hint: "reliable", sentence: "她是可靠的同事。", sentence_zh: "She is a reliable colleague." },
    { word: "收據", hint: "receipt", sentence: "可以給我收據嗎？", sentence_zh: "Could I have a receipt, please?" },
    { word: "預約", hint: "appointment", sentence: "我三點有牙醫預約。", sentence_zh: "I have a dentist appointment at three." },
    { word: "通勤", hint: "commute", sentence: "我通勤大概要四十分鐘。", sentence_zh: "My commute takes about forty minutes." },
    { word: "退款", hint: "refund", sentence: "這件外套我想退款。", sentence_zh: "I would like a refund for this jacket." },
    { word: "過敏", hint: "allergy", sentence: "我對花生過敏。", sentence_zh: "I have a peanut allergy." },
  ],
  ja: [
    { word: "締切", hint: "最後期限", sentence: "締切は今夜です。", sentence_zh: "期限是今晚。" },
    { word: "交渉", hint: "談判", sentence: "条件を交渉する必要がある。", sentence_zh: "必須談判條件。" },
    { word: "信頼", hint: "可靠", sentence: "彼女は信頼できる同僚です。", sentence_zh: "她是可靠的同事。" },
    { word: "領収書", hint: "收據", sentence: "領収書をもらえますか。", sentence_zh: "可以給我收據嗎？" },
    { word: "予約", hint: "預約", sentence: "三時に歯医者の予約があります。", sentence_zh: "我三點有牙醫預約。" },
    { word: "通勤", hint: "通勤", sentence: "通勤は四十分ほどかかります。", sentence_zh: "通勤大概要四十分鐘。" },
  ],
  fr: [
    { word: "delai", hint: "期限", sentence: "Le delai est ce soir.", sentence_zh: "期限是今晚。" },
    { word: "negocier", hint: "談判", sentence: "Il faut negocier les termes.", sentence_zh: "必須談判條件。" },
    { word: "fiable", hint: "可靠", sentence: "Elle est une collegue fiable.", sentence_zh: "她是可靠的同事。" },
    { word: "recu", hint: "收據", sentence: "Je peux avoir un recu, s'il vous plait ?", sentence_zh: "可以給我收據嗎？" },
    { word: "rendez-vous", hint: "預約", sentence: "J'ai un rendez-vous chez le dentiste a quinze heures.", sentence_zh: "我三點有牙醫預約。" },
    { word: "trajet", hint: "通勤", sentence: "Le trajet dure environ quarante minutes.", sentence_zh: "通勤大概要四十分鐘。" },
  ],
  ko: [
    { word: "마감", hint: "最後期限", sentence: "마감은 오늘 밤입니다.", sentence_zh: "期限是今晚。" },
    { word: "협상", hint: "談判", sentence: "조건을 협상해야 합니다.", sentence_zh: "必須談判條件。" },
    { word: "신뢰", hint: "可靠", sentence: "그녀는 신뢰할 수 있는 동료입니다.", sentence_zh: "她是可靠的同事。" },
    { word: "영수증", hint: "收據", sentence: "영수증 받을 수 있을까요?", sentence_zh: "可以給我收據嗎？" },
    { word: "예약", hint: "預約", sentence: "세 시에 치과 예약이 있어요.", sentence_zh: "我三點有牙醫預約。" },
    { word: "출퇴근", hint: "通勤", sentence: "출퇴근에 사십 분쯤 걸려요.", sentence_zh: "通勤大概要四十分鐘。" },
  ],
  es: [
    { word: "plazo", hint: "期限", sentence: "El plazo es esta noche.", sentence_zh: "期限是今晚。" },
    { word: "negociar", hint: "談判", sentence: "Hay que negociar los terminos.", sentence_zh: "必須談判條件。" },
    { word: "fiable", hint: "可靠", sentence: "Ella es una colega fiable.", sentence_zh: "她是可靠的同事。" },
    { word: "recibo", hint: "收據", sentence: "Me puede dar un recibo, por favor?", sentence_zh: "可以給我收據嗎？" },
    { word: "cita", hint: "預約", sentence: "Tengo una cita con el dentista a las tres.", sentence_zh: "我三點有牙醫預約。" },
    { word: "trayecto", hint: "通勤", sentence: "El trayecto dura unos cuarenta minutos.", sentence_zh: "通勤大概要四十分鐘。" },
  ],
};

export const EXAMPLES = {
  en: [
    { sentence: "Could you speak a little slower, please?", sentence_zh: "可以請你說慢一點嗎？" },
    { sentence: "I'll take this one, and pay by card.", sentence_zh: "我要這個，用卡付。" },
    { sentence: "Sorry I'm late. The train was delayed.", sentence_zh: "抱歉遲到。火車誤點了。" },
    { sentence: "Is there a quieter table near the window?", sentence_zh: "靠近窗戶有沒有安靜一點的位子？" },
    { sentence: "I can join the call after lunch.", sentence_zh: "午餐後我可以進線上會議。" },
    { sentence: "Does this come with rice or salad?", sentence_zh: "這個是配飯還是沙拉？" },
    { sentence: "Let me check my calendar and get back to you.", sentence_zh: "我先看行事曆，再回你。" },
    { sentence: "The pharmacy is next to the convenience store.", sentence_zh: "藥局在便利商店旁邊。" },
  ],
  zh: [
    { sentence: "可以請你說慢一點嗎？", sentence_zh: "Could you speak a little slower, please?" },
    { sentence: "我要這個，用卡付。", sentence_zh: "I'll take this one, and pay by card." },
    { sentence: "抱歉遲到。火車誤點了。", sentence_zh: "Sorry I'm late. The train was delayed." },
    { sentence: "靠近窗戶有沒有安靜一點的位子？", sentence_zh: "Is there a quieter table near the window?" },
    { sentence: "午餐後我可以進線上會議。", sentence_zh: "I can join the call after lunch." },
  ],
  ja: [
    { sentence: "もう少しゆっくり話してもらえますか。", sentence_zh: "可以請你說慢一點嗎？" },
    { sentence: "これにします。カードで払います。", sentence_zh: "我要這個，用卡付。" },
    { sentence: "遅れてすみません。電車が遅れました。", sentence_zh: "抱歉遲到。電車誤點了。" },
    { sentence: "窓際の静かな席はありますか。", sentence_zh: "靠近窗戶有沒有安靜一點的位子？" },
  ],
  fr: [
    { sentence: "Vous pouvez parler un peu plus lentement ?", sentence_zh: "可以請你說慢一點嗎？" },
    { sentence: "Je prends celui-ci, et je paie par carte.", sentence_zh: "我要這個，用卡付。" },
    { sentence: "Desole du retard. Le train avait du retard.", sentence_zh: "抱歉遲到。火車誤點了。" },
    { sentence: "Y a-t-il une table plus calme pres de la fenetre ?", sentence_zh: "靠近窗戶有沒有安靜一點的位子？" },
  ],
  ko: [
    { sentence: "조금만 천천히 말해 줄 수 있어요?", sentence_zh: "可以請你說慢一點嗎？" },
    { sentence: "이걸로 할게요. 카드로 할게요.", sentence_zh: "我要這個，用卡付。" },
    { sentence: "늦어서 미안해요. 기차가 지연됐어요.", sentence_zh: "抱歉遲到。火車誤點了。" },
    { sentence: "창가 쪽에 더 조용한 자리 있어요?", sentence_zh: "靠近窗戶有沒有安靜一點的位子？" },
  ],
  es: [
    { sentence: "Puedes hablar un poco mas despacio, por favor?", sentence_zh: "可以請你說慢一點嗎？" },
    { sentence: "Me llevo este, y pago con tarjeta.", sentence_zh: "我要這個，用卡付。" },
    { sentence: "Perdona el retraso. El tren llego tarde.", sentence_zh: "抱歉遲到。火車誤點了。" },
    { sentence: "Hay una mesa mas tranquila cerca de la ventana?", sentence_zh: "靠近窗戶有沒有安靜一點的位子？" },
  ],
};

export const SCENES = {
  en: [
    { title: "Airport gate", title_zh: "登機門", prompt: "You missed a connection. Ask for the next flight.", prompt_zh: "你沒趕上轉機。詢問下一班飛機。" },
    { title: "Cafe order", title_zh: "咖啡廳點餐", prompt: "Order a drink and mention you have a milk allergy.", prompt_zh: "點一杯飲料，並說明你對牛奶過敏。" },
    { title: "Late to work", title_zh: "上班遲到", prompt: "You are ten minutes late. Explain and offer a plan.", prompt_zh: "你遲到十分鐘。解釋一下，並提出補救。" },
    { title: "Clinic desk", title_zh: "診所櫃台", prompt: "Book a follow-up visit for next Wednesday afternoon.", prompt_zh: "預約下週三下午回診。" },
    { title: "Phone shop", title_zh: "手機行", prompt: "Your screen is cracked. Ask about repair time and cost.", prompt_zh: "螢幕裂了。詢問維修時間與費用。" },
    { title: "Hotel check-in", title_zh: "飯店入住", prompt: "The booking is under another name. Ask them to look it up.", prompt_zh: "訂單在別人的名字下。請對方幫忙查。" },
    { title: "Neighborhood help", title_zh: "問路", prompt: "Ask how to get to the nearest MRT station on foot.", prompt_zh: "問路人怎麼走到最近的捷運站。" },
    { title: "Team meeting", title_zh: "小組會議", prompt: "You disagree politely. Suggest a smaller first step.", prompt_zh: "你客氣地不同意。建議先做小一步。" },
  ],
  zh: [
    { title: "海關", title_zh: "Customs", prompt: "你被要求說明旅行目的。清楚回答。", prompt_zh: "You are asked to state the purpose of travel. Answer clearly." },
    { title: "咖啡廳", title_zh: "Cafe", prompt: "點一杯熱美式，並說你對牛奶過敏。", prompt_zh: "Order an Americano and mention a milk allergy." },
    { title: "診所", title_zh: "Clinic", prompt: "預約下週三下午回診。", prompt_zh: "Book a follow-up for next Wednesday afternoon." },
    { title: "捷運問路", title_zh: "Directions", prompt: "請問最近的捷運站怎麼走。", prompt_zh: "Ask how to walk to the nearest MRT station." },
  ],
  ja: [
    { title: "駅の窓口", title_zh: "車站窗口", prompt: "乗り過ごした。次の案内を頼む。", prompt_zh: "你坐過站了。請對方告訴你下一班。" },
    { title: "カフェ", title_zh: "咖啡廳", prompt: "ミルクアレルギーがある。メニューを確認する。", prompt_zh: "你對牛奶過敏。確認菜單。" },
    { title: "病院", title_zh: "醫院", prompt: "来週の水曜日の午後で再診を予約する。", prompt_zh: "預約下週三下午回診。" },
    { title: "道を聞く", title_zh: "問路", prompt: "一番近い駅までの行き方を聞く。", prompt_zh: "問最近車站怎麼走。" },
  ],
  fr: [
    { title: "Hotel", title_zh: "飯店", prompt: "La reservation a disparu. Recupere la chambre.", prompt_zh: "訂單不見了。把房間要回來。" },
    { title: "Cafe", title_zh: "咖啡廳", prompt: "Commande une boisson et dis que tu es allergique au lait.", prompt_zh: "點飲料並說明對牛奶過敏。" },
    { title: "Cabinet", title_zh: "診所", prompt: "Prends un rendez-vous mercredi apres-midi.", prompt_zh: "預約週三下午。" },
    { title: "Metro", title_zh: "地鐵", prompt: "Demande le chemin jusqu'a la station la plus proche.", prompt_zh: "問最近車站怎麼走。" },
  ],
  ko: [
    { title: "카페 주문", title_zh: "咖啡廳點餐", prompt: "알레르기가 있다. 메뉴를 확인하라.", prompt_zh: "你有過敏。確認菜單。" },
    { title: "병원", title_zh: "醫院", prompt: "다음 주 수요일 오후에 재진 예약을 하라.", prompt_zh: "預約下週三下午回診。" },
    { title: "길 묻기", title_zh: "問路", prompt: "가장 가까운 지하철역 가는 길을 물어라.", prompt_zh: "問最近地鐵站怎麼走。" },
    { title: "회의", title_zh: "會議", prompt: "정중히 반대하고 작은 다음 단계를 제안하라.", prompt_zh: "客氣地反對，並建議小一步。" },
  ],
  es: [
    { title: "Oficina", title_zh: "辦公室", prompt: "Llegas tarde. Explica y propone una solucion.", prompt_zh: "你遲到了。解釋並提出解法。" },
    { title: "Cafe", title_zh: "咖啡廳", prompt: "Pide una bebida y di que tienes alergia a la leche.", prompt_zh: "點飲料並說明對牛奶過敏。" },
    { title: "Clinica", title_zh: "診所", prompt: "Pide una cita para el miercoles por la tarde.", prompt_zh: "預約週三下午。" },
    { title: "Direcciones", title_zh: "問路", prompt: "Pregunta como ir a la estacion mas cercana.", prompt_zh: "問最近車站怎麼走。" },
  ],
};

export const EXAMS = {
  en: {
    board: "IELTS / TOEIC 風格",
    items: [
      { q: "The report must be filed _____ Friday.", q_zh: "這份報告最晚要在週五前_____。", options: ["until", "by", "since", "at"], options_zh: ["直到", "在…之前", "自從", "在（時刻）"], a: 1 },
      { q: "She has been in the sector _____ 2019.", q_zh: "她從 2019 年起就在這個領域。", options: ["for", "since", "during", "by"], options_zh: ["為期", "自從", "在…期間", "在…之前"], a: 1 },
      { q: "If I _____ more time, I would join you.", q_zh: "如果我_____更多時間，就會跟你去。", options: ["have", "had", "has", "having"], options_zh: ["有（現在）", "有（假設）", "有（第三人稱）", "正在有"], a: 1 },
      { q: "There isn't _____ milk left.", q_zh: "牛奶_____了。", options: ["some", "many", "much", "few"], options_zh: ["一些", "許多（可數）", "許多（不可數）", "很少（可數）"], a: 2 },
      { q: "I look forward _____ from you.", q_zh: "我期待_____你的回音。", options: ["to hear", "hearing", "to hearing", "hear"], options_zh: ["聽到", "聽到（動名詞）", "to + 動名詞", "聽"], a: 2 },
      { q: "The meeting was put _____ until Monday.", q_zh: "會議被_____到星期一。", options: ["off", "on", "up", "in"], options_zh: ["延期", "穿上", "舉起", "進入"], a: 0 },
      { q: "He is used _____ early.", q_zh: "他習慣_____早起。", options: ["to get", "to getting", "get", "getting"], options_zh: ["去起床", "習慣於 + 動名詞", "起床", "正在起床"], a: 1 },
      { q: "Neither of the answers _____ correct.", q_zh: "兩個答案_____都不對。", options: ["is", "are", "be", "were"], options_zh: ["是（單數）", "是（複數）", "原形", "過去複數"], a: 0 },
    ],
  },
  zh: {
    board: "TOCFL 風格",
    items: [
      { q: "這份合約最晚要在週五前_____。", q_zh: "This contract must be _____ by Friday.", options: ["簽署", "散步", "遲到", "關閉燈光"], options_zh: ["signed", "take a walk", "be late", "turn off the lights"], a: 0 },
      { q: "他對流程非常_____。", q_zh: "He is very _____ with the process.", options: ["陌生", "熟悉", "遙遠", "空白"], options_zh: ["unfamiliar", "familiar", "distant", "blank"], a: 1 },
      { q: "請把窗戶_____一點。", q_zh: "Please _____ the window a bit.", options: ["打開", "打開了", "打開過", "打開著"], options_zh: ["open", "opened", "have opened", "is opening"], a: 0 },
      { q: "這家店的咖啡_____好喝。", q_zh: "The coffee here is _____ good.", options: ["很", "太不", "沒有", "正在"], options_zh: ["very", "not too", "without", "in the middle of"], a: 0 },
    ],
  },
  ja: {
    board: "JLPT 風格",
    items: [
      { q: "この書類は金曜日までに（　）。", q_zh: "這份文件請在週五前（　）。", options: ["出します", "出してください", "出しましょうか", "出ています"], options_zh: ["我會交", "請交", "要交嗎", "已經交了"], a: 1 },
      { q: "電車が遅れた（　）、会議に間に合わなかった。", q_zh: "電車誤點（　），沒趕上會議。", options: ["ので", "のに", "ても", "だけ"], options_zh: ["因為", "雖然", "即使", "只有"], a: 0 },
      { q: "もう少し（　）話してください。", q_zh: "請再說（　）一點。", options: ["ゆっくり", "たぶん", "しっかり", "ほとんど"], options_zh: ["慢慢地", "大概", "好好地", "幾乎"], a: 0 },
    ],
  },
  fr: {
    board: "DELF 風格",
    items: [
      { q: "Je dois envoyer le dossier _____ lundi.", q_zh: "我必須在週一_____把檔案寄出。", options: ["avant", "depuis", "pendant", "sans"], options_zh: ["在…之前", "自從", "在…期間", "沒有"], a: 0 },
      { q: "Elle _____ au bureau depuis 9 heures.", q_zh: "她從九點起就_____在辦公室。", options: ["est", "a", "va", "fait"], options_zh: ["是／在", "有", "去", "做"], a: 0 },
      { q: "Pouvez-vous parler plus _____ ?", q_zh: "可以請你說更_____嗎？", options: ["lentement", "souvent", "jamais", "beaucoup"], options_zh: ["慢", "常", "從不", "很多"], a: 0 },
    ],
  },
  ko: {
    board: "TOPIK 風格",
    items: [
      { q: "보고서를 금요일까지 ( ).", q_zh: "報告請在週五前（ ）。", options: ["제출하세요", "제출입니다", "제출하고", "제출의"], options_zh: ["請提交", "是提交", "提交然後", "提交的"], a: 0 },
      { q: "조금만 더 ( ) 말해 주세요.", q_zh: "請再說（ ）一點。", options: ["천천히", "갑자기", "이미", "전혀"], options_zh: ["慢慢地", "突然", "已經", "完全不"], a: 0 },
      { q: "약속이 있어서 먼저 ( ).", q_zh: "我有約，先（ ）。", options: ["가 볼게요", "가는 중입니다", "가십시오", "갔습니다"], options_zh: ["我先走", "正在走", "請走", "已經走了"], a: 0 },
    ],
  },
  es: {
    board: "DELE 風格",
    items: [
      { q: "El informe debe estar listo _____ el viernes.", q_zh: "報告必須在週五_____準備好。", options: ["para", "desde", "sin", "entre"], options_zh: ["在…之前", "自從", "沒有", "在…之間"], a: 0 },
      { q: "Puedes hablar mas _____ ?", q_zh: "可以說更_____嗎？", options: ["despacio", "nunca", "ayer", "mucho"], options_zh: ["慢", "從不", "昨天", "很多"], a: 0 },
      { q: "Llevo dos anos _____ aqui.", q_zh: "我在這裡已經兩年_____。", options: ["viviendo", "vivo", "vivi", "vivir"], options_zh: ["住著", "我住", "住了", "住（原形）"], a: 0 },
    ],
  },
};

export const PASSAGES = {
  en: [
    { title: "Night Drive", title_zh: "夜車", scene: "rain", hook_zh: "雨夜裡的陌生人", sentences: [
      { text: "The wipers dragged rain across the glass.", zh: "雨刷把雨水從玻璃上拉開。" },
      { text: "She accepted a ride from a quiet stranger.", zh: "她上了一個寡言陌生人的車。" },
      { text: "He smiled and talked about his ordinary life.", zh: "他微笑著，談起自己平凡的生活。" },
      { text: "Then she reached for the door and froze.", zh: "接著她去拉車門，整個人愣住了。" },
    ]},
    { title: "Saturday Market", title_zh: "週六市集", scene: "market", hook_zh: "雨前的芒果", sentences: [
      { text: "The fruit stall opened before the rain.", zh: "水果攤在下雨前就開了。" },
      { text: "I asked for two mangoes that were not too soft.", zh: "我要了兩顆不要太軟的芒果。" },
      { text: "She weighed them and rounded the price down.", zh: "她秤完，把價錢往下取整。" },
      { text: "I paid by card and put the bag on my shoulder.", zh: "我用卡付帳，把袋子掛上肩。" },
    ]},
    { title: "After Lunch", title_zh: "午餐之後", scene: "office", hook_zh: "會議拖太久了", sentences: [
      { text: "The meeting ran long, so we skipped dessert.", zh: "會議拖太久，我們沒吃甜點。" },
      { text: "I walked around the block to clear my head.", zh: "我繞了街區一圈，讓腦袋清醒。" },
      { text: "When I got back, the slides were already open.", zh: "我回來時，投影片已經打開了。" },
    ]},
    { title: "Rainy Commute", title_zh: "下雨通勤", scene: "commute", hook_zh: "差半分鐘的公車", sentences: [
      { text: "I missed the first bus by half a minute.", zh: "我差半分鐘沒搭上第一班公車。" },
      { text: "The next one was packed, but a seat opened at the third stop.", zh: "下一班很擠，但第三站空出一個位子。" },
      { text: "I messaged the team that I would be ten minutes late.", zh: "我傳訊跟小組說我會晚十分鐘。" },
    ]},
    { title: "Corner Cafe", title_zh: "轉角咖啡", scene: "cafe", hook_zh: "窗邊那杯美式", sentences: [
      { text: "The cafe was quiet except for the espresso machine.", zh: "咖啡廳很安靜，只剩義式咖啡機的聲音。" },
      { text: "I asked for an Americano and a seat by the window.", zh: "我點了美式，還要靠窗的位子。" },
      { text: "Rain started, and the street lights came on early.", zh: "開始下雨，路燈提早亮了。" },
      { text: "I opened my notes and tried the first sentence aloud.", zh: "我打開筆記，把第一句大聲唸出來。" },
    ]},
  ],
  zh: [
    { title: "夜車", title_zh: "Night Drive", scene: "rain", hook_zh: "雨夜裡的陌生人", sentences: [
      { text: "雨刷把雨水從玻璃上拉開。", zh: "The wipers dragged rain across the glass." },
      { text: "她上了一個寡言陌生人的車。", zh: "She accepted a ride from a quiet stranger." },
    ]},
    { title: "週六市場", title_zh: "Saturday Market", scene: "market", hook_zh: "雨前的芒果", sentences: [
      { text: "水果攤在下雨前就開了。", zh: "The fruit stall opened before the rain." },
      { text: "我要了兩顆不要太軟的芒果。", zh: "I asked for two mangoes that were not too soft." },
    ]},
  ],
  ja: [
    { title: "夜の車", title_zh: "夜車", scene: "rain", hook_zh: "雨夜的車窗", sentences: [
      { text: "ワイパーがガラスの雨を払った。", zh: "雨刷把玻璃上的雨拉開。" },
      { text: "彼女は寡黙な見知らぬ人の車に乗った。", zh: "她上了一個寡言陌生人的車。" },
    ]},
    { title: "土曜の市場", title_zh: "週六市集", scene: "market", hook_zh: "雨前的水果攤", sentences: [
      { text: "雨の前に果物屋が開いた。", zh: "下雨前水果攤就開了。" },
      { text: "柔らかすぎないマンゴーを二つ頼んだ。", zh: "我要了兩顆不要太軟的芒果。" },
    ]},
  ],
  fr: [
    { title: "Nuit sous la pluie", title_zh: "雨夜", scene: "rain", hook_zh: "雨夜的車程", sentences: [
      { text: "Les essuie-glaces tiraient la pluie sur la vitre.", zh: "雨刷把雨水從玻璃上拉開。" },
    ]},
    { title: "Marche du samedi", title_zh: "週六市集", scene: "market", hook_zh: "雨前的攤位", sentences: [
      { text: "Le stand de fruits a ouvert avant la pluie.", zh: "水果攤在下雨前就開了。" },
    ]},
  ],
  ko: [
    { title: "밤 운전", title_zh: "夜車", scene: "rain", hook_zh: "雨夜的車窗", sentences: [
      { text: "와이퍼가 유리의 비를 밀어냈다.", zh: "雨刷把玻璃上的雨拉開。" },
    ]},
    { title: "토요일 시장", title_zh: "週六市集", scene: "market", hook_zh: "雨前的水果攤", sentences: [
      { text: "비가 오기 전에 과일 가게가 열렸다.", zh: "下雨前水果攤就開了。" },
    ]},
  ],
  es: [
    { title: "Noche de lluvia", title_zh: "雨夜", scene: "rain", hook_zh: "雨夜的車程", sentences: [
      { text: "Los limpiaparabrisas arrastraban la lluvia en el cristal.", zh: "雨刷把雨水從玻璃上拉開。" },
    ]},
    { title: "Mercado del sabado", title_zh: "週六市集", scene: "market", hook_zh: "雨前的攤位", sentences: [
      { text: "El puesto de fruta abrio antes de la lluvia.", zh: "水果攤在下雨前就開了。" },
    ]},
  ],
};

export function examBoard(code) {
  return (EXAMS[code] || EXAMS.en).board;
}

export function fallbackPassage(code) {
  const pool = PASSAGES[code] || PASSAGES.en;
  const list = Array.isArray(pool) ? pool : [pool];
  return list[Math.floor(Math.random() * list.length)];
}

export function previewPassage(code) {
  const pool = PASSAGES[code] || PASSAGES.en;
  const list = Array.isArray(pool) ? pool : [pool];
  return list[0];
}

