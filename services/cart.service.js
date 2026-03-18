const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const ApiError = require("../utils/ApiError");

/* ================= GET OR CREATE CART ================= */
async function getCart(userId) {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  return cart;
}

/* ================= ADD TO CART ================= */
exports.addItem = async (userId, productId, quantity = 1) => {
  const product = await Product.findById(productId);

  if (!product || !product.isActive)
    throw new ApiError(404, "Product not found");
  if (!Number.isFinite(Number(quantity)) || Number(quantity) < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }
  if (product.stock < 1) {
    throw new ApiError(400, "Product is out of stock");
  }

  let cart = await getCart(userId);

  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId
  );
  const finalQuantity = (existingItem?.quantity || 0) + Number(quantity);
  if (finalQuantity > product.stock) {
    throw new ApiError(400, `Only ${product.stock} items available in stock`);
  }

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0],
      price: product.price,
      quantity,
    });
  }

  cart.calculateTotals();
  await cart.save();

  return cart;
};

/* ================= GET CART ================= */
exports.getMyCart = async (userId) => {
  const cart = await getCart(userId);
  return cart;
};

/* ================= REMOVE ITEM ================= */
exports.removeItem = async (userId, productId) => {
  const cart = await getCart(userId);

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId
  );

  cart.calculateTotals();
  await cart.save();

  return cart;
};

/* ================= UPDATE QUANTITY ================= */
exports.updateQuantity = async (userId, productId, quantity) => {
  if (!Number.isFinite(Number(quantity)) || Number(quantity) < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  const product = await Product.findById(productId).select("stock isActive");
  if (!product || !product.isActive) throw new ApiError(404, "Product not found");
  if (Number(quantity) > product.stock) {
    throw new ApiError(400, `Only ${product.stock} items available in stock`);
  }

  const cart = await getCart(userId);

  const item = cart.items.find(
    (i) => i.product.toString() === productId
  );

  if (!item) throw new ApiError(404, "Item not in cart");

  item.quantity = Number(quantity);

  cart.calculateTotals();
  await cart.save();

  return cart;
};

/* ================= CLEAR CART ================= */
exports.clearCart = async (userId) => {
  const cart = await getCart(userId);

  cart.items = [];
  cart.calculateTotals();

  await cart.save();

  return cart;
};
