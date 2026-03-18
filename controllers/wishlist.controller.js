const wishlistService = require("../services/wishlist.service");
const ApiError = require("../utils/ApiError");

exports.getMyWishlist = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      throw new ApiError(401, "Not authorized");
    }

    const wishlist = await wishlistService.getWishlist(req.user._id);
    res.status(200).json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
};

exports.addToWishlist = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      throw new ApiError(401, "Not authorized");
    }

    const { productId } = req.body;
    const wishlist = await wishlistService.addProduct(req.user._id, productId);
    res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
};

exports.removeFromWishlist = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      throw new ApiError(401, "Not authorized");
    }

    const wishlist = await wishlistService.removeProduct(
      req.user._id,
      req.params.productId,
    );
    res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
};

exports.clearWishlist = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      throw new ApiError(401, "Not authorized");
    }

    const wishlist = await wishlistService.clearWishlist(req.user._id);
    res.status(200).json({
      success: true,
      message: "Wishlist cleared",
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
};
