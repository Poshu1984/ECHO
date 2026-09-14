import { Router } from "express";
import { authMiddleware, findUserById, saveUser, publicUser } from "../store.js";

const router = Router();

router.post("/xp", authMiddleware, (req, res) => {
  try {
    const user = findUserById(req.auth.sub);
    if (!user) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }
    const add = Math.max(0, Math.min(200, Number(req.body?.xp) || 0));
    const minutes = Math.max(0, Math.min(30, Number(req.body?.minutes) || 0));
    user.xp = (user.xp || 0) + add;
    user.minutes = (user.minutes || 0) + minutes;
    saveUser(user);
    res.json({ user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
