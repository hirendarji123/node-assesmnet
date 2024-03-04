"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bookingRouter = require("./src/routes/booking");
const authRouter = require("./src/routes/auth");
const { verifyToken } = require("./src/commonUtils");
require("./src/config/db");
const { failed } = require("./src/response");

app.use(bodyParser.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send(`Welocme to Demo app`);
});

//routing
app.use("/auth", authRouter);
app.use("/booking", verifyToken, bookingRouter);
app.all("/*", (req, res) => failed(res, 404, "No matching route found."));

app.listen(process.env.PORT || 3000, () => {
  console.log(`server start at http://localhost:${process.env.PORT || 3000}`);
});
