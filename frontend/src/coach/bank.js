export const KANA_ROWS = [
  { id: "a", label: "あ行", romaji: ["a", "i", "u", "e", "o"], hira: ["あ", "い", "う", "え", "お"], kata: ["ア", "イ", "ウ", "エ", "オ"] },
  { id: "ka", label: "か行", romaji: ["ka", "ki", "ku", "ke", "ko"], hira: ["か", "き", "く", "け", "こ"], kata: ["カ", "キ", "ク", "ケ", "コ"] },
  { id: "sa", label: "さ行", romaji: ["sa", "shi", "su", "se", "so"], hira: ["さ", "し", "す", "せ", "そ"], kata: ["サ", "シ", "ス", "セ", "ソ"] },
  { id: "ta", label: "た行", romaji: ["ta", "chi", "tsu", "te", "to"], hira: ["た", "ち", "つ", "て", "と"], kata: ["タ", "チ", "ツ", "テ", "ト"] },
  { id: "na", label: "な行", romaji: ["na", "ni", "nu", "ne", "no"], hira: ["な", "に", "ぬ", "ね", "の"], kata: ["ナ", "ニ", "ヌ", "ネ", "ノ"] },
  { id: "ha", label: "は行", romaji: ["ha", "hi", "fu", "he", "ho"], hira: ["は", "ひ", "ふ", "へ", "ほ"], kata: ["ハ", "ヒ", "フ", "ヘ", "ホ"] },
  { id: "ma", label: "ま行", romaji: ["ma", "mi", "mu", "me", "mo"], hira: ["ま", "み", "む", "め", "も"], kata: ["マ", "ミ", "ム", "メ", "モ"] },
  { id: "ya", label: "や行", romaji: ["ya", "yu", "yo"], hira: ["や", "ゆ", "よ"], kata: ["ヤ", "ユ", "ヨ"] },
  { id: "ra", label: "ら行", romaji: ["ra", "ri", "ru", "re", "ro"], hira: ["ら", "り", "る", "れ", "ろ"], kata: ["ラ", "リ", "ル", "レ", "ロ"] },
  { id: "wa", label: "わ行", romaji: ["wa", "wo", "n"], hira: ["わ", "を", "ん"], kata: ["ワ", "ヲ", "ン"] },
];

export const JA_VOCAB = [
  { id: "watashi", word: "私", reading: "わたし", zh: "我", sentence: "私は学生です。", sentenceReading: "わたしはがくせいです。", sentenceZh: "我是學生。" },
  { id: "gakusei", word: "学生", reading: "がくせい", zh: "學生", sentence: "私は学生です。", sentenceReading: "わたしはがくせいです。", sentenceZh: "我是學生。" },
  { id: "hon", word: "本", reading: "ほん", zh: "書", sentence: "これは本です。", sentenceReading: "これはほんです。", sentenceZh: "這是書。" },
  { id: "mizu", word: "水", reading: "みず", zh: "水", sentence: "水を飲みます。", sentenceReading: "みずをのみます。", sentenceZh: "喝水。" },
  { id: "gakkou", word: "学校", reading: "がっこう", zh: "學校", sentence: "学校に行きます。", sentenceReading: "がっこうにいきます。", sentenceZh: "去學校。" },
  { id: "sensei", word: "先生", reading: "せんせい", zh: "老師", sentence: "先生は日本語を読みます。", sentenceReading: "せんせいはにほんごをよみます。", sentenceZh: "老師讀日文。" },
  { id: "nihongo", word: "日本語", reading: "にほんご", zh: "日文", sentence: "日本語を勉強します。", sentenceReading: "にほんごをべんきょうします。", sentenceZh: "學習日文。" },
  { id: "kyou", word: "今日", reading: "きょう", zh: "今天", sentence: "今日は本を読みます。", sentenceReading: "きょうはほんをよみます。", sentenceZh: "今天看書。" },
  { id: "ashita", word: "明日", reading: "あした", zh: "明天", sentence: "明日も学校に行きます。", sentenceReading: "あしたもがっこうにいきます。", sentenceZh: "明天也去學校。" },
  { id: "kinou", word: "昨日", reading: "きのう", zh: "昨天", sentence: "昨日、水を飲みました。", sentenceReading: "きのう、みずをのみました。", sentenceZh: "昨天喝了水。" },
  { id: "taberu", word: "食べる", reading: "たべる", zh: "吃", sentence: "パンを食べます。", sentenceReading: "パンをたべます。", sentenceZh: "吃麵包。" },
  { id: "nomu", word: "飲む", reading: "のむ", zh: "喝", sentence: "水を飲みます。", sentenceReading: "みずをのみます。", sentenceZh: "喝水。" },
  { id: "iku", word: "行く", reading: "いく", zh: "去", sentence: "学校に行きます。", sentenceReading: "がっこうにいきます。", sentenceZh: "去學校。" },
  { id: "miru", word: "見る", reading: "みる", zh: "看", sentence: "映画を見ます。", sentenceReading: "えいがをみます。", sentenceZh: "看電影。" },
  { id: "yomu", word: "読む", reading: "よむ", zh: "讀", sentence: "本を読みます。", sentenceReading: "ほんをよみます。", sentenceZh: "看書。" },
  { id: "ookii", word: "大きい", reading: "おおきい", zh: "大的", sentence: "この本は大きいです。", sentenceReading: "このほんはおおきいです。", sentenceZh: "這本書很大。" },
  { id: "chiisai", word: "小さい", reading: "ちいさい", zh: "小的", sentence: "この本は小さいです。", sentenceReading: "このほんはちいさいです。", sentenceZh: "這本書很小。" },
  { id: "suki", word: "好き", reading: "すき", zh: "喜歡", sentence: "日本語が好きです。", sentenceReading: "にほんごがすきです。", sentenceZh: "我喜歡日文。" },
  { id: "kore", word: "これ", reading: "これ", zh: "這個", sentence: "これは本です。", sentenceReading: "これはほんです。", sentenceZh: "這是書。" },
  { id: "mainichi", word: "毎日", reading: "まいにち", zh: "每天", sentence: "毎日本を読みます。", sentenceReading: "まいにちほんをよみます。", sentenceZh: "每天看書。" },
];

