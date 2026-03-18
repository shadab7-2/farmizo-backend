const mongoose = require("mongoose");

const serviceablePincodeSchema = new mongoose.Schema(
  {
    pincode: { type: String, required: true, unique: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    deliveryDays: { type: Number, required: true, min: 1 },
    codAvailable: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ServiceablePincode", serviceablePincodeSchema);
