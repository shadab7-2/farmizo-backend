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
    let token = null;

    // 1️⃣ Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
     // 2) Fallback to httpOnly cookie
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }
    // 2️⃣ Token missing
    if (!token) {
      return next(new ApiError(401, "Not authorized, token missing"));
    }

    // 3️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4️⃣ Find user
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new ApiError(401, "User not found"));
    }
    if (user.isActive === false) {
      return next(new ApiError(403, "User account is disabled"));
    }

    // 5️⃣ Attach user to request
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