export const JA_GRAMMAR = [
  { id: "desu", name: "名詞＋です", reading: "めいし＋です", zh: "禮貌句的「是」", example: "これは本です。", exampleReading: "これはほんです。", exampleZh: "這是書。", note: "です放在句尾。疑問是「本ですか」。" },
  { id: "masu", name: "動詞ます形", reading: "どうしますけい", zh: "禮貌的動作句", example: "水を飲みます。", exampleReading: "みずをのみます。", exampleZh: "喝水。", note: "喝是 飲みます（のみます）。現在與未來都用ます。" },
  { id: "wa", name: "助詞は", reading: "じょしは", zh: "提示主題，讀 wa", example: "私は学生です。", exampleReading: "わたしはがくせいです。", exampleZh: "我是學生。", note: "は寫 ha，當助詞時讀 wa。" },
  { id: "wo", name: "助詞を", reading: "じょしを", zh: "動作對象，讀 o", example: "本を読みます。", exampleReading: "ほんをよみます。", exampleZh: "看書。", note: "を寫 wo，當助詞時讀 o。" },
  { id: "ni", name: "助詞に", reading: "じょしに", zh: "目的地或時間點", example: "学校に行きます。", exampleReading: "がっこうにいきます。", exampleZh: "去學校。", note: "去哪裡用 に。七時に起きます＝七點起床。" },
  { id: "no", name: "助詞の", reading: "じょしの", zh: "的，連接所屬", example: "私の本です。", exampleReading: "わたしのほんです。", exampleZh: "是我的書。", note: "の 放在擁有者和東西中間。" },
  { id: "mo", name: "助詞も", reading: "じょしも", zh: "也", example: "明日も行きます。", exampleReading: "あしたもいきます。", exampleZh: "明天也去。", note: "も取代 は 的位置：私も學生です。" },
  { id: "janai", name: "じゃないです", reading: "じゃないです", zh: "不是", example: "学生じゃないです。", exampleReading: "がくせいじゃないです。", exampleZh: "不是學生。", note: "名詞の否定。更禮貌可以說 ではありません。" },
  { id: "masen", name: "ません", reading: "ません", zh: "不做", example: "今日は行きません。", exampleReading: "きょうはいきません。", exampleZh: "今天不去。", note: "ます 的否定是 ません。" },
  { id: "mashita", name: "ました", reading: "ました", zh: "做了", example: "昨日、本を読みました。", exampleReading: "きのう、ほんをよみました。", exampleZh: "昨天看了書。", note: "過去禮貌形。否定過去是 ませんでした。" },
  { id: "i-adj", name: "い形容詞", reading: "いけいようし", zh: "い結尾的形容詞", example: "この本は大きいです。", exampleReading: "このほんはおおきいです。", exampleZh: "這本書很大。", note: "否定：大きくないです。い 改成 くない。" },
  { id: "suki", name: "が好きです", reading: "がすきです", zh: "喜歡某物", example: "日本語が好きです。", exampleReading: "にほんごがすきです。", exampleZh: "我喜歡日文。", note: "喜歡的對象用 が，不用 を。" },
];

