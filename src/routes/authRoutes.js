// src/routes/authRoutes.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { JWT_SECRET, JWT_EXPIRES } from "../config.js";

const router = Router();

const colorOf = (name) => {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h},70%,55%)`;
};

// Registro (permite admin bajo bandera/env o si username="admin")
router.post("/register", async (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password) return res.status(400).json({ ok: false, error: "username y password requeridos" });
  if (await User.findOne({ username })) return res.status(409).json({ ok: false, error: "Usuario existente" });

  const passHash = await bcrypt.hash(password, 10);
  const allowAdmin = process.env.ALLOW_ADMIN_REGISTER === "true" || username === "admin";
  const finalRole = (allowAdmin && role === "admin") ? "admin" : (username === "admin" ? "admin" : "user");

  const user = await User.create({ username, passHash, role: finalRole, color: colorOf(username) });
  res.json({ ok: true, user: { _id: user._id, username: user.username, role: user.role, color: user.color } });
});

// Login -> token
router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ ok: false, error: "Credenciales inválidas" });
  const ok = await bcrypt.compare(password, user.passHash);
  if (!ok) return res.status(401).json({ ok: false, error: "Credenciales inválidas" });
  const token = jwt.sign({ _id: user._id.toString(), username: user.username, role: user.role, color: user.color }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.json({ ok: true, token });
});

// Perfil
router.get("/me", (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ ok: true, user: payload });
  } catch {
    res.status(401).json({ ok: false, error: "No autorizado" });
  }
});

export default router;