// User = database mein user ka shape (schema)
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // login ke alawa password response mein mat bhejo
    },
    profileImage: {
      type: String,
      default: null, // jaise "/uploads/profiles/photo.jpg"
    },
    // Forgot password OTP — sirf reset ke time use
    resetOtp: {
      type: String,
      default: null,
    },
    resetOtpExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true } // createdAt, updatedAt auto
);

// Save se pehle password hash karo (plain text DB mein kabhi mat rakho)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Login: typed password vs DB hash compare
userSchema.methods.comparePassword = async function (typedPassword) {
  return bcrypt.compare(typedPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
