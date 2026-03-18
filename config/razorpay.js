const Razorpay = require("razorpay");

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error(
    "[razorpay] Missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET. " +
      "Set them in farmizo-backend/.env and restart the server.",
  );
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

module.exports = razorpay;
