const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true, trim: true },
  image: String,
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
});

const shippingSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "Order must contain at least one item",
      },
    },

    shippingAddress: {
      type: shippingSchema,
      required: true,
    },

    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    shippingCost: { type: Number, required: true, min: 0 },
    finalAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    couponCode: { type: String, default: "", trim: true, uppercase: true },

    paymentMethod: {
      type: String,
      enum: ["razorpay", "cod"],
      default: "cod",
      lowercase: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      lowercase: true,
    },

    orderNotes: { type: String, default: "", trim: true },

    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    refundStatus: {
      type: String,
      enum: ["none", "initiated", "refunded"],
      default: "none",
      lowercase: true,
    },

    orderStatus: {
  type: String,
  enum: [
    "placed",
    "confirmed",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ],
  default: "placed",
},
    statusTimeline: [
      {
        status: {
          type: String,
          enum: [
            "placed",
            "confirmed",
            "shipped",
            "out_for_delivery",
            "delivered",
            "cancelled",
          ],
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
