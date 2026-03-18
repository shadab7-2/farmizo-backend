// ==============================
// Load environment variables
// ==============================
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const errorHandler = require("./middlewares/error.middleware");
const apiRoutes = require("./routes");

// ==============================
// Create Express App
// ==============================
const app = express();

// ==============================
// Global Middlewares
// ==============================
// Razorpay webhooks need raw body; register before express.json
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

// Skip json parser for webhook route (uses raw body)
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payment/webhook") return next();
  return express.json()(req, res, next);
});
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

// ==============================
// API Routes
// ==============================
app.use("/api", apiRoutes);

// ==============================
// Root Route (Health Check)
// ==============================
app.get("/", (req, res) => {
  res.status(200).send("Farmizo Backend API Running 🌱");
});

// ==============================
// Error Handler (LAST)
// ==============================
app.use(errorHandler);

// ==============================
// Connect DB + Start Server
// ==============================
const PORT = process.env.SERVER_PORT || 5000;

connectDB();

// Start scheduled jobs
require("./jobs/cartReminder.job");

app.listen(PORT, () => {
  console.log(
    `🚀 Server running at ${
      process.env.SERVER_URL ||
      `http://localhost:${PORT}`
    }`
  );
});
