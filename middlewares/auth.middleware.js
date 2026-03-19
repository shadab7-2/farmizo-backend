const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const User = require("../models/user.model");

/*
|--------------------------------------------------------------------------
| Protect Route Middleware
|--------------------------------------------------------------------------
| Verifies JWT token and attaches user to request
*/

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "Not authorized, token missing"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new ApiError(401, "User not found"));
    }
    if (user.isActive === false) {
      return next(new ApiError(403, "User account is disabled"));
    }

    req.user = user;

    next();
  } catch (err) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

/*
|--------------------------------------------------------------------------
| Admin Middleware (future use)
|--------------------------------------------------------------------------
*/

const admin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return next(new ApiError(403, "Admin access required"));
  }
  next();
};

module.exports = {
  protect,
  admin,
};
