const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  googleId: { type: String, ref: "User", required: false },
  sessionId: { type: String, required: true },
  sender: { type: String, enum: ["user", "ai"], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, expires: "30d" },
});

chatSchema.index({ sessionId: 1 });

module.exports = mongoose.model("Chat", chatSchema);
