# Echo Studio

LANGUAGE × YOUR FUTURE · 學習，讓世界聽見你。

GitHub 倉庫名稱是 `ECHO`（https://github.com/Poshu1984/ECHO）。產品名稱是 **Echo Studio**。瀏覽器只打自家 API；TTS 與模型金鑰留在後端。帳號登入、積分解鎖、PWA。

最高權限帳號由環境變數設定（不要把真實密碼提交到 git）：

- `ECHOO_ADMIN_USER`
- `ECHOO_ADMIN_PASSWORD`
- `JWT_SECRET`

## 資料夾

- `frontend/` — Vite + React
- `backend/` — Express TTS 代理

## 後端

```bash
cd backend
copy .env.example .env
# 把 GOOGLE_TTS_API_KEY 換成你的金鑰（不要提交 .env）
npm install
npm run dev
```

預設 `http://localhost:3000`

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/health` | 健康檢查 `{ ok: true }` |
| GET | `/api/tts/voices?languageCode=en-US` | 語音列表 |
| POST | `/api/tts/synthesize` | 合成語音（SSML + timepoints） |

正式環境（Railway）請設定：`GOOGLE_TTS_API_KEY`、`ANTHROPIC_API_KEY`、`JWT_SECRET`、`ECHOO_ADMIN_USER`、`ECHOO_ADMIN_PASSWORD`、`FRONTEND_URL`。

## 前端

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

`VITE_API_URL` 開發時為 `http://localhost:3000`，正式環境改成 Railway 後端網址。

## Railway

同一個 GitHub repo（`Poshu1984/ECHO`）建兩個服務：

1. 到 [Railway](https://railway.app) 用 GitHub 登入 → **New Project** → **Empty project**，專案名稱可設為 `Echo Studio`。
2. 新增兩個 Empty service，改名為 `backend` 與 `frontend`。
3. 兩個服務都連到 GitHub repo `ECHO`：
   - `backend` → Root Directory：`/backend`
   - `frontend` → Root Directory：`/frontend`
4. 兩個服務都按 **Generate Domain**。
5. 變數（名稱必須和服務名稱一致）：
   - **backend**
     - `GOOGLE_TTS_API_KEY` = 你的金鑰（只填在 Railway，不要提交到 git）
     - `ANTHROPIC_API_KEY` = Claude Sonnet（主）
     - `GOOGLE_GEMINI_API_KEY` = Gemini（輔；可先省略，系統會嘗試同一把 Google key）
     - `JWT_SECRET` = 隨機長字串
     - `ECHOO_ADMIN_USER` = `poshu`
     - `ECHOO_ADMIN_PASSWORD` = 你的管理員密碼
     - `FRONTEND_URL` = `https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}`
   - **frontend**
     - `VITE_API_URL` = `https://${{backend.RAILWAY_PUBLIC_DOMAIN}}`
6. Deploy。前端的 `VITE_API_URL` 是 **build 時** 寫進去的，改變數後要重新部署 frontend。

健康檢查路徑：`/api/health`。
