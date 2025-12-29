// src/server.js
import express from "express";
import http from "http";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";

import { PORT, MONGO_URI, JWT_SECRET } from "./config.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import User from "./models/User.js";
import ChatMessage from "./models/ChatMessage.js";

const app = express();

/* ----------------------------- Middlewares HTTP ---------------------------- */
app.use(cors({ origin: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.static("src/public")); // sirve frontend y /public estáticos

/* --------------------------------- Rutas ----------------------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/chat", chatRoutes); // /api/chat/health, /api/chat/usercount

app.get("/health", (_req, res) => res.json({ ok: true }));

/* ------------------- Subida de imágenes del chat (BASE64) ------------------ */
// Usamos memoria: no escribe a disco, apto para Render sin almacenamiento
const uploadChat = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 } // 500 KB por imagen (ajusta si quieres)
});

// Devuelve data URL (base64) para que el frontend la envíe por socket y se persista en Mongo
app.post("/api/chat/upload", uploadChat.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: "Sin archivo" });
  const mime = req.file.mimetype || "image/jpeg";
  const dataUrl = `data:${mime};base64,${req.file.buffer.toString("base64")}`;
  res.json({ ok: true, url: dataUrl });
});

/* ------------------------- Middleware global de errores -------------------- */
app.use((err, _req, res, _next) => {
  console.error("❌ Error:", err?.message || err);
  const status = err.status || 500;
  res.status(status).json({ ok: false, error: err.message || "Error interno" });
});

/* -------------------------- HTTP server + Socket.IO ------------------------ */
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000"
      // añade otros orígenes si usas Vite/Live Server:
      // "http://localhost:5173", "http://127.0.0.1:5500"
    ]
  }
});

// Autenticación por JWT en el handshake de Socket.IO
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Falta token"));
    const payload = jwt.verify(token, JWT_SECRET);
    socket.data.user = payload; // {_id, username, role, color}
    next();
  } catch {
    next(new Error("Token inválido"));
  }
});

let connected = 0;

io.on("connection", async (socket) => {
  connected++;
  app.set("usercount", connected);
  io.emit("usercount", connected);

  // Historial (últimos 20 mensajes en orden cronológico)
  const history = await ChatMessage.find().sort({ ts: -1 }).limit(20);
  socket.emit("history", history.reverse());

  // Mensaje de join a otros usuarios (no al propio)
  socket.broadcast.emit("system", {
    kind: "join",
    text: `🟢 ${socket.data.user.username} se ha unido`
  });

  // Indicador "escribiendo..."
  socket.on("typing", (isTyping) => {
    socket.broadcast.emit("typing", {
      user: socket.data.user.username,
      typing: !!isTyping
    });
  });

  // Mensaje de chat (texto e imagen/base64). Revalidamos token por defensa.
  socket.on("chat message", async (payload = {}) => {
    try {
      jwt.verify(payload.token, JWT_SECRET);

      const msg = {
        user: socket.data.user.username,
        color: socket.data.user.color,
        text: payload.text || "",
        image: payload.image || null, // aquí llega la data URL desde /api/chat/upload
        ts: new Date()
      };

      await ChatMessage.create(msg); // persistencia en Mongo
      io.emit("chat message", msg);  // broadcast a todos
    } catch {
      // ignoramos si el token es inválido/expirado
    }
  });

  socket.on("disconnect", () => {
    connected = Math.max(0, connected - 1);
    app.set("usercount", connected);
    io.emit("usercount", connected);
    socket.broadcast.emit("system", {
      kind: "leave",
      text: `🔴 ${socket.data.user.username} se ha ido`
    });
  });
});

/* ---------------------------- Seeding de admin ----------------------------- */
async function ensureDefaultAdmin() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin";

  // color estable según nombre
  let h = 0;
  for (let i = 0; i < username.length; i++)
    h = (h * 31 + username.charCodeAt(i)) % 360;
  const color = `hsl(${h},70%,55%)`;

  const passHash = await bcrypt.hash(password, 10);
  await User.findOneAndUpdate(
    { username },
    { $set: { role: "admin", passHash, color } },
    { upsert: true }
  );
  console.log(`👑 Admin asegurado: ${username}/${password}`);
}

/* --------------------------------- Arranque -------------------------------- */
(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Mongo conectado");
    await ensureDefaultAdmin();
    server.listen(PORT, () => {
      console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Error al conectar Mongo:", err?.message || err);
    process.exit(1);
  }
})();
