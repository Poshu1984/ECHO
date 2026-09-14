# ECHOO

全端語言學習家教：React（Vite）前端 + Express 後端。後端只負責安全代理 Google Cloud Text-to-Speech，API 金鑰只存在後端環境變數。

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

正式環境（Railway）請設定：`GOOGLE_TTS_API_KEY`、`PORT`、`FRONTEND_URL`。

## 前端

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

`VITE_API_URL` 開發時為 `http://localhost:3000`，正式環境改成 Railway 後端網址。
