// OTP email bhejne ka code (nodemailer)
const nodemailer = require("nodemailer");

const createTransporter = () => {
  // Agar SMTP configure nahi hai to null — dev mein OTP console par dikhega
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendOtpEmail = async (toEmail, otp) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log("----------------------------------------");
    console.log(`DEV MODE — OTP for ${toEmail}: ${otp}`);
    console.log("(SMTP not set in .env — add SMTP_USER & SMTP_PASS for real email)");
    console.log("----------------------------------------");
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Node Practice" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: "Password reset OTP",
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your password reset OTP is: <b>${otp}</b></p><p>Valid for 10 minutes.</p>`,
    });
    console.log(`OTP email sent to ${toEmail}`);
  } catch (error) {
    console.error("SMTP email failed:", error.message);
    throw error; // controller rollback + error response ke liye
  }
};

module.exports = { sendOtpEmail };
