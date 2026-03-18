const express = require("express");
const router = express.Router();
const { checkPincode } = require("../controllers/delivery.controller");

// GET /api/delivery/check/:pincode
router.get("/check/:pincode", checkPincode);

module.exports = router;
