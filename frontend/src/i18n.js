export const UI_LANGS = [
  { id: "zh", label: "繁體中文" },
  { id: "en", label: "English" },
  { id: "ja", label: "日本語" },
  { id: "ko", label: "한국어" },
  { id: "fr", label: "Français" },
  { id: "es", label: "Español" },
];

const dict = {
  zh: {
    tag: "ECHOO // NET TUTOR",
    login: "登入節點",
    register: "建立代號",
    username: "使用者代號",
    password: "通行碼",
    enter: "連線",
    create: "註冊",
    needAccount: "還沒有代號？註冊",
    haveAccount: "已有代號？登入",
    logout: "斷線",
    admin: "最高權限",
    chat: "對話",
    read: "朗讀",
    vocab: "單字",
    examples: "例句",
    scenes: "情境",
    exams: "測驗",
    board: "排行",
    settings: "設定",
    locked: "未解鎖",
    xp: "積分",
    unlockHint: "累積積分解鎖模組與題庫",
    startChat: "開始鏈路",
    reading: "朗讀通道",
    review: "單字複習",
    drill: "例句練習",
    scene: "情境模擬",
    exam: "機構測驗",
    users: "節點名單",
    voiceEngine: "聲線引擎",
    device: "裝置內建",
    cloud: "雲端合成",
    uiLang: "介面語言",
    learnLang: "學習語言",
    tutor: "聲音導師",
    level: "程度",
    send: "傳送",
    listen: "試聽",
    next: "下一題",
    check: "核對",
    correct: "正確",
    wrong: "再試",
    reveal: "顯示解答",
    install: "安裝到主畫面",
  },
  en: {
    tag: "ECHOO // NET TUTOR",
    login: "JACK IN",
    register: "NEW HANDLE",
    username: "Handle",
    password: "Passcode",
    enter: "Connect",
    create: "Register",
    needAccount: "No handle? Register",
    haveAccount: "Have a handle? Login",
    logout: "Jack out",
    admin: "ROOT",
    chat: "Chat",
    read: "Read",
    vocab: "Vocab",
    examples: "Lines",
    scenes: "Scenes",
    exams: "Exams",
    board: "Board",
    settings: "Config",
    locked: "LOCKED",
    xp: "XP",
    unlockHint: "Earn XP to unlock modules and banks",
    startChat: "Open channel",
    reading: "Read channel",
    review: "Vocab drill",
    drill: "Example drill",
    scene: "Sim",
    exam: "Board exams",
    users: "Nodes",
    voiceEngine: "Voice engine",
    device: "Device",
    cloud: "Cloud synth",
    uiLang: "UI language",
    learnLang: "Target language",
    tutor: "Voice tutor",
    level: "Band",
    send: "Send",
    listen: "Play",
    next: "Next",
    check: "Check",
    correct: "Clear",
    wrong: "Retry",
    reveal: "Reveal",
    install: "Install app",
  },
};

["ja", "ko", "fr", "es"].forEach((id) => {
  dict[id] = { ...dict.en };
});

dict.ja.login = "ログイン";
dict.ja.register = "新規";
dict.ja.chat = "会話";
dict.ja.read = "音読";
dict.ja.vocab = "単語";
dict.ja.examples = "例文";
dict.ja.scenes = "場面";
dict.ja.exams = "試験";
dict.ja.settings = "設定";
dict.ja.logout = "切断";
dict.ko.login = "로그인";
dict.ko.chat = "대화";
dict.ko.read = "낭독";
dict.ko.vocab = "단어";
dict.ko.exams = "시험";
dict.fr.login = "Connexion";
dict.fr.chat = "Dialogue";
dict.fr.read = "Lecture";
dict.fr.vocab = "Lexique";
dict.fr.exams = "Examens";
dict.es.login = "Entrar";
dict.es.chat = "Dialogo";
dict.es.read = "Lectura";
dict.es.vocab = "Vocabulario";
dict.es.exams = "Examenes";

export function t(ui, key) {
  return (dict[ui] && dict[ui][key]) || dict.zh[key] || key;
}
