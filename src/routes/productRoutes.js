// src/routes/productRoutes.js
import { Router } from "express";
import multer from "multer";
import Product from "../models/Product.js";
import { authenticateJWT, authorizeRole } from "../middleware/authenticateJWT.js";

const router = Router();

// Subimos a memoria y convertimos a data URL (base64)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 } // 500 KB (ajusta si quieres)
});

function toDataUrl(file) {
  if (!file) return null;
  const b64 = file.buffer.toString("base64");
  const mime = file.mimetype || "image/jpeg";
  return `data:${mime};base64,${b64}`;
}

// GET /api/products
router.get("/", async (_req, res) => {
  const items = await Product.find().sort({ createdAt: -1 });
  res.json(items);
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ ok: false, error: "No encontrado" });
  res.json(p);
});

// POST crear (admin)
router.post(
  "/",
  authenticateJWT,
  authorizeRole("admin"),
  upload.single("imagen"), // <- el campo del input se llama "imagen"
  async (req, res) => {
    try {
      const { nombre, precio, descripcion } = req.body;
      if (!nombre) return res.status(400).json({ ok: false, error: "Nombre requerido" });

      const p = await Product.create({
        nombre,
        precio: parseFloat(precio),
        descripcion,
        imagen: toDataUrl(req.file) // guardamos la data URL en Mongo
      });

      res.status(201).json(p);
    } catch (e) {
      res.status(400).json({ ok: false, error: "Datos inválidos" });
    }
  }
);

// PUT editar (admin)
router.put(
  "/:id",
  authenticateJWT,
  authorizeRole("admin"),
  upload.single("imagen"),
  async (req, res) => {
    try {
      const body = { ...req.body };
      if (req.file) body.imagen = toDataUrl(req.file);

      const p = await Product.findByIdAndUpdate(
        req.params.id,
        body,
        { new: true, runValidators: true }
      );

      if (!p) return res.status(404).json({ ok: false, error: "No encontrado" });
      res.json(p);
    } catch (e) {
      res.status(400).json({ ok: false, error: "Datos inválidos" });
    }
  }
);

// DELETE eliminar (admin)
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRole("admin"),
  async (req, res) => {
    const p = await Product.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ ok: false, error: "No encontrado" });
    res.json({ ok: true });
  }
);

export default router;
