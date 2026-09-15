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
    tag: "ECHO, THEN SPEAK. · 先聽，再說。",
    tagShort: "ECHO, THEN SPEAK.",
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
    install: "加入主畫面",
    installHint: "加入主畫面後可像 App 一樣開啟。iPhone 請用 Safari 分享選單裡的「加入主畫面」。",
    voiceQuota: "雲端語音額度已用完，改用裝置語音。",
    replay: "重播這句",
    loop: "循環",
    playAll: "全文朗讀",
    fromHere: "從這裡聽",
    stop: "停止",
    saves: "收藏",
    savesHint: "目前存在這台裝置裡，重整後還在；尚未同步到伺服器。",
    savesEmpty: "還沒有收藏的短文。",
    save: "收藏",
    saved: "已收藏",
    remove: "移除",
    newPassage: "換一篇",
    hideZh: "隱藏中文",
    showZh: "顯示中文",
    slow: "慢",
    normal: "正常",
    fast: "快",
    female: "女聲",
    male: "男聲",
    deviceVoice: "裝置語音",
    autoVoice: "自動（依 Audrey／Brad）",
    pitch: "音調微調",
    voiceSub: "已用替代語音。這台裝置沒有對應的 Audrey／Brad 聲線。",
    genFallback: "生成失敗，改用備用短文。",
    weekScore: "本週積分",
    scoreHow: "積分怎麼算",
    freq: "頻率",
    dur: "時長",
    div: "多元性",
    streak: "連續天數",
    friends: "好友排名（示意）",
    friendsHint: "正式版改接雙方同意的朋友清單，不做公開陌生人排行。",
    you: "你",
  },
  en: {
    tag: "ECHO, THEN SPEAK.",
    tagShort: "ECHO, THEN SPEAK.",
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
    install: "Add to Home Screen",
    installHint: "Install ECHOO like an app. On iPhone use Safari Share, then Add to Home Screen.",
    voiceQuota: "Cloud voice quota is used up. Playing on this device.",
    replay: "Replay sentence",
    loop: "Loop",
    playAll: "Play all",
    fromHere: "Play from here",
    stop: "Stop",
    saves: "Saved",
    savesHint: "Stored on this device for now. Not yet synced to the server.",
    savesEmpty: "No saved passages yet.",
    save: "Save",
    saved: "Saved",
    remove: "Remove",
    newPassage: "New passage",
    hideZh: "Hide Chinese",
    showZh: "Show Chinese",
    slow: "Slow",
    normal: "Normal",
    fast: "Fast",
    female: "Female",
    male: "Male",
    deviceVoice: "Device voice",
    autoVoice: "Auto (Audrey / Brad)",
    pitch: "Pitch trim",
    voiceSub: "Using a substitute voice. This device has no matching Audrey/Brad voice.",
    genFallback: "Generation failed. Using a backup passage.",
    weekScore: "Weekly score",
    scoreHow: "How scoring works",
    freq: "Frequency",
    dur: "Duration",
    div: "Variety",
    streak: "Streak",
    friends: "Friends (sample)",
    friendsHint: "Production should use an opt-in friends list, not a public stranger board.",
    you: "you",
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
