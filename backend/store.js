import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const usersPath = path.join(dataDir, "users.json");

import { planOf, usageOf, periodKey, PLANS } from "./plans.js";

const JWT_SECRET = process.env.JWT_SECRET || "echoo-dev-secret-change-me";
const ADMIN_USER = process.env.ECHOO_ADMIN_USER || "poshu";
const ADMIN_PASS = process.env.ECHOO_ADMIN_PASSWORD || "";

export function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(usersPath)) fs.writeFileSync(usersPath, "[]");
}

function readUsers() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(usersPath, "utf8"));
  } catch {
    return [];
  }
}

function writeUsers(users) {
  ensureStore();
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

export async function seedAdmin() {
  if (!ADMIN_PASS) {
    console.warn("ECHOO_ADMIN_PASSWORD is not set; skip admin seed");
    return;
  }
  const users = readUsers();
  let admin =
    users.find((u) => u.username === ADMIN_USER) ||
    users.find((u) => u.id === "admin-root") ||
    users.find((u) => u.role === "admin");
  const hash = await bcrypt.hash(ADMIN_PASS, 10);
  if (!admin) {
    users.push({
      id: "admin-root",
      username: ADMIN_USER,
      passwordHash: hash,
      role: "admin",
      xp: 99999,
      minutes: 0,
      streak: 0,
      unlocked: ["*"],
      plan: "pro",
      usage: { period: periodKey(), tts: 0, llm: 0 },
      createdAt: Date.now(),
    });
    writeUsers(users);
    return;
  }
  admin.username = ADMIN_USER;
  admin.role = "admin";
  admin.passwordHash = hash;
  admin.unlocked = ["*"];
  admin.plan = "pro";
  writeUsers(users);
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, username: user.username }, JWT_SECRET, {
    expiresIn: "14d",
  });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function publicUser(user) {
  const usage = usageOf(user);
  const plan = planOf(user);
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    xp: user.xp || 0,
    minutes: user.minutes || 0,
    streak: user.streak || 0,
    unlocked: user.unlocked || [],
    plan: user.role === "admin" ? "admin" : user.plan || "free",
    quota: {
      ttsUsed: usage.tts,
      llmUsed: usage.llm,
      ttsLimit: plan.tts,
      llmLimit: plan.llm,
      usd: plan.usd,
      period: usage.period,
    },
  };
}

export function findUserByName(username) {
  return readUsers().find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export function findUserById(id) {
  return readUsers().find((u) => u.id === id);
}

export async function createUser(username, password) {
  const users = readUsers();
  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("USERNAME_TAKEN");
  }
  const user = {
    id: `u_${Date.now()}`,
    username,
    passwordHash: await bcrypt.hash(password, 10),
    role: "user",
    xp: 0,
    minutes: 0,
    streak: 0,
    unlocked: [],
    plan: "free",
    usage: { period: periodKey(), tts: 0, llm: 0 },
    createdAt: Date.now(),
  };
  users.push(user);
  writeUsers(users);
  return user;
}

export async function checkPassword(user, password) {
  return bcrypt.compare(password, user.passwordHash);
}

export function saveUser(updated) {
  const users = readUsers();
  const i = users.findIndex((u) => u.id === updated.id);
  if (i < 0) throw new Error("NOT_FOUND");
  users[i] = updated;
  writeUsers(users);
  return users[i];
}

export function listUsers() {
  return readUsers().map(publicUser);
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }
  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "UNAUTHORIZED" });
  }
}

export function adminMiddleware(req, res, next) {
  if (req.auth?.role !== "admin") {
    res.status(403).json({ error: "FORBIDDEN" });
    return;
  }
  next();
}

function quotaError(kind, limit) {
  const err = new Error("QUOTA_EXCEEDED");
  err.kind = kind;
  err.limit = limit;
  return err;
}

export function assertQuota(userId, kind) {
  const user = findUserById(userId);
  if (!user) throw new Error("NOT_FOUND");
  if (user.role === "admin") return user;
  const plan = planOf(user);
  const usage = usageOf(user);
  const limit = kind === "llm" ? plan.llm : plan.tts;
  if (usage[kind] >= limit) throw quotaError(kind, limit);
  return user;
}

export function consumeQuota(userId, kind) {
  const user = assertQuota(userId, kind);
  if (user.role === "admin") return user;
  const usage = usageOf(user);
  user.usage = { period: usage.period, tts: usage.tts, llm: usage.llm };
  user.usage[kind] += 1;
  return saveUser(user);
}

export function setUserPlan(userId, plan) {
  if (!PLANS[plan]) throw new Error("INVALID_PLAN");
  const user = findUserById(userId);
  if (!user) throw new Error("NOT_FOUND");
  user.plan = plan;
  return saveUser(user);
}

export { PLANS };
