// src/routes/chatRoutes.js
import { Router } from "express";

const router = Router();

/**
 * Ruta de salud del chat/API (útil para pruebas automáticas).
 */
router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "chat", ts: Date.now() });
});

/**
 * Si en algún momento quieres exponer el número de conectados por HTTP,
 * puedes inyectarlo desde server.js: app.set('usercount', n)
 */
router.get("/usercount", (req, res) => {
  const n = req.app.get("usercount") || 0;
  res.json({ ok: true, usercount: n });
});

export default router;