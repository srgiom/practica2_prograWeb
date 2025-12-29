import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, trim: true },
  passHash: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  color: { type: String, default: null } // para el chat
}, { timestamps: true });

export default mongoose.model("User", userSchema);