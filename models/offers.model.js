const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      unique: true,
      index: true,
    },

    description: String,

    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
    },

    minCartValue: {
      type: Number,
      default: 0,
    },

    maxDiscount: {
      type: Number,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    usageLimit: {
      type: Number,
    },

    usedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Offer", offerSchema);
