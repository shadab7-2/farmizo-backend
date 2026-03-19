const categoryController = require("../../controllers/category.controller");

module.exports = {
  list: (req, res, next) => categoryController.getCategories(req, res, next),
  details: (req, res, next) => categoryController.getCategoryBySlug(req, res, next),
  create: (req, res, next) => categoryController.createCategory(req, res, next),
  update: (req, res, next) => categoryController.updateCategory(req, res, next),
  remove: (req, res, next) => categoryController.deleteCategory(req, res, next),
};
