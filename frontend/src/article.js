import { LEVELS } from "./content.js";
import { examAnswerIndex, pickSimilar } from "./quiz.js";
import { pickFresh } from "./vary.js";

export const ARTICLE_BANDS = {
  Bridge: { min: 40, max: 70, cjkMin: 70, cjkMax: 120, questions: 2, sentences: "3-5" },
  A2: { min: 70, max: 110, cjkMin: 110, cjkMax: 180, questions: 2, sentences: "4-6" },
  B1: { min: 110, max: 160, cjkMin: 180, cjkMax: 280, questions: 3, sentences: "5-8" },
  B2: { min: 160, max: 210, cjkMin: 260, cjkMax: 360, questions: 3, sentences: "6-9" },
  C1: { min: 210, max: 280, cjkMin: 360, cjkMax: 500, questions: 3, sentences: "7-11" },
  C2: { min: 250, max: 340, cjkMin: 450, cjkMax: 620, questions: 3, sentences: "8-12" },
};

export function articleBand(levelId) {
  return ARTICLE_BANDS[levelId] || ARTICLE_BANDS.B1;
}

export function countWords(text, code = "en") {
  const raw = String(text || "").trim();
  if (!raw) return 0;
  if (code === "zh" || code === "ja" || code === "ko") {
    return raw.replace(/[\s\p{P}\p{S}]/gu, "").length;
  }
  return raw.split(/\s+/).filter(Boolean).length;
}

export function passageBody(sentences, code = "en") {
  const parts = (sentences || []).map((s) => String(s.text || "").trim()).filter(Boolean);
  if (!parts.length) return "";
  return parts.join(code === "zh" || code === "ja" || code === "ko" ? "" : " ");
}

function attachQuestion(raw, fallbackTag = "detail") {
  const options = Array.isArray(raw?.options) ? raw.options.map((opt) => String(opt || "").trim()).filter(Boolean) : [];
  if (options.length < 2) return null;
  const item = {
    q: String(raw.q || raw.question || "").trim(),
    q_zh: String(raw.q_zh || "").trim(),
    options,
    options_zh: Array.isArray(raw.options_zh) ? raw.options_zh.map((opt) => String(opt || "").trim()) : [],
    a: raw.a,
    tag: String(raw.tag || raw.type || fallbackTag),
    type: String(raw.type || raw.tag || "detail"),
    why: String(raw.why || "").trim(),
  };
  if (!item.q) return null;
  const a = examAnswerIndex(item);
  if (a < 0) return null;
  const correct = options[a] || "";
  return {
    ...item,
    a,
    why: item.why || (correct ? `正確答案是「${correct}」。` : ""),
  };
}

export function parseArticlePayload(raw) {
  const p = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const sentences = (Array.isArray(p.sentences) ? p.sentences : [])
    .map((s) => ({
      text: String(s?.text || s?.en || "").trim(),
      zh: String(s?.zh || s?.native || "").trim(),
    }))
    .filter((s) => s.text);
  if (sentences.length < 2) throw new Error("NO_ARTICLE");
  const tag = String(p.tag || p.topic || "article");
  const questions = (Array.isArray(p.questions) ? p.questions : [])
    .map((q) => attachQuestion(q, tag))
    .filter(Boolean)
    .slice(0, 4);
  if (questions.length < 2) throw new Error("NO_ARTICLE_Q");
  return {
    title: String(p.title || "").trim() || sentences[0].text.slice(0, 42),
    title_zh: String(p.title_zh || "").trim(),
    topic: String(p.topic || tag),
    tag,
    level: p.level || "",
    sentences,
    questions,
  };
}

export const ARTICLES = {
  en: [
    {
      level: "Bridge",
      title: "A Small Coffee",
      title_zh: "一杯小咖啡",
      topic: "food",
      tag: "cafe-order",
      sentences: [
        { text: "I go to the cafe near my office.", zh: "我去公司附近的咖啡廳。" },
        { text: "I want a small coffee and a banana.", zh: "我要一杯小咖啡和一根香蕉。" },
        { text: "The woman smiles and says, \"Here you are.\"", zh: "那位女士微笑說：「這是你的。」" },
        { text: "I sit by the window and look at the street.", zh: "我坐在窗邊看著街道。" },
      ],
      questions: [
        {
          q: "Where does the writer go?",
          q_zh: "作者去了哪裡？",
          options: ["A cafe near the office", "A school", "A hospital", "A train station"],
          options_zh: ["公司附近的咖啡廳", "學校", "醫院", "火車站"],
          a: 0,
          type: "detail",
          tag: "cafe-order",
          why: "第一句說去公司附近的咖啡廳。",
        },
        {
          q: "What does the writer want?",
          q_zh: "作者想要什麼？",
          options: ["Tea and cake", "A small coffee and a banana", "Juice only", "A big lunch"],
          options_zh: ["茶和蛋糕", "小咖啡和香蕉", "只有果汁", "豐盛午餐"],
          a: 1,
          type: "gist",
          tag: "cafe-order",
          why: "第二句明確點了小咖啡和香蕉。",
        },
      ],
    },
    {
      level: "A2",
      title: "Ten Minutes Late",
      title_zh: "晚了十分鐘",
      topic: "commute",
      tag: "late-bus",
      sentences: [
        { text: "I missed the first bus by half a minute this morning.", zh: "今早我差半分鐘沒搭上第一班公車。" },
        { text: "The next one was full, so I stood near the door.", zh: "下一班很擠，所以我站在門口附近。" },
        { text: "I sent a message to my team: I will be ten minutes late.", zh: "我傳訊給小組：我會晚十分鐘。" },
        { text: "When I arrived, my manager just nodded and we started the meeting.", zh: "我到的時候主管只點了點頭，會議就開始了。" },
      ],
      questions: [
        {
          q: "Why was the writer late?",
          q_zh: "作者為什麼遲到？",
          options: ["The manager was angry", "The first bus was missed", "There was no meeting", "The cafe was closed"],
          options_zh: ["主管生氣", "沒搭上第一班公車", "沒有會議", "咖啡廳關門"],
          a: 1,
          type: "gist",
          tag: "late-bus",
          why: "開頭就說錯過第一班車，所以遲到。",
        },
        {
          q: "What did the writer do on the bus?",
          q_zh: "作者在車上做了什麼？",
          options: ["Called a taxi", "Bought a ticket", "Messaged the team", "Ate breakfast"],
          options_zh: ["叫計程車", "買票", "傳訊給小組", "吃早餐"],
          a: 2,
          type: "detail",
          tag: "late-bus",
          why: "第三句說傳訊告訴小組會晚十分鐘。",
        },
      ],
    },
    {
      level: "B1",
      title: "The Slide Deck",
      title_zh: "那份投影片",
      topic: "work",
      tag: "meeting-prep",
      sentences: [
        { text: "The meeting ran long after lunch, so we skipped dessert.", zh: "午餐後會議拖太久，我們沒吃甜點。" },
        { text: "I walked around the block to clear my head before presenting.", zh: "報告前我繞了街區一圈，讓腦袋清醒。" },
        { text: "When I got back, the slides were already open on the screen.", zh: "我回來時，投影片已經打在螢幕上。" },
        { text: "A colleague had added two extra charts while I was outside.", zh: "我不在時，同事多加了兩張圖表。" },
        { text: "I thanked her quietly and used the new charts in the last five minutes.", zh: "我小聲謝了她，並在最後五分鐘用上新圖表。" },
      ],
      questions: [
        {
          q: "What is the passage mainly about?",
          q_zh: "這段短文主要在說什麼？",
          options: ["Ordering dessert", "Preparing for a meeting after a long lunch", "Buying a new computer", "Taking a holiday"],
          options_zh: ["點甜點", "漫長午餐後準備開會", "買新電腦", "去度假"],
          a: 1,
          type: "gist",
          tag: "meeting-prep",
          why: "全文圍繞會議延長、清醒一下、投影片被補上圖表。",
        },
        {
          q: "What happened while the writer was outside?",
          q_zh: "作者在外面時發生了什麼？",
          options: ["The meeting was cancelled", "Dessert was served", "A colleague added two charts", "The manager left"],
          options_zh: ["會議取消", "甜點送來了", "同事加了兩張圖表", "主管離開"],
          a: 2,
          type: "detail",
          tag: "meeting-prep",
          why: "第四句說同事趁作者在外面時加了兩張圖。",
        },
        {
          q: "How did the writer feel about the extra charts?",
          q_zh: "作者對多出來的圖表態度如何？",
          options: ["Angry and refused them", "Quietly grateful and used them", "Confused and deleted them", "Too tired to notice"],
          options_zh: ["生氣並拒絕", "小聲感謝並使用", "困惑並刪掉", "累到沒注意到"],
          a: 1,
          type: "infer",
          tag: "meeting-prep",
          why: "最後一句 quietly thanked 並實際用上，顯示感激而非生氣。",
        },
      ],
    },
    {
      level: "B2",
      title: "Hybrid Tuesdays",
      title_zh: "混合出勤的週二",
      topic: "work",
      tag: "hybrid-work",
      sentences: [
        { text: "Our team now comes in on Tuesdays and Thursdays, and works from home the rest of the week.", zh: "我們小組改成週二、週四進公司，其餘在家上班。" },
        { text: "At first I liked the quiet mornings, but I started missing the short talks by the coffee machine.", zh: "起初我喜歡安靜的早晨，後來卻想念咖啡機旁那些短短的閒聊。" },
        { text: "Last Tuesday we agreed to keep a 20-minute walk-around after the stand-up, just to catch problems early.", zh: "上週二我們說好，站會後再走 20 分鐘，及早抓問題。" },
        { text: "It is not a perfect system, and some people still send long messages at night.", zh: "這不是完美制度，有些人晚上仍會傳很長的訊息。" },
        { text: "Even so, the office days feel more useful now, because we save the hard decisions for when we are in the same room.", zh: "即便如此，進公司的日子比較有用了，因為難決定的事留到大家同處一室再談。" },
      ],
      questions: [
        {
          q: "What change did the team make?",
          q_zh: "小組做了什麼改變？",
          options: ["They work in the office every day", "They only work at night", "They come in two days a week", "They cancelled stand-up meetings"],
          options_zh: ["每天進公司", "只在晚上工作", "一週進公司兩天", "取消站會"],
          a: 2,
          type: "detail",
          tag: "hybrid-work",
          why: "第一句寫週二、週四進公司。",
        },
        {
          q: "Why was a walk-around added?",
          q_zh: "為什麼要加 round？",
          options: ["To replace coffee breaks", "To catch problems early", "To make nights longer", "To cancel office days"],
          options_zh: ["取代喝咖啡", "及早抓問題", "讓晚上更長", "取消進公司日"],
          a: 1,
          type: "detail",
          tag: "hybrid-work",
          why: "第三句說 walk-around 是為了 early catch problems。",
        },
        {
          q: "What is the writer's overall view of hybrid work?",
          q_zh: "作者對混合出勤的整體看法？",
          options: ["It is perfect and needs no change", "It is useless and should stop", "It has flaws but office days are more useful now", "People should message more at night"],
          options_zh: ["完美不必改", "沒用該停", "有缺點但進公司日更有用", "晚上該傳更多訊"],
          a: 2,
          type: "gist",
          tag: "hybrid-work",
          why: "末段承認不完美，但認為同室做困難決定讓進公司日更有價值。",
        },
      ],
    },
    {
      level: "C1",
      title: "The Cost of Always Being Reachable",
      title_zh: "隨時在線的代價",
      topic: "work",
      tag: "always-on",
      sentences: [
        { text: "Few office policies look as reasonable, on paper, as the promise to reply within an hour.", zh: "紙面上很少有規定看起來比「一小時內回覆」更合理。" },
        { text: "In practice, that rule quietly trains people to keep one eye on the phone during lunch, on the train, and even in the evening.", zh: "實務上，這條規則悄悄訓練人在午餐、通勤、甚至晚上都盯著手機。" },
        { text: "The result is not faster work so much as thinner attention: messages get a first draft of a thought, not a finished one.", zh: "結果往往不是更快，而是注意力變薄：訊息只得到想法的初稿，而不是想完的回覆。" },
        { text: "A growing number of teams have therefore tried a narrower window — replies expected during core hours, with overnight notes left until morning.", zh: "愈來愈多小組改成較窄的窗口：核心工時內回覆，隔夜留言留到早上。" },
        { text: "Critics say this slows clients down; supporters argue that a delayed but complete answer prevents the second and third clarifying emails that eat the afternoon.", zh: "批評者說客戶會被拖慢；支持者認為完整但稍晚的回覆，能避免下午一連串澄清信。" },
        { text: "The more interesting question is not speed versus delay, but which kind of delay we are willing to own: a short pause before a careful reply, or a long trail of half-answers.", zh: "更值得問的不是快或慢，而是我們願意承擔哪一種延遲：謹慎回覆前的短暫停頓，還是一連串半成品回覆。" },
      ],
      questions: [
        {
          q: "What does the one-hour reply rule tend to produce?",
          q_zh: "「一小時內回覆」通常造成什麼？",
          options: ["Longer lunch breaks", "Thinner attention and unfinished thoughts", "Fewer messages overall", "Better overnight rest"],
          options_zh: ["更長午餐", "注意力變薄、想法不完整", "訊息變少", "晚上休息更好"],
          a: 1,
          type: "detail",
          tag: "always-on",
          why: "第三句說結果是 thinner attention，回覆只是初稿。",
        },
        {
          q: "How do supporters defend a narrower reply window?",
          q_zh: "支持較窄回覆窗口的人如何辯護？",
          options: ["Clients prefer silence", "A complete answer reduces later clarifying emails", "Phones should stay on at night", "Meetings should last longer"],
          options_zh: ["客戶喜歡沉默", "完整回覆可減少後續澄清信", "晚上手機該開著", "會議該更長"],
          a: 1,
          type: "detail",
          tag: "always-on",
          why: "第五句 supporters 認為完整回覆能避免第二、第三封澄清信。",
        },
        {
          q: "What contrast does the writer want the reader to consider?",
          q_zh: "作者希望讀者思考哪一組對比？",
          options: ["Office versus home", "A short pause before a careful reply versus a trail of half-answers", "Lunch versus dinner", "Clients versus managers only"],
          options_zh: ["公司對家裡", "謹慎回覆前的停頓，對上半成品回覆串", "午餐對晚餐", "只談客戶與主管"],
          a: 1,
          type: "infer",
          tag: "always-on",
          why: "末句把問題從快慢，轉成兩種 delay 的取捨。",
        },
      ],
    },
    {
      level: "C2",
      title: "Fluency Is Not the Same as Ease",
      title_zh: "流利並不等於輕鬆",
      topic: "language",
      tag: "fluency-ease",
      sentences: [
        { text: "Learners often treat fluency as a finish line: once the sentences come quickly, the work is done.", zh: "學習者常把流利當成終點：句子一旦出口快，就以為完工了。" },
        { text: "Yet speed can hide a narrower vocabulary and a habit of recycling the same safe structures.", zh: "然而速度可能掩蓋詞彙偏窄，以及反覆使用同一套安全句型的習慣。" },
        { text: "Exam boards that sit at IELTS 7.5 and above are, in that sense, less interested in smoothness than in range: whether a writer can shift register, hold a counter-argument, and still be precise.", zh: "雅思 7.5 以上的測驗，在這層意義上更在意廣度而非順：能否轉換語域、抓住反方、仍然精確。" },
        { text: "The awkward pause before a better word is not a failure of fluency; it is often the sound of someone refusing the first, almost-right choice.", zh: "為了一個更好的字而停頓，不是流利失敗；那常常是拒絕第一個「差不多對」的選擇。" },
        { text: "If practice only rewards items that can be said without hesitation, it quietly trains people to stay inside the language they already own.", zh: "若練習只獎勵毫不猶豫就能說出的項目，就會悄悄訓練人停在自己已經會的語言裡。" },
        { text: "A more demanding reading habit — short articles just above comfort, followed by questions that cannot be answered by a single keyword — is one way to make ease serve range, rather than replace it.", zh: "更嚴的閱讀習慣——略高於舒適圈的短文，再加上不能靠單一字詞作答的題目——是讓輕鬆服務廣度、而不是取代廣度的一種方法。" },
      ],
      questions: [
        {
          q: "According to the writer, what can speed in speech conceal?",
          q_zh: "依作者之見，說話速度快可能掩蓋什麼？",
          options: ["Better pronunciation only", "A narrower vocabulary and safe structures", "Exam fees", "A longer pause"],
          options_zh: ["只有發音更好", "較窄的詞彙與安全句型", "考試費用", "更長的停頓"],
          a: 1,
          type: "detail",
          tag: "fluency-ease",
          why: "第二句明確寫 speed can hide narrower vocabulary and recycling safe structures。",
        },
        {
          q: "How does the writer reframe an awkward pause?",
          q_zh: "作者如何重新解讀尷尬的停頓？",
          options: ["As proof that study has failed", "As the sound of refusing an almost-right word", "As a reason to avoid reading", "As a client complaint"],
          options_zh: ["證明學習失敗", "拒絕「差不多對」用詞時的聲音", "該停止閱讀的理由", "客戶抱怨"],
          a: 1,
          type: "infer",
          tag: "fluency-ease",
          why: "第四句把停頓說成拒絕第一個 almost-right choice。",
        },
        {
          q: "What kind of reading practice does the writer recommend?",
          q_zh: "作者建議哪種閱讀練習？",
          options: ["Only texts far below the learner's level", "Keyword hunting with no questions", "Short articles just above comfort, with questions that need more than one keyword", "Memorising speeches without texts"],
          options_zh: ["遠低於程度的文章", "只找關鍵字、沒有題目", "略高於舒適圈的短文，題目不能只靠一個關鍵字", "不看文本、只背講稿"],
          a: 2,
          type: "gist",
          tag: "fluency-ease",
          why: "末句主張略難的短文，加上無法用單一 keyword 作答的理解題。",
        },
      ],
    },
  ],
  zh: [
    {
      level: "B1",
      title: "晚十分鐘",
      title_zh: "Ten Minutes Late",
      topic: "commute",
      tag: "late-bus",
      sentences: [
        { text: "今早我差半分鐘沒搭上第一班公車。", zh: "I missed the first bus by half a minute this morning." },
        { text: "下一班很擠，我只好站在門口。", zh: "The next one was full, so I stood near the door." },
        { text: "我傳訊跟小組說我會晚十分鐘。", zh: "I messaged the team that I would be ten minutes late." },
        { text: "到公司時主管只點了點頭，會議就開始了。", zh: "When I arrived, my manager just nodded and we started." },
      ],
      questions: [
        {
          q: "作者為什麼遲到？",
          q_zh: "Why was the writer late?",
          options: ["主管生氣", "沒搭上第一班公車", "沒有會議", "咖啡廳關門"],
          options_zh: ["The manager was angry", "The first bus was missed", "There was no meeting", "The cafe was closed"],
          a: 1,
          type: "gist",
          tag: "late-bus",
          why: "開頭就說錯過第一班車。",
        },
        {
          q: "作者在車上做了什麼？",
          q_zh: "What did the writer do on the bus?",
          options: ["叫計程車", "買票", "傳訊給小組", "吃早餐"],
          options_zh: ["Called a taxi", "Bought a ticket", "Messaged the team", "Ate breakfast"],
          a: 2,
          type: "detail",
          tag: "late-bus",
          why: "第三句說傳訊告訴小組會晚到。",
        },
      ],
    },
  ],
  ja: [
    {
      level: "B1",
      title: "十分遅れて",
      title_zh: "晚了十分鐘",
      topic: "commute",
      tag: "late-bus",
      sentences: [
        { text: "今朝、最初のバスに三十秒遅れて乗れませんでした。", zh: "今早差半分鐘沒搭上第一班公車。" },
        { text: "次の便は混んでいたので、ドアの近くに立ちました。", zh: "下一班很擠，所以站在門口附近。" },
        { text: "チームに「十分遅れます」とメッセージを送りました。", zh: "傳訊跟小組說會晚十分鐘。" },
        { text: "着いたとき、上司はうなずいただけですぐ会議が始まりました。", zh: "到的時候主管只點頭，會議就開始了。" },
      ],
      questions: [
        {
          q: "筆者はなぜ遅れましたか。",
          q_zh: "作者為什麼遲到？",
          options: ["上司が怒っていた", "最初のバスに乗れなかった", "会議がなかった", "店が閉まっていた"],
          options_zh: ["主管生氣", "沒搭上第一班車", "沒有會議", "店關門"],
          a: 1,
          type: "gist",
          tag: "late-bus",
          why: "第一句說沒搭上第一班公車。",
        },
        {
          q: "バスの中で何をしましたか。",
          q_zh: "在車上做了什麼？",
          options: ["タクシーを呼んだ", "切符を買った", "チームに連絡した", "朝食を食べた"],
          options_zh: ["叫計程車", "買票", "聯絡小組", "吃早餐"],
          a: 2,
          type: "detail",
          tag: "late-bus",
          why: "第三句寫傳訊告知會晚十分鐘。",
        },
      ],
    },
  ],
  fr: [
    {
      level: "B1",
      title: "Dix minutes de retard",
      title_zh: "晚了十分鐘",
      topic: "commute",
      tag: "late-bus",
      sentences: [
        { text: "Ce matin, j'ai rate le premier bus d'une demi-minute.", zh: "今早我差半分鐘沒搭上第一班公車。" },
        { text: "Le suivant etait plein, alors je suis reste pres de la porte.", zh: "下一班很擠，所以我站在門口。" },
        { text: "J'ai ecrit a l'equipe : j'aurai dix minutes de retard.", zh: "我傳訊給小組：我會晚十分鐘。" },
        { text: "En arrivant, mon manager a juste hoche la tete et la reunion a commence.", zh: "到的時候主管只點頭，會議就開始了。" },
      ],
      questions: [
        {
          q: "Pourquoi l'auteur est-il en retard ?",
          q_zh: "作者為什麼遲到？",
          options: ["Le manager etait en colere", "Il a rate le premier bus", "Il n'y avait pas de reunion", "Le cafe etait ferme"],
          options_zh: ["主管生氣", "沒搭上第一班車", "沒有會議", "咖啡廳關門"],
          a: 1,
          type: "gist",
          tag: "late-bus",
          why: "第一句說明錯過第一班公車。",
        },
        {
          q: "Que fait l'auteur dans le bus ?",
          q_zh: "作者在車上做了什麼？",
          options: ["Il appelle un taxi", "Il achete un ticket", "Il envoie un message a l'equipe", "Il prend son petit-dejeuner"],
          options_zh: ["叫計程車", "買票", "傳訊給小組", "吃早餐"],
          a: 2,
          type: "detail",
          tag: "late-bus",
          why: "第三句寫傳訊告知會晚十分鐘。",
        },
      ],
    },
  ],
  ko: [
    {
      level: "B1",
      title: "십 분 지각",
      title_zh: "晚了十分鐘",
      topic: "commute",
      tag: "late-bus",
      sentences: [
        { text: "오늘 아침 첫 버스를 삼십 초 차이로 놓쳤습니다.", zh: "今早差半分鐘沒搭上第一班公車。" },
        { text: "다음 차는 만원이라 문 근처에 섰습니다.", zh: "下一班很擠，所以站在門口。" },
        { text: "팀에 십 분 늦는다고 메시지를 보냈습니다.", zh: "傳訊跟小組說會晚十分鐘。" },
        { text: "도착하니 팀장은 고개만 끄덕였고 회의가 시작됐습니다.", zh: "到的時候主管只點頭，會議就開始了。" },
      ],
      questions: [
        {
          q: "필자는 왜 늦었습니까?",
          q_zh: "作者為什麼遲到？",
          options: ["팀장이 화났다", "첫 버스를 놓쳤다", "회의가 없었다", "카페가 문을 닫았다"],
          options_zh: ["主管生氣", "沒搭上第一班車", "沒有會議", "咖啡廳關門"],
          a: 1,
          type: "gist",
          tag: "late-bus",
          why: "첫 문장이 버스를 놓쳤다고 말한다.",
        },
        {
          q: "버스에서 무엇을 했습니까?",
          q_zh: "在車上做了什麼？",
          options: ["택시를 불렀다", "표를 샀다", "팀에 연락했다", "아침을 먹었다"],
          options_zh: ["叫計程車", "買票", "聯絡小組", "吃早餐"],
          a: 2,
          type: "detail",
          tag: "late-bus",
          why: "셋째 문장에서 팀에 늦는다고 알렸다.",
        },
      ],
    },
  ],
  es: [
    {
      level: "B1",
      title: "Diez minutos tarde",
      title_zh: "晚了十分鐘",
      topic: "commute",
      tag: "late-bus",
      sentences: [
        { text: "Esta manana perdi el primer autobus por medio minuto.", zh: "今早差半分鐘沒搭上第一班公車。" },
        { text: "El siguiente iba lleno, asi que me quede cerca de la puerta.", zh: "下一班很擠，所以站在門口。" },
        { text: "Envie un mensaje al equipo: llegare diez minutos tarde.", zh: "傳訊跟小組說會晚十分鐘。" },
        { text: "Al llegar, mi jefe solo asintio y empezo la reunion.", zh: "到的時候主管只點頭，會議就開始了。" },
      ],
      questions: [
        {
          q: "Por que llega tarde el autor?",
          q_zh: "作者為什麼遲到？",
          options: ["El jefe estaba enfadado", "Perdio el primer autobus", "No habia reunion", "El cafe estaba cerrado"],
          options_zh: ["主管生氣", "沒搭上第一班車", "沒有會議", "咖啡廳關門"],
          a: 1,
          type: "gist",
          tag: "late-bus",
          why: "La primera frase dice que perdio el primer autobus.",
        },
        {
          q: "Que hace en el autobus?",
          q_zh: "在車上做了什麼？",
          options: ["Llama un taxi", "Compra un billete", "Escribe al equipo", "Desayuna"],
          options_zh: ["叫計程車", "買票", "傳訊給小組", "吃早餐"],
          a: 2,
          type: "detail",
          tag: "late-bus",
          why: "La tercera frase envia un mensaje de retraso.",
        },
      ],
    },
  ],
};

export function articleItemsFor(code, levelId) {
  const pool = ARTICLES[code] || ARTICLES.en;
  const id = LEVELS.some((row) => row.id === levelId) ? levelId : "B1";
  const tagged = pool.filter((item) => (item.level || "B1") === id);
  if (tagged.length) return tagged;
  const sameLang = pool.filter((item) => item.level);
  return sameLang.length ? sameLang : pool;
}

export function pickArticle(code, levelId, seenKeys = [], focusTag = "") {
  const bank = articleItemsFor(code, levelId);
  const hit = pickSimilar(bank, seenKeys, (row) => row.title, focusTag)
    || pickFresh(bank, seenKeys, (row) => row.title)
    || bank[0];
  return parseArticlePayload(hit);
}

export function currentQuestion(article, index = 0) {
  const questions = article?.questions || [];
  if (!questions.length) return null;
  const i = Math.max(0, Math.min(Number(index) || 0, questions.length - 1));
  return questions[i];
}
