import { Router } from "express";
import {
  findUserByName,
  createUser,
  checkPassword,
  signToken,
  publicUser,
  findUserById,
  listUsers,
  authMiddleware,
  adminMiddleware,
  setUserPlan,
  PLANS,
} from "../store.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");
    if (username.length < 3 || password.length < 6) {
      res.status(400).json({ error: "INVALID_CREDENTIALS" });
      return;
    }
    const user = await createUser(username, password);
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.message === "USERNAME_TAKEN") {
      res.status(409).json({ error: "USERNAME_TAKEN" });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");
    const user = findUserByName(username);
    if (!user || !(await checkPassword(user, password))) {
      res.status(401).json({ error: "LOGIN_FAILED" });
      return;
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/me", authMiddleware, (req, res) => {
  const user = findUserById(req.auth.sub);
  if (!user) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }
  res.json({ user: publicUser(user) });
});

router.get("/users", authMiddleware, adminMiddleware, (_req, res) => {
  res.json({ users: listUsers() });
});

router.post("/users/:id/plan", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const user = setUserPlan(req.params.id, String(req.body?.plan || ""));
    res.json({ user: publicUser(user), plans: PLANS });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/plans", (_req, res) => {
  res.json({ plans: PLANS });
});

export default router;
