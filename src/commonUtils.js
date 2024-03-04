const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { userModel } = require("../src/config/db");
const { failed } = require("./response");
require("dotenv").config();

exports.generateJWTToken = async (payload, expiresIn) => {
  try {
    const token = jwt.sign(payload, process.env.JWT_KEY, {
      expiresIn,
    });
    return token;
  } catch (err) {
    throw err;
  }
};

exports.verifyToken = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return failed(res, 400, "Please provide authorization in header");
    }
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const userDetails = await userModel.findOne({
      where: { id: decoded.userId },
      raw: true,
    });
    if (userDetails) {
      delete userDetails["password"];
      req.user = userDetails;
      next();
    }
  } catch (err) {
    console.log("🚀 ~ exports.verifyToken= ~ catch:",err)
    return failed(res, 400, "Invalid token");
  }
};

exports.generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
};

exports.sendEmail = async (receiverEmail, subject, message) => {
  try {
    // Create a transporter
    let transporter = nodemailer.createTransport({
      service: process.env.MAIL_SERVICE,
      auth: {
        user: process.env.MAIL_AUTH_USER, // your email
        pass: process.env.MAIL_AUTH_PASSWORD, // your password
      },
    });

    // Send mail with defined transport object
    let info = await transporter.sendMail({
      from: process.env.MAIL_FROM, // sender address
      to: receiverEmail, // list of receivers
      subject: subject, // Subject line
      html: message, // HTML body
    });


  } catch (error) {
    console.error("Error occurred while sending email:", error);
  }
};

