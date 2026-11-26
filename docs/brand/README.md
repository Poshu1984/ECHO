# Lingostep 語階 · CI v2（repo 內使用說明）

品牌素材放在 `frontend/public/brand/`（權利聲明見該資料夾的 `NOTICE.md`）：

| 資料夾 | 內容 |
| --- | --- |
| `logo/` | 雙語字標（主要、反白、單色）與圖標。App 內字標使用 PNG（`<img>` 載入的 SVG 不會帶網頁字型）。 |
| `mascots/` | Koto（主角）、Pip（英文夥伴）、Nami（日文夥伴）各三種表情：hello（開始）、focus（準備與訂正）、celebrate（一輪結束）。 |
| `app/` | 16–1024 px App 圖示、favicon、Android 自適應前後景，以及由前後景合成的 maskable 圖示。 |
| `icons/` | CI 的技能圖示（聽、讀、文法、說、寫）與狀態圖示（已掌握、待複習、容易混淆、待加強）。狀態圖示只用於狀態。 |
| `icons-extra/` | 依 CI 線寬補畫的導覽圖示（書籤、獎盃、測驗、對話、齒輪、地球、引號），待設計方提供正式版。 |

設計 tokens：`docs/brand/tokens.css`、`tokens.json`；App 內對應在 `frontend/src/index.css` 的「Lingostep 語階 · CI v2 theme」段落。

故事角色資料由 `frontend/scripts/build-mascots.mjs` 從 `mascots/*.svg` 產生 `frontend/src/brandMascots.js`；更新角色 SVG 後執行 `node scripts/build-mascots.mjs`。

字型：Lilita One（字標、角色名）、Manrope（英文介面）、Noto Sans TC（繁中）、Noto Sans JP（日文，元素需設 `lang="ja"`）。目前由 Google Fonts 載入。
