# Lingostep 語階｜CI v2

解壓整包後，開啟 Lingostep-Brand-Guide.html。英日文工作站採一列三位角色：小步 Koto 是品牌主角，Pip 是英文夥伴，Nami 是日文夥伴。工作名稱尚未進行商標查驗。

| 資料夾 | 內容 |
| --- | --- |
| 01-mascots | 三人同列的 PNG／SVG、概念圖、三人各三種表情的獨立透明 PNG 與 SVG。 |
| 02-logo | 雙語主標、反白、單色及相應圖標。提供字標 PNG 及 SVG；SVG 保留可編輯文字，正式交印可依原字型轉外框。 |
| 03-app-icons | 16 到 1024 px 的 PNG、ICO、SVG、Android 自適應前後景設計。 |
| 04-ui-icons | 聽力、閱讀、文法、口說、寫作，及四種狀態圖示。 |
| 05-fonts | Lilita One、Manrope、Noto Sans TC、Noto Sans JP TTF 與各自的 OFL 授權。變動字體在字重軸上切換。 |
| 06-design-tokens | 色彩、字體、字級、間距、圓角、觸控尺寸的 CSS／JSON，以及 CSS 字型載入設定。 |
| 07-templates | 1080 × 1350 社群貼文、1920 × 1080 橫幅的可編輯 SVG。 |

應用於設計軟體時，可安裝 05-fonts 的每套 TTF。套用網頁時請載入 fonts.css 與 tokens.css，並在日文句子設定 lang="ja"。大字標用 Lilita One，長篇教材與介面使用相應的內文字體。字型分發時保留各自的授權檔。交付包內含完整 TTF，可在上線專案按實際字元需求另行優化網頁載入。

- [Lilita One](https://fonts.google.com/specimen/Lilita+One)
- [Manrope](https://fonts.google.com/specimen/Manrope)
- [Noto Sans TC](https://fonts.google.com/specimen/Noto+Sans+TC)
- [Noto Sans JP](https://fonts.google.com/specimen/Noto+Sans+JP)
