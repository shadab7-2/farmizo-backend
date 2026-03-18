const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: String,
    image: String,

    price: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },

    items: [cartItemSchema],

    totalItems: {
      type: Number,
      default: 0,
    },

    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/* ================= CALCULATE TOTALS ================= */
cartSchema.methods.calculateTotals = function () {
  let items = 0;
  let price = 0;

  this.items.forEach((item) => {
    items += item.quantity;
    price += item.quantity * item.price;
  });

  this.totalItems = items;
  this.totalPrice = price;
};

module.exports = mongoose.model("Cart", cartSchema);
