const asyncHandler = require("../../utils/asyncHandler");
const service = require("./category.service");

exports.getCategories = asyncHandler((req, res, next) => service.list(req, res, next));
exports.getCategoryBySlug = asyncHandler((req, res, next) => service.details(req, res, next));
exports.createCategory = asyncHandler((req, res, next) => service.create(req, res, next));
exports.updateCategory = asyncHandler((req, res, next) => service.update(req, res, next));
exports.deleteCategory = asyncHandler((req, res, next) => service.remove(req, res, next));
