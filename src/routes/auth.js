const express = require("express");
const { succeeded, failed } = require("../response");
const { Op } = require("sequelize");
const joi = require("joi");

const authRouter = express.Router();
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const { generateJWTToken, sendEmail, generateOTP } = require("../commonUtils");
const { userModel } = require("../config/db");

authRouter.post("/signUp", async (req, res) => {
  try {
    const schema = joi.object({
      email: joi.string().required(),
      password: joi
        .string()
        .required()
        .pattern(
          new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{8,}$")
        )
        .message(
          "Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one digit, and one special character"
        ),
      firstName: joi.string().min(3).max(255).required(),
      lastName: joi.string().min(3).max(255).required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return failed(
        res,
        400,
        error.details.map((d) => d.message)[0].replace(/"/g, "")
      );
    }
    const { email, password, firstName, lastName } = req.body;
    const OTP = generateOTP();
    const hashPassword = await bcrypt.hash(password, 10);
    await userModel.create({
      id: uuidv4(),
      email,
      password: hashPassword,
      firstName,
      lastName,
      OTP,
    });

    // Example usage:
    // await sendEmail(
    //   email,
    //   "Email Verification",
    //   "<p>Hello {email} ,\n Your email verification code is {OTP}</p>"
    // );
    return succeeded(res, 200, "User created successfully");
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      // Check for specific unique constraint violations
      if (error.errors && Array.isArray(error.errors)) {
        for (err of error.errors) {
          if (err.type === "unique violation" && err.path === "email") {
            console.error("An error occurred: email must be unique");
            return failed(res, 400, err.message);
          } else if (
            err.type === "unique violation" &&
            err.path === "phoneNumber"
          ) {
            return failed(res, 400, err.message);
          }
        }
      }
    }
    return failed(res, 500, "Internal server error.");
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const schema = joi.object({
      email: joi.string().email().required(),
      password: joi
        .string()
        .required()
        .pattern(
          new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{8,}$")
        )
        .message(
          "Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one digit, and one special character"
        ),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return failed(
        res,
        400,
        error.details.map((d) => d.message)[0].replace(/"/g, "")
      );
    }
    const { email, password } = req.body;
    const userData = await userModel.findOne({
      where: { email },
      raw: true,
    });
    if (userData) {
      if (await bcrypt.compare(password, userData.password)) {
        if (!userData.isEmailVerified) {
          return failed(res, 400, "Please verify your email first.");
        }
        const token = await generateJWTToken(
          { email: userData.email, userId: userData.id },
          "1h"
        );
        return succeeded(res, 200, "User login successfully.", {
          token,
        });
      } else {
        return failed(res, 400, "Wrong password");
      }
    } else {
      return failed(res, 400, "User not found.");
    }
  } catch (error) {
    return failed(res, 500, "Internal server error.");
  }
});

authRouter.post("/verifyEmail", async (req, res) => {
  try {
    const schema = joi.object({
      email: joi.string().email().required(),
      OTP: joi.string().required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return failed(
        res,
        400,
        error.details.map((d) => d.message)[0].replace(/"/g, "")
      );
    }
    const { email, OTP } = req.body;
    const userData = await userModel.findOne({
      where: { email },
      raw: true,
    });
    if (userData) {
      if (userData.isEmailVerified) {
        return failed(res, 400, "Your email is already verified.");
      }
      if (userData.email == email && userData.OTP == OTP) {
        await userModel.update(
          {
            OTP: "",
            isEmailVerified: true,
          },
          {
            where: { email },
          }
        );
        return succeeded(res, 200, "User verification successfully.", {});
      } else {
        return failed(res, 400, "Invalid OTP");
      }
    } else {
      return failed(res, 400, "User not found.");
    }
  } catch (error) {
    return failed(res, 500, "Internal server error.");
  }
});

module.exports = authRouter;
