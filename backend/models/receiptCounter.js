// models/Counter.js
import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },  // e.g. "receiptNo"
  seq: { type: Number, default: 1000 }    // starts at 1000, first receipt = 1001
});

export default mongoose.model("Counter", counterSchema);