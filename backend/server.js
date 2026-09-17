import "./loadEnv.js";
import express from "express";
import cors from "cors";
import ttsRouter from "./routes/tts.js";
import llmRouter from "./routes/llm.js";
import authRouter from "./routes/auth.js";
import progressRouter from "./routes/progress.js";
import { seedAdmin, authMiddleware } from "./store.js";
import { configuredKey } from "./llmModels.js";

const app = express();
const port = process.env.PORT || 3000;
const ttsConfigured = Boolean(configuredKey("GOOGLE_TTS_API_KEY"));
const claudeConfigured = Boolean(configuredKey("ANTHROPIC_API_KEY"));
const geminiConfigured = Boolean(configuredKey("GOOGLE_GEMINI_API_KEY", "GOOGLE_TTS_API_KEY"));
const llmConfigured = claudeConfigured || geminiConfigured;

function normalizeOrigin(url) {
  if (!url) return "";
  const trimmed = String(url).replace(/\/$/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const allowedOrigins = [
  "http://localhost:5173",
  normalizeOrigin(process.env.FRONTEND_URL),
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
  }),
);

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  try {
    res.json({ ok: true, ttsConfigured, llmConfigured, claudeConfigured, geminiConfigured });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/progress", progressRouter);
app.use("/api/tts", authMiddleware, ttsRouter);
app.use("/api/llm", authMiddleware, llmRouter);

seedAdmin()
  .catch((error) => {
    console.error("seedAdmin failed; API will still start", error);
  })
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`ECHOO API on ${port} tts=${ttsConfigured} llm=${llmConfigured}`);
    });
  });