export const KANJI = [
  { id: "ichi", kanji: "一", reading: "いち", zh: "一" },
  { id: "ni", kanji: "二", reading: "に", zh: "二" },
  { id: "san", kanji: "三", reading: "さん", zh: "三" },
  { id: "yon", kanji: "四", reading: "よん", zh: "四" },
  { id: "go", kanji: "五", reading: "ご", zh: "五" },
  { id: "roku", kanji: "六", reading: "ろく", zh: "六" },
  { id: "nana", kanji: "七", reading: "なな", zh: "七" },
  { id: "hachi", kanji: "八", reading: "はち", zh: "八" },
  { id: "kyuu", kanji: "九", reading: "きゅう", zh: "九" },
  { id: "juu", kanji: "十", reading: "じゅう", zh: "十" },
  { id: "nichi", kanji: "日", reading: "にち", zh: "日、天" },
  { id: "hito", kanji: "人", reading: "ひと", zh: "人" },
  { id: "mizu", kanji: "水", reading: "みず", zh: "水" },
  { id: "hi", kanji: "火", reading: "ひ", zh: "火" },
  { id: "ki", kanji: "木", reading: "き", zh: "樹、木" },
];

export const EN_VOCAB = [
  { id: "however", word: "however", zh: "然而", example: "The text is short. However, the main idea is clear.", exampleZh: "文章很短。然而，主旨很清楚。" },
  { id: "although", word: "although", zh: "雖然", example: "Although the paragraph is long, the topic is simple.", exampleZh: "雖然這段很長，主題很單純。" },
  { id: "increase", word: "increase", zh: "增加", example: "Daily reading can increase your vocabulary.", exampleZh: "每天閱讀可以增加你的單字量。" },
  { id: "reason", word: "reason", zh: "原因", example: "The main reason is a lack of vocabulary.", exampleZh: "主要原因是單字不夠。" },
  { id: "main", word: "main", zh: "主要的", example: "Find the main idea before the details.", exampleZh: "先找主旨，再看細節。" },
  { id: "paragraph", word: "paragraph", zh: "段落", example: "Write one paragraph with a topic sentence.", exampleZh: "寫一段，而且要有主題句。" },
  { id: "opinion", word: "opinion", zh: "意見", example: "In my opinion, writing needs a clear reason.", exampleZh: "我認為，寫作需要一個清楚的原因。" },
  { id: "because", word: "because", zh: "因為", example: "I study every morning because I focus better then.", exampleZh: "我每天早上讀，因為那時候比較專心。" },
  { id: "example", word: "example", zh: "例子", example: "Give one example after your reason.", exampleZh: "理由之後給一個例子。" },
  { id: "habit", word: "habit", zh: "習慣", example: "A small daily habit is better than a long cram.", exampleZh: "每天一點點的習慣，比一次熬很久有用。" },
  { id: "improve", word: "improve", zh: "進步、改善", example: "I want to improve my reading speed.", exampleZh: "我想改善閱讀速度。" },
  { id: "difficult", word: "difficult", zh: "困難的", example: "Long articles are difficult when the words are new.", exampleZh: "單字很新的時候，長文會變困難。" },
  { id: "purpose", word: "purpose", zh: "目的", example: "The purpose of this plan is a clear exam goal.", exampleZh: "這個計畫的目的，是一個清楚的考試目標。" },
  { id: "result", word: "result", zh: "結果", example: "The result was a low score in reading.", exampleZh: "結果是閱讀分數偏低。" },
  { id: "compare", word: "compare", zh: "比較", example: "Compare the two reasons before you choose.", exampleZh: "選擇之前，先比較兩個理由。" },
  { id: "suggest", word: "suggest", zh: "建議", example: "The writer suggests reading past unknown words.", exampleZh: "作者建議遇到不認識的字先讀下去。" },
  { id: "evidence", word: "evidence", zh: "證據", example: "Use one fact as evidence for your opinion.", exampleZh: "用一個事實當你的意見的證據。" },
  { id: "topic", word: "topic", zh: "主題", example: "The topic sentence tells the reader your point.", exampleZh: "主題句告訴讀者你的重點。" },
  { id: "support", word: "support", zh: "支持", example: "Support your idea with a reason and an example.", exampleZh: "用一個理由和一個例子支持你的想法。" },
  { id: "conclude", word: "conclude", zh: "做結論", example: "Conclude the paragraph with the same main idea.", exampleZh: "用同一個主旨結束這一段。" },
];

