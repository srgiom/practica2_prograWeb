import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  user: { type: String, required: true },
  color: String,
  text: String,
  image: String,       // ruta de la imagen si hay
  ts: { type: Date, default: Date.now }
});

export default mongoose.model("ChatMessage", chatSchema);