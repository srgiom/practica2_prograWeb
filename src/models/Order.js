import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1
        }
      }
    ],
    total: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "completed"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);