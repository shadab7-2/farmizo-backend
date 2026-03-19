const asyncHandler = require("../../utils/asyncHandler");
const service = require("./order.service");

exports.createOrder = asyncHandler((req, res, next) => service.create(req, res, next));
exports.getMyOrders = asyncHandler((req, res, next) => service.getMine(req, res, next));
exports.getOrderById = asyncHandler((req, res, next) => service.getById(req, res, next));
exports.getAllOrders = asyncHandler((req, res, next) => service.getAll(req, res, next));
exports.updateOrderStatus = asyncHandler((req, res, next) => service.updateStatus(req, res, next));
exports.resendInvoiceEmail = asyncHandler((req, res, next) => service.resendInvoice(req, res, next));
exports.downloadInvoice = asyncHandler((req, res, next) => service.downloadInvoice(req, res, next));
