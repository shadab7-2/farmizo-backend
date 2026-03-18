const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    title: String,

    subtitle: String,

    description: String,

    image: String,

    link: String,

    type: {
      type: String,
      enum: ["hero", "banner", "category", "promotion", "trust"],
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Content", contentSchema);