export const EN_GRAMMAR = [
  { id: "topic", name: "主題句", zh: "一段的第一句先講結論", example: "Morning study is the best time for me.", exampleZh: "早上是我最適合學習的時間。" },
  { id: "because", name: "because 原因句", zh: "because 後面接完整句子", example: "I study in the morning because I can focus.", exampleZh: "我在早上學習，因為我能專心。" },
  { id: "however", name: "however 轉折", zh: "however 通常另起一句，後面加逗號", example: "Reading is slow. However, I can find the main idea.", exampleZh: "閱讀很慢。然而，我找得到主旨。" },
  { id: "present", name: "現在簡單式", zh: "習慣用原形，第三人稱單數加 s", example: "She reads one short text every day.", exampleZh: "她每天讀一篇短文。" },
  { id: "past", name: "過去簡單式", zh: "已發生的事用過去式", example: "I finished a short paragraph yesterday.", exampleZh: "我昨天寫完一小段。" },
  { id: "article", name: "a / an", zh: "可數單數名詞前面要有 a 或 an", example: "I need a clear topic sentence.", exampleZh: "我需要一個清楚的主題句。" },
  { id: "compare", name: "比較級", zh: "短形容詞加 er，長的用 more", example: "Morning is better than late night for me.", exampleZh: "對我來說，早上比深夜好。" },
  { id: "opinion", name: "意見句", zh: "In my opinion 後面接完整句子", example: "In my opinion, vocabulary decides reading speed.", exampleZh: "我認為，單字量決定閱讀速度。" },
];

export const PARTICLES = [
  { id: "wa", blank: "私＿＿学生です。", reading: "わたしはがくせいです。", zh: "我是學生。", answer: "は", why: "主題用 は。這個 は 讀 wa，不讀 ha。" },
  { id: "wo", blank: "水＿＿飲みます。", reading: "みずをのみます。", zh: "喝水。", answer: "を", why: "動作的對象用 を。這個 を 讀 o。" },
  { id: "ni", blank: "学校＿＿行きます。", reading: "がっこうにいきます。", zh: "去學校。", answer: "に", why: "目的地用 に。学校に＝去學校。" },
  { id: "no", blank: "私＿＿本です。", reading: "わたしのほんです。", zh: "是我的書。", answer: "の", why: "「誰的東西」用 の。私の本＝我的書。" },
  { id: "mo", blank: "明日＿＿行きます。", reading: "あしたもいきます。", zh: "明天也去。", answer: "も", why: "「也」用 も。明日も＝明天也。" },
];

export const READINGS = [
  {
    id: "asa-hon",
    text: "わたしはがくせいです。まいあさほんをよみます。ほんはおもしろいです。",
    reading: "わたしはがくせいです。まいあさほんをよみます。ほんはおもしろいです。",
    zh: "我是學生。每天早上看書。書很有趣。",
    stem: "這個人每天早上做什麼？",
    choices: ["喝水", "看書", "去學校", "睡覺"],
    answer: "看書",
    why: "まいあさほんをよみます。まいあさ讀 まいあさ，是每天早上。よみます是讀、看。",
  },
  {
    id: "gakkou",
    text: "きょうはげつようびです。わたしはがっこうにいきます。せんせいにあいます。",
    reading: "きょうはげつようびです。わたしはがっこうにいきます。せんせいにあいます。",
    zh: "今天是星期一。我去學校。我和老師見面。",
    stem: "這個人今天去哪裡？",
    choices: ["學校", "家裡", "商店", "車站"],
    answer: "學校",
    why: "がっこうにいきます。がっこう是學校，に行きます是去。",
  },
];

export const IELTS_PASSAGES = [
  {
    id: "keep-reading",
    text: "Many students stop reading when they meet unknown words. A better habit is to mark the word and keep reading for the main idea.",
    zh: "很多學生一遇到不認識的字就停下來。比較好的習慣是先把那個字做記號，然後繼續讀，抓住主旨。",
    stem: "作者認為學生應該怎麼做？",
    choices: ["每個生字都停下來查", "先繼續讀，抓住主旨", "不要讀長文", "只背單字、不讀文章"],
    answer: "先繼續讀，抓住主旨",
    why: "keep reading for the main idea 的意思是為了主旨繼續讀下去。mark the word 只是做記號，不是立刻停住。",
  },
  {
    id: "topic-sentence",
    text: "A strong paragraph begins with a topic sentence. The next sentences give a reason and one example. The last sentence returns to the same idea.",
    zh: "有力的段落用主題句開頭。後面的句子給一個理由和一個例子。最後一句回到同一個想法。",
    stem: "這段話的主旨是什麼？",
    choices: ["段落要有主題句、理由和例子", "例子應該放在第一句", "理由可有可無", "一段話只要一個單字"],
    answer: "段落要有主題句、理由和例子",
    why: "topic sentence、a reason and one example 就是主題句、理由和例子。這是整段的結構，不是只講一個單字。",
  },
];
