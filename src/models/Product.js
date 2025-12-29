// src/models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    precio: { type: Number, required: true, min: 0 },
    descripcion: { type: String, default: "", trim: true },
    imagen: { type: String, default: null } // <<--- IMPORTANTE
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);