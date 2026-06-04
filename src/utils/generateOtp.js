// 6 digit OTP — forgot / reset password ke liye
const generateOtp = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

module.exports = generateOtp;
