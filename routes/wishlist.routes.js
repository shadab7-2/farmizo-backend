const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const {
  addToWishlist,
  removeFromWishlist,
  getMyWishlist,
  clearWishlist,
} = require("../controllers/wishlist.controller");

const router = express.Router();

router.use(protect);

router.post("/", addToWishlist);
router.delete("/:productId", removeFromWishlist);
router.get("/", getMyWishlist);
router.delete("/", clearWishlist);

module.exports = router;
