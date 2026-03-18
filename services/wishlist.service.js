const mongoose = require("mongoose");
const Wishlist = require("../models/wishlist.model");
const Product = require("../models/product.model");
const ApiError = require("../utils/ApiError");

const sanitizeWishlist = (wishlist) => {
  const products = (wishlist?.products || [])
    .filter((item) => item?.product)
    .map((item) => {
      const productDoc = item.product;
      const isObject = typeof productDoc === "object";
      const id = isObject ? productDoc._id : productDoc;

      return {
        product: isObject
          ? {
              _id: id,
              name: productDoc.name || "",
              slug: productDoc.slug || "",
              price: Number(productDoc.price || 0),
              images: Array.isArray(productDoc.images) ? productDoc.images : [],
              stock: Number(productDoc.stock || 0),
              isActive: productDoc.isActive !== false,
            }
          : { _id: id },
        addedAt: item.addedAt || null,
      };
    });

  return {
    _id: wishlist?._id,
    user: wishlist?.user,
    products,
    count: products.length,
  };
};

const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }
  return wishlist;
};

const getWishlistWithProducts = async (userId) => {
  const wishlist = await getOrCreateWishlist(userId);
  await wishlist.populate({
    path: "products.product",
    select: "name slug price images stock isActive",
  });
  return sanitizeWishlist(wishlist);
};

exports.getWishlist = async (userId) => {
  return getWishlistWithProducts(userId);
};

exports.addProduct = async (userId, productId) => {
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product id");
  }

  const product = await Product.findById(productId).select("_id isActive");
  if (!product || product.isActive === false) {
    throw new ApiError(404, "Product not found");
  }

  const wishlist = await getOrCreateWishlist(userId);
  const exists = wishlist.products.some(
    (item) => item.product.toString() === productId.toString(),
  );

  if (!exists) {
    wishlist.products.push({
      product: product._id,
      addedAt: new Date(),
    });
    await wishlist.save();
  }

  await wishlist.populate({
    path: "products.product",
    select: "name slug price images stock isActive",
  });

  return sanitizeWishlist(wishlist);
};

exports.removeProduct = async (userId, productId) => {
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product id");
  }

  const wishlist = await getOrCreateWishlist(userId);
  wishlist.products = wishlist.products.filter(
    (item) => item.product.toString() !== productId.toString(),
  );
  await wishlist.save();

  await wishlist.populate({
    path: "products.product",
    select: "name slug price images stock isActive",
  });

  return sanitizeWishlist(wishlist);
};

exports.clearWishlist = async (userId) => {
  const wishlist = await getOrCreateWishlist(userId);
  wishlist.products = [];
  await wishlist.save();
  return sanitizeWishlist(wishlist);
};
