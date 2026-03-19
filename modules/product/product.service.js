const productController = require("../../controllers/product.controller");

module.exports = {
  create: (req, res, next) => productController.createProduct(req, res, next),
  update: (req, res, next) => productController.updateProduct(req, res, next),
  remove: (req, res, next) => productController.deleteProduct(req, res, next),
  list: (req, res, next) => productController.getAllProducts(req, res, next),
  search: (req, res, next) => productController.searchProducts(req, res, next),
  related: (req, res, next) => productController.getRelatedProducts(req, res, next),
  details: (req, res, next) => productController.getProductBySlug(req, res, next),
  getReviews: (req, res, next) => productController.getProductReviews(req, res, next),
  createReview: (req, res, next) => productController.createProductReview(req, res, next),
  updateReview: (req, res, next) => productController.updateProductReview(req, res, next),
  deleteReview: (req, res, next) => productController.deleteProductReview(req, res, next),
};
