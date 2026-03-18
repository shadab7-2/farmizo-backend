const crypto = require("crypto");
const Order = require("../models/order.model");
const ApiError = require("../utils/ApiError");

// Razorpay webhook signature check (HMAC SHA256 of raw body with webhook secret)
const verifyWebhook = (payload, signature) => {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "")
    .update(payload)
    .digest("hex");
  return expected === signature;
};

exports.handleRazorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const payload =
      Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body || {});
    const body =
      Buffer.isBuffer(req.body) && payload ? JSON.parse(payload) : req.body;

    if (!verifyWebhook(payload, signature)) {
      throw new ApiError(400, "Invalid webhook signature");
    }

    const event = body?.event;
    const payment = body?.payload?.payment?.entity;
    const refund = body?.payload?.refund?.entity;

    if (event === "payment.captured" && payment) {
      await Order.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        {
          paymentStatus: "paid",
          paymentMethod: "razorpay",
          razorpayPaymentId: payment.id,
          orderStatus: "confirmed",
          $push: { statusTimeline: { status: "confirmed", date: new Date() } },
        },
      );
    }

    if (event === "payment.failed" && payment) {
      await Order.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        {
          paymentStatus: "failed",
          orderStatus: "cancelled",
          $push: { statusTimeline: { status: "cancelled", date: new Date() } },
        },
      );
    }

    if (event === "refund.created" && refund) {
      await Order.findOneAndUpdate(
        { razorpayPaymentId: refund.payment_id },
        {
          paymentStatus: "refunded",
          refundStatus: "refunded",
          orderStatus: "cancelled",
          $push: { statusTimeline: { status: "cancelled", date: new Date() } },
        },
      );
    }

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};
