const ServiceablePincode = require("../models/serviceablePincode.model");

exports.checkPincode = async (req, res, next) => {
  try {
    const { pincode } = req.params;
    if (!pincode) {
      return res.status(400).json({ success: false, message: "Pincode is required" });
    }

    const record = await ServiceablePincode.findOne({ pincode: String(pincode).trim() });

    if (!record) {
      return res.status(200).json({ success: true, serviceable: false });
    }

    return res.status(200).json({
      success: true,
      serviceable: true,
      deliveryDays: record.deliveryDays,
      codAvailable: record.codAvailable,
      city: record.city,
      state: record.state,
    });
  } catch (err) {
    next(err);
  }
};
