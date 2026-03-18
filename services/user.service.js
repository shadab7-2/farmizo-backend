const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");

// ==========================
// Get User Profile
// ==========================
exports.getProfile = async (userId) => {
  const user = await User.findById(userId).select(
    "-password"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

// ==========================
// Update User Profile
// ==========================
exports.updateProfile = async (
  userId,
  updates
) => {
  const allowedFields = ["name", "phone"];

  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      user[field] = updates[field];
    }
  });

  // If a single address object is passed, update/create default address
  if (updates.address && typeof updates.address === "object") {
    const { fullName, phone, street, city, state, pincode, country } = updates.address;
    if (fullName || phone || street || city || state || pincode || country) {
      // Find default address
      let target = user.addresses.find((addr) => addr.isDefault) || user.addresses[0];
      if (target) {
        target.fullName = fullName ?? target.fullName;
        target.phone = phone ?? target.phone;
        target.street = street ?? target.street;
        target.city = city ?? target.city;
        target.state = state ?? target.state;
        target.pincode = pincode ?? target.pincode;
        target.country = country ?? target.country;
        target.isDefault = true;
      } else {
        user.addresses.push({
          fullName,
          phone,
          street,
          city,
          state,
          pincode,
          country,
          isDefault: true,
        });
      }
    }
  }

  await user.save();

  const plain = user.toObject();
  delete plain.password;
  return plain;
};

// ==========================
// Add Address
// ==========================
exports.addAddress = async (userId, addressData) => {
  const { fullName, phone, street, city, state, pincode, country, label, isDefault } = addressData || {};

  if (!fullName || !phone || !street || !city || !state || !pincode || !country) {
    throw new ApiError(400, "fullName, phone, street, city, state, pincode, country are required");
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  // Clear other defaults if this is default
  if (isDefault || user.addresses.length === 0) {
    user.addresses = user.addresses.map((addr) => ({
      ...addr.toObject(),
      isDefault: false,
    }));
  }

  user.addresses.push({
    fullName,
    phone,
    street,
    city,
    state,
    pincode,
    country,
    label: ["Home", "Office", "Village", "Other"].includes(label) ? label : "Home",
    isDefault: isDefault || user.addresses.length === 0,
  });

  await user.save();

  return user.toObject({
    versionKey: false,
    transform: (_, ret) => {
      delete ret.password;
      return ret;
    },
  });
};

// ==========================
// Update Address
// ==========================
exports.updateAddress = async (userId, addressId, addressData) => {
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    throw new ApiError(400, "Invalid address id");
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const target = user.addresses.id(addressId);
  if (!target) throw new ApiError(404, "Address not found");

  const fields = ["fullName", "phone", "street", "city", "state", "pincode", "country", "label"];
  fields.forEach((field) => {
    if (addressData[field] !== undefined) {
      if (field === "label") {
        target[field] = ["Home", "Office", "Village", "Other"].includes(addressData[field])
          ? addressData[field]
          : target[field] || "Home";
      } else {
        target[field] = addressData[field];
      }
    }
  });

  if (addressData.isDefault === true) {
    user.addresses = user.addresses.map((addr) => ({
      ...addr.toObject(),
      isDefault: String(addr._id) === String(addressId),
    }));
  }

  await user.save();

  return user.toObject({
    versionKey: false,
    transform: (_, ret) => {
      delete ret.password;
      return ret;
    },
  });
};

// ==========================
// Delete Address
// ==========================
exports.deleteAddress = async (userId, addressId) => {
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    throw new ApiError(400, "Invalid address id");
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const target = user.addresses.id(addressId);
  if (!target) throw new ApiError(404, "Address not found");

  target.deleteOne();

  // Ensure at least one default if addresses remain
  if (!user.addresses.some((addr) => addr.isDefault) && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  return user.toObject({
    versionKey: false,
    transform: (_, ret) => {
      delete ret.password;
      return ret;
    },
  });
};

// ==========================
// Set Default Address
// ==========================
exports.setDefaultAddress = async (userId, addressId) => {
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    throw new ApiError(400, "Invalid address id");
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const exists = user.addresses.id(addressId);
  if (!exists) throw new ApiError(404, "Address not found");

  user.addresses = user.addresses.map((addr) => ({
    ...addr.toObject(),
    isDefault: String(addr._id) === String(addressId),
  }));

  await user.save();

  return user.toObject({
    versionKey: false,
    transform: (_, ret) => {
      delete ret.password;
      return ret;
    },
  });
};

// ==========================
// Get Addresses
// ==========================
exports.getAddresses = async (userId) => {
  const user = await User.findById(userId).select("addresses name email phone");
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

// ==========================
// Change Password
// ==========================
exports.changePassword = async (userId, { oldPassword, newPassword }) => {
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old and new passwords are required");
  }

  const user = await User.findById(userId).select("+password");
  if (!user) throw new ApiError(404, "User not found");

  const isMatch = await user.matchPassword(oldPassword);
  if (!isMatch) throw new ApiError(401, "Current password is incorrect");

  user.password = newPassword;
  await user.save();

  return true;
};
