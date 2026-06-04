// Login / signup success par JWT token bhejna
const jwt = require("jsonwebtoken");

const sendToken = (user, statusCode, res, message) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
    },
  });
};

module.exports = sendToken;
