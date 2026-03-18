const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const ApiError = require("../utils/ApiError");

/* ======================================================
   GET MY CART
====================================================== */
exports.getMyCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
    );

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [],
      });
    }

    cart.calculateTotals();
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

/* ======================================================
   ADD TO CART
====================================================== */
exports.addToCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const quantity = Number(req.body.quantity) || 1;

    if (!productId) throw new ApiError(400, "Product id is required");
    if (!Number.isFinite(quantity) || quantity < 1) {
      throw new ApiError(400, "Quantity must be at least 1");
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) throw new ApiError(404, "Product not found");
    if (product.stock < 1) {
      throw new ApiError(400, "Product is out of stock");
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [],
      });
    }

    const existing = cart.items.find(
      (i) => i.product.toString() === productId
    );

    const finalQuantity = (existing?.quantity || 0) + quantity;
    if (finalQuantity > product.stock) {
      throw new ApiError(400, `Only ${product.stock} items available in stock`);
    }

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        name: product.name,
        image: product.images?.[0] || "",
        price: product.price,
        quantity,
      });
    }

    cart.calculateTotals();
    await cart.save();

    cart = await cart.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Item added to cart",
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

/* ======================================================
   UPDATE ITEM QUANTITY
====================================================== */
exports.updateCartItem = async (req, res, next) => {
  try {
    const productId = req.params.itemId || req.body.productId;
    const quantity = Number(req.body.quantity);

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) throw new ApiError(404, "Cart not found");
    if (!productId) throw new ApiError(400, "Product id is required");
    if (!Number.isFinite(quantity) || quantity < 1) {
      throw new ApiError(400, "Quantity must be at least 1");
    }

    const item = cart.items.find(
      (i) => i.product.toString() === productId,
    );

    if (!item) throw new ApiError(404, "Item not in cart");

    const product = await Product.findById(productId).select("stock isActive");
    if (!product || !product.isActive) {
      throw new ApiError(404, "Product not found");
    }

    if (quantity > product.stock) {
      throw new ApiError(400, `Only ${product.stock} items available in stock`);
    }

    item.quantity = quantity;

    cart.calculateTotals();
    await cart.save();

    await cart.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Cart updated",
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

/* ======================================================
   REMOVE ITEM
====================================================== */
exports.removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) throw new ApiError(404, "Cart not found");
    if (!itemId) throw new ApiError(400, "Product id is required");

    cart.items = cart.items.filter(
      (i) => i.product.toString() !== itemId,
    );

    cart.calculateTotals();
    await cart.save();

    await cart.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Item removed",
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

/* ======================================================
   CLEAR CART
====================================================== */
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      cart.items = [];
      cart.calculateTotals();
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: "Cart cleared",
    });
  } catch (err) {
    next(err);
  }
};
