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
    emailService.sendWelcomeEmail({ name: user.name, email: user.email }).catch(() => {});

    /* CREATE TOKENS */
    const accessToken = generateAccessToken({ id: user._id });
    const refreshToken = generateRefreshToken({ id: user._id });

    /* SEND REFRESH COOKIE */
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // set true behind HTTPS
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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
    next(err);
  }
};
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      throw new ApiError(401, "Invalid credentials");
    }
    if (user.isActive === false) {
      throw new ApiError(403, "Your account is disabled. Contact support.");
    }

    const accessToken = generateAccessToken({ id: user._id });
    const refreshToken = generateRefreshToken({ id: user._id });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
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
    res.cookie("refreshToken", "", {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
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
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    );

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    if (user.isActive === false) {
      throw new ApiError(403, "User account is disabled");
    }

    const accessToken = generateAccessToken({ id: user._id });

    res.status(200).json({
      success: true,
      data: { accessToken },
    });
  } catch (err) {
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
