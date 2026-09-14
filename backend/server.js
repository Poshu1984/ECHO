import "dotenv/config";
import express from "express";
import cors from "cors";
import ttsRouter from "./routes/tts.js";

const app = express();
const port = process.env.PORT || 3000;

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
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use("/api/tts", ttsRouter);

app.listen(port, "0.0.0.0", () => {
  console.log(`TTS proxy listening on port ${port}`);
});
