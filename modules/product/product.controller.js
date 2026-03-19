const asyncHandler = require("../../utils/asyncHandler");
const service = require("./product.service");

exports.createProduct = asyncHandler((req, res, next) => service.create(req, res, next));
exports.updateProduct = asyncHandler((req, res, next) => service.update(req, res, next));
exports.deleteProduct = asyncHandler((req, res, next) => service.remove(req, res, next));
exports.getAllProducts = asyncHandler((req, res, next) => service.list(req, res, next));
exports.searchProducts = asyncHandler((req, res, next) => service.search(req, res, next));
exports.getRelatedProducts = asyncHandler((req, res, next) => service.related(req, res, next));
exports.getProductBySlug = asyncHandler((req, res, next) => service.details(req, res, next));
exports.getProductReviews = asyncHandler((req, res, next) => service.getReviews(req, res, next));
exports.createProductReview = asyncHandler((req, res, next) => service.createReview(req, res, next));
exports.updateProductReview = asyncHandler((req, res, next) => service.updateReview(req, res, next));
exports.deleteProductReview = asyncHandler((req, res, next) => service.deleteReview(req, res, next));
