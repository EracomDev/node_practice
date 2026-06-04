// MongoDB se connect karne ka code — ek jagah rakha taaki baar-baar na likhna pade
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // process.env se .env file ki values aati hain
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1); // DB nahi mila to server band
  }
};

module.exports = connectDB;
