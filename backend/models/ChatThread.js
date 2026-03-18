// backend/models/ChatThread.js
// Stores chat threads (conversations) per user

const mongoose = require("mongoose");

const chatThreadSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      default: "New chat",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatThread", chatThreadSchema);
