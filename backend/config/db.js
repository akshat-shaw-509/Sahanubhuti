// backend/config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  // Accept either variable name — whichever is set in the environment
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌  MongoDB connection error: No URI found. Set MONGO_URI or MONGODB_URI in environment variables.");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌  MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
