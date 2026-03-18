const express = require("express");
const router = express.Router();

const {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  changePassword,
  setDefaultAddress,
  getAddresses,
} = require("../controllers/user.controller");

const { protect } = require("../middlewares/auth.middleware");

// ==========================
// User Routes
// ==========================

// GET /api/users/profile
router.get("/profile", protect, getProfile);

// GET /api/users/address (list addresses)
router.get("/address", protect, getAddresses);
router.get("/addresses", protect, getAddresses);

// PUT /api/users/profile
router.put("/profile", protect, updateProfile);

// PUT /api/users/change-password
router.put("/change-password", protect, changePassword);

// Address book
router.post("/addresses", protect, addAddress);
router.post("/address", protect, addAddress); // alias per spec
router.put("/addresses/:id", protect, updateAddress);
router.put("/address/:id", protect, updateAddress);
router.delete("/addresses/:id", protect, deleteAddress);
router.delete("/address/:id", protect, deleteAddress);
router.put("/address/:id/default", protect, setDefaultAddress);
router.put("/addresses/:id/default", protect, setDefaultAddress);

module.exports = router;
