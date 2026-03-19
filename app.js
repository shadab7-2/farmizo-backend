require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const errorHandler = require("./middlewares/error.middleware");
const apiRoutes = require("./modules");

const app = express();

// Razorpay webhook needs raw body
app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// JSON parser except for webhook
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payment/webhook") return next();
  return express.json()(req, res, next);
});

app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

// API routes
app.use("/api", apiRoutes);

// Health check
app.get("/", (req, res) => {
  res.status(200).send("Farmizo Backend API Running 🌱");
});

// Error handler (last)
app.use(errorHandler);

module.exports = app;
