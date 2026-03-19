const authController = require("../../controllers/auth.controller");

const register = (req, res, next) => authController.registerUser(req, res, next);
const login = (req, res, next) => authController.loginUser(req, res, next);
const logout = (req, res, next) => authController.logoutUser(req, res, next);
const refresh = (req, res, next) => authController.refreshToken(req, res, next);
const me = (req, res, next) => authController.getMe(req, res, next);

module.exports = {
  register,
  login,
  logout,
  refresh,
  me,
};
