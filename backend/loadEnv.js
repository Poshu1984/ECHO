import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), ".env");
const parsed = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};

for (const [key, value] of Object.entries(parsed)) {
  const current = (process.env[key] || "").trim();
  if (!current || current === "your_key_here") {
    process.env[key] = value;
  }
}
