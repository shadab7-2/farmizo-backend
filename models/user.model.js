const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // hide by default
    },

    refreshToken: {
      type: String,
      select: false, // stored securely, never returned by default
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    addresses: {
      type: [
        {
          fullName: { type: String, trim: true },
          phone: { type: String, trim: true },
          street: { type: String, trim: true },
          city: { type: String, trim: true },
          state: { type: String, trim: true },
          pincode: { type: String, trim: true },
          country: { type: String, trim: true },
          label: {
            type: String,
            trim: true,
            enum: ["Home", "Office", "Village", "Other"],
            default: "Home",
          },
          isDefault: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// hash password before save
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
  // next();
});

// instance method used in login controller
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
