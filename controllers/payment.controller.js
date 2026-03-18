const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const Order = require("../models/order.model");
const orderService = require("../services/order.service");
const ApiError = require("../utils/ApiError");

/* =========================================================
   Create Razorpay Order (client uses order_id for Checkout.js)
========================================================= */
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ApiError(400, "Invalid amount");
    }

    // Razorpay expects amount in the smallest currency unit (paise)
    const rpOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: `ord_${Date.now()}`,
      payment_capture: 1,
    });

    res.status(200).json({
      success: true,
      data: { orderId: rpOrder.id, amount: rpOrder.amount, currency: rpOrder.currency },
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   Verify Razorpay Signature + mark order paid
========================================================= */
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      throw new ApiError(400, "Missing payment verification fields");
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    // Signature check from Razorpay docs (HMAC SHA256 over order|payment)
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new ApiError(400, "Signature mismatch");
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: "paid",
        paymentMethod: "razorpay",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        orderStatus: "confirmed",
        $push: { statusTimeline: { status: "confirmed", date: new Date() } },
      },
      { new: true },
    );

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   Cash on Delivery Order
========================================================= */
exports.createCODOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.user._id, {
      ...req.body,
      paymentMethod: "cod",
      paymentStatus: "pending",
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};
