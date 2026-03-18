const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const monthKey = (year, monthIndex) => `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

const trendPercent = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

exports.getDashboardStats = async (rangeDays = 30) => {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const previousMonthStart = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() - 1, 1);
  const nextMonthStart = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 1);
  const twelveMonthsStart = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() - 11, 1);
  const rangeStart = new Date(now.getTime() - Math.abs(rangeDays || 30) * 24 * 60 * 60 * 1000);
  const previousRangeStart = new Date(rangeStart.getTime() - Math.abs(rangeDays || 30) * 24 * 60 * 60 * 1000);
  const previousRangeEnd = rangeStart;
  const rangeMatch = { createdAt: { $gte: rangeStart } };
  const previousRangeMatch = { createdAt: { $gte: previousRangeStart, $lt: previousRangeEnd } };

  const [
    revenueAgg,
    totalOrders,
    totalUsers,
    totalProducts,
    recentOrders,
    lowStockProducts,
    monthlySalesRaw,
    topProducts,
    currentMonthUserCount,
    previousMonthUserCount,
    currentMonthProductCount,
    previousMonthProductCount,
    previousRevenueAgg,
    previousOrdersCount,
  ] = await Promise.all([
    Order.aggregate([
      { $match: rangeMatch },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]),
    Order.countDocuments(rangeMatch),
    User.countDocuments({ role: "user" }),
    Product.countDocuments(),
    Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Product.find({ stock: { $lt: 5 }, isActive: true })
      .select("name stock price images")
      .sort({ stock: 1, updatedAt: -1 })
      .limit(8)
      .lean(),
    Order.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsStart } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          productName: { $first: "$items.name" },
          salesCount: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { salesCount: -1, revenue: -1 } },
      { $limit: 5 },
    ]),
    User.countDocuments({ role: "user", createdAt: { $gte: currentMonthStart, $lt: nextMonthStart } }),
    User.countDocuments({ role: "user", createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } }),
    Product.countDocuments({ createdAt: { $gte: currentMonthStart, $lt: nextMonthStart } }),
    Product.countDocuments({ createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } }),
    Order.aggregate([
      { $match: previousRangeMatch },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]),
    Order.countDocuments(previousRangeMatch),
  ]);

  const totalRevenue = Number((revenueAgg?.[0]?.totalRevenue || 0).toFixed(2));
  const previousRevenue = Number((previousRevenueAgg?.[0]?.totalRevenue || 0).toFixed(2));

  const monthlyLookup = new Map();
  for (const row of monthlySalesRaw) {
    monthlyLookup.set(
      monthKey(row._id.year, row._id.month - 1),
      { revenue: Number((row.revenue || 0).toFixed(2)), orders: row.orders || 0 },
    );
  }

  const monthlySales = [];
  for (let i = 11; i >= 0; i -= 1) {
    const date = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() - i, 1);
    const key = monthKey(date.getFullYear(), date.getMonth());
    const aggregate = monthlyLookup.get(key) || { revenue: 0, orders: 0 };

    monthlySales.push({
      month: `${MONTH_NAMES[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`,
      revenue: aggregate.revenue,
      orders: aggregate.orders,
    });
  }

  const currentMonth = monthlySales[monthlySales.length - 1] || { revenue: 0, orders: 0 };
  const previousMonth = monthlySales[monthlySales.length - 2] || { revenue: 0, orders: 0 };

  return {
    totalRevenue,
    totalOrders,
    totalUsers,
    totalProducts,
    recentOrders: recentOrders.map((order) => ({
      _id: order._id,
      customerName: order?.user?.name || "Guest",
      customerEmail: order?.user?.email || "",
      totalAmount: Number(order.totalAmount || 0),
      orderStatus: order.orderStatus || "placed",
      createdAt: order.createdAt,
    })),
    lowStockProducts: lowStockProducts.map((product) => ({
      _id: product._id,
      name: product.name,
      stock: product.stock,
      price: product.price,
      image: product.images?.[0] || "",
    })),
    monthlySales,
    topProducts: topProducts.map((product) => ({
      productId: product._id,
      name: product.productName || "Unnamed Product",
      salesCount: product.salesCount || 0,
      revenue: Number((product.revenue || 0).toFixed(2)),
    })),
    revenueGrowth: trendPercent(totalRevenue, previousRevenue),
    orderGrowth: trendPercent(totalOrders, previousOrdersCount || 0),
    trends: {
      revenue: trendPercent(currentMonth.revenue, previousMonth.revenue),
      orders: trendPercent(currentMonth.orders, previousMonth.orders),
      customers: trendPercent(currentMonthUserCount, previousMonthUserCount),
      products: trendPercent(currentMonthProductCount, previousMonthProductCount),
    },
  };
};

exports.getCustomers = async ({ page = 1, limit = 10, search = "" } = {}) => {
  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Number(limit) > 0 ? Math.min(Number(limit), 100) : 10;
  const skip = (safePage - 1) * safeLimit;

  const trimmedSearch = String(search || "").trim();
  const searchRegex = trimmedSearch ? new RegExp(trimmedSearch, "i") : null;

  const userFilter = {
    role: "user",
    ...(searchRegex ? { $or: [{ name: searchRegex }, { email: searchRegex }] } : {}),
  };

  const [users, totalCustomers, orderStats, revenueAgg] = await Promise.all([
    User.find(userFilter)
      .select("name email createdAt isActive")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    User.countDocuments(userFilter),
    Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      {
        $group: {
          _id: "$user",
          ordersCount: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
        },
      },
    ]),
    Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]),
  ]);

  const orderStatsMap = new Map(orderStats.map((row) => [String(row._id), row]));
  const data = users.map((user) => {
    const stats = orderStatsMap.get(String(user._id));
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      isActive: user.isActive !== false,
      createdAt: user.createdAt,
      ordersCount: stats?.ordersCount || 0,
      totalSpent: Number((stats?.totalSpent || 0).toFixed(2)),
    };
  });

  const totals = revenueAgg?.[0] || {};
  const totalPages = Math.max(1, Math.ceil(totalCustomers / safeLimit));

  return {
    data,
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalPages,
      totalItems: totalCustomers,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    },
    stats: {
      totalCustomers,
      totalOrders: totals.totalOrders || 0,
      totalRevenue: Number((totals.totalRevenue || 0).toFixed(2)),
    },
  };
};

exports.toggleCustomerStatus = async (customerId) => {
  const customer = await User.findOne({ _id: customerId, role: "user" });

  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  customer.isActive = customer.isActive === false;
  await customer.save();

  return {
    _id: customer._id,
    isActive: customer.isActive,
  };
};

exports.deleteUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === "admin") {
    throw new ApiError(400, "Cannot delete admin users");
  }

  await User.deleteOne({ _id: userId });

  return { _id: userId };
};
