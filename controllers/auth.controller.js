const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");
const ApiError = require("../utils/ApiError.js");
const emailService = require("../services/email.service");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");

/* ================= REGISTER ================= */
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body || {};
    if (!name || !email || !password) {
      throw new ApiError(400, "name, email, password are required");
    }

    const exists = await User.findOne({ email });
    if (exists) {
      throw new ApiError(400, "User already exists");
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
    });

    // Fire-and-forget: send welcome email
    emailService
      .sendWelcomeEmail({ name: user.name, email: user.email })
      .catch(() => {});

    /* CREATE TOKENS */
    const accessToken = generateAccessToken({ id: user._id });
    const refreshToken = generateRefreshToken({ id: user._id });

    // Persist refresh token for rotation/revocation
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    /* SEND REFRESH COOKIE */
    const isProduction = process.env.NODE_ENV === "production";

    // Set refresh cookie with secure attributes and scoped path for refresh endpoint
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction, // ✅ true on Render (HTTPS)
      sameSite: isProduction ? "None" : "Lax", // 🔥 CRITICAL FIX
      path: "/api/auth/refresh", // limit cookie scope to refresh endpoint
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   secure: false, // set true behind HTTPS
    //   sameSite: "Strict",
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          addresses: user.addresses || [],
        },
        accessToken,
      },
    });
  } catch (err) {
    // Explicitly map JWT errors to ApiError for consistent responses
    if (err.name === "TokenExpiredError") {
      return next(new ApiError(401, "Refresh token expired"));
    }
    if (err.name === "JsonWebTokenError") {
      return next(new ApiError(401, "Invalid refresh token"));
    }
    next(err);
  }
};
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password +refreshToken");
    if (!user || !(await user.matchPassword(password))) {
      throw new ApiError(401, "Invalid credentials");
    }
    if (user.isActive === false) {
      throw new ApiError(403, "Your account is disabled. Contact support.");
    }

    const accessToken = generateAccessToken({ id: user._id });
    const refreshToken = generateRefreshToken({ id: user._id });

    // Store latest refresh token (rotation-ready)
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const isProduction = process.env.NODE_ENV === "production";

    // Store latest refresh cookie with scoped path
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      path: "/api/auth/refresh", // scoped cookie
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          addresses: user.addresses || [],
          isActive: user.isActive !== false,
        },
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

/* ================= LOGOUT ================= */
exports.logoutUser = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $unset: { refreshToken: 1 },
      });
    }

    // Clear cookie and invalidate stored refresh token
    res.cookie("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/api/auth/refresh", // match path to overwrite cookie
      expires: new Date(0),
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
};

/* ================= REFRESH TOKEN ================= */
exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      throw new ApiError(401, "Refresh token missing");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== token) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (user.isActive === false) {
      throw new ApiError(403, "User account is disabled");
    }

    // 🔥 ROTATION
    const newAccessToken = generateAccessToken({ id: user._id });
    const newRefreshToken = generateRefreshToken({ id: user._id });

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      path: "/api/auth/refresh", // scoped cookie for refresh endpoint only
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (err) {
    // Surface token errors with consistent messaging
    if (err.name === "TokenExpiredError") {
      return next(new ApiError(401, "Refresh token expired"));
    }
    if (err.name === "JsonWebTokenError") {
      return next(new ApiError(401, "Invalid refresh token"));
    }
    next(err);
  }
};

/* ================= GET ME ================= */
exports.getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Not authorized");
    }

    res.status(200).json({
      success: true,
      data: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        addresses: req.user.addresses || [],
        isActive: req.user.isActive !== false,
      },
    });
  } catch (err) {
    next(err);
  }
};
