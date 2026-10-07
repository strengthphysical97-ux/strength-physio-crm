const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const User = require("./models/User");

const EMAIL = "lakshaychaudhary342@gmial.com";
const NEW_PASSWORD = "Lakshay@2026CRM";

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB Connected");

    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

    const user = await User.findOneAndUpdate(
      { email: EMAIL },
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      console.log("User not found");
    } else {
      console.log("Password reset successfully");
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

resetPassword();