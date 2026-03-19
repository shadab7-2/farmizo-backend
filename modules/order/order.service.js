const orderController = require("../../controllers/order.controller");

module.exports = {
  create: (req, res, next) => orderController.createOrder(req, res, next),
  getMine: (req, res, next) => orderController.getMyOrders(req, res, next),
  getById: (req, res, next) => orderController.getOrderById(req, res, next),
  getAll: (req, res, next) => orderController.getAllOrders(req, res, next),
  updateStatus: (req, res, next) => orderController.updateOrderStatus(req, res, next),
  resendInvoice: (req, res, next) => orderController.resendInvoiceEmail(req, res, next),
  downloadInvoice: (req, res, next) => orderController.downloadInvoice(req, res, next),
};
