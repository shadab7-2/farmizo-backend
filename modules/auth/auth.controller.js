const asyncHandler = require("../../utils/asyncHandler");
const service = require("./auth.service");

exports.register = asyncHandler((req, res, next) => service.register(req, res, next));
exports.login = asyncHandler((req, res, next) => service.login(req, res, next));
exports.logout = asyncHandler((req, res, next) => service.logout(req, res, next));
exports.refresh = asyncHandler((req, res, next) => service.refresh(req, res, next));
exports.getMe = asyncHandler((req, res, next) => service.me(req, res, next));
