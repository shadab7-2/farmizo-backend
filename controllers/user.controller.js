const userService = require("../services/user.service");

// ==========================
// Get Profile
// ==========================
exports.getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user._id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================
// Update Profile
// ==========================
exports.updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateProfile(req.user._id, req.body);

    res.status(200).json({
      success: true,
      message: "Profile updated",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================
// Add Address
// ==========================
exports.addAddress = async (req, res, next) => {
  try {
    const updatedUser = await userService.addAddress(req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: "Address added",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================
// Update Address
// ==========================
exports.updateAddress = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateAddress(req.user._id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: "Address updated",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================
// Delete Address
// ==========================
exports.deleteAddress = async (req, res, next) => {
  try {
    const updatedUser = await userService.deleteAddress(req.user._id, req.params.id);
    res.status(200).json({
      success: true,
      message: "Address deleted",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================
// Change Password
// ==========================
exports.changePassword = async (req, res, next) => {
  try {
    await userService.changePassword(req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================
// Get Addresses
// ==========================
exports.getAddresses = async (req, res, next) => {
  try {
    const user = await userService.getAddresses(req.user._id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================
// Set Default Address
// ==========================
exports.setDefaultAddress = async (req, res, next) => {
  try {
    const updatedUser = await userService.setDefaultAddress(req.user._id, req.params.id);
    res.status(200).json({
      success: true,
      message: "Default address updated",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
