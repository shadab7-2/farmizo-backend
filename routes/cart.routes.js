const express = require("express");
const {protect } = require("../middlewares/auth.middleware");

const {
  getMyCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cart.controller.js");

const router = express.Router();

router.use(protect); // All routes protected

router.get("/", getMyCart);
router.post("/", addToCart);
router.patch("/:itemId", updateCartItem);
router.delete("/:itemId", removeCartItem);
router.delete("/", clearCart);

module.exports = router;
