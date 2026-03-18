const express = require("express");
const rateLimit = require("express-rate-limit");
const paymentController = require("../controllers/payment.controller");
const webhookController = require("../controllers/webhook.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

router.post("/create-order", protect, limiter, paymentController.createRazorpayOrder);
router.post("/verify", protect, limiter, paymentController.verifyPayment);
router.post("/cod", protect, limiter, paymentController.createCODOrder);

// Webhook uses raw body configured in server.js
router.post("/webhook", limiter, webhookController.handleRazorpayWebhook);

module.exports = router;
