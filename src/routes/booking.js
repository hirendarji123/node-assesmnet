const express = require("express");
const { succeeded, failed } = require("../response");
const joi = require("joi");
const { bookingModel } = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const bookingRouter = express.Router();

bookingRouter.post("/", async (req, res) => {
  try {
    const schema = joi.object({
      customerName: joi.string().required(),
      customerEmail: joi.string().email().required(),
      bookingDate: joi.date().required(),
      bookingType: joi
        .string()
        .valid("FullDay", "HalfDay", "Custom")
        .required(),
      bookingSlot: joi.when("bookingType", {
        is: "Half Day",
        then: joi.string().valid("First Half", "Second Half").required(),
        otherwise: joi.any().forbidden(),
      })
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return failed(
        res,
        400,
        error.details.map((d) => d.message)[0].replace(/"/g, "")
      );
    }

    const {
      customerName,
      customerEmail,
      bookingSlot,
      bookingType,
      bookingDate,
    } = schema.validate(req.body);

    const existingBooking = await bookingModel.findOne({
      where: {
        bookingDate,
      },
      raw: true,
    });
    if (existingBooking) {
      // If a booking exists for the same date and type, return false
      if (
        existingBooking.bookingType == "FullDay" &&
        bookingDate == existingBooking.bookingDate
      ) {
        return failed(res, 400, "Already booking is available for date.");
      }
      if (
        existingBooking.bookingType === "HalfDay" ||
        existingBooking.bookingType === "Custom"
      ) {
        if (existingBooking.bookingSlot != bookingSlot) {
          await bookingModel.create({
            id: uuidv4(),
            customerName,
            customerEmail,
            bookingDate,
            bookingType,
            bookingSlot,
            userId: req.user.id,
            bookingTime: new Date().toDateString(),
          });
        } else {
          return failed(res, 400, "Already booking is available for date.");
        }
      }
    }
    await bookingModel.create({
      id: uuidv4(),
      customerName,
      customerEmail,
      bookingDate,
      bookingType,
      bookingSlot,
      userId: req.user.id,
      bookingTime: new Date().toDateString(),
    });
    return succeeded(res, 200, "Your Booking successfully.", response);
  } catch (error) {
    return failed(res, 500, "Internal server error.");
  }
});

module.exports = bookingRouter;
