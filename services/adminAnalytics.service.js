const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");

const DAY_MS = 24 * 60 * 60 * 1000;

const roundToTwo = (value) => Number((value || 0).toFixed(2));

const percentChange = (current, previous) => {
  if (!previous) return current > 0 ? 100 : 0;
  return roundToTwo(((current - previous) / previous) * 100);
};

const formatMonthLabel = (date) =>
  date.toLocaleString("en-US", { month: "short", year: "2-digit" });

const formatDayLabel = (date) =>
  date.toLocaleString("en-US", { month: "short", day: "2-digit" });

const buildDailySeries = (days, aggregateRows = [], valueKey) => {
  const lookup = new Map(aggregateRows.map((row) => [row._id, row[valueKey] || 0]));
  const today = new Date();
  const series = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today.getTime() - i * DAY_MS);
    const key = date.toISOString().slice(0, 10);
    series.push({
      date: key,
      label: formatDayLabel(date),
      [valueKey]: roundToTwo(lookup.get(key) || 0),
    });
  }

  return series;
};

const buildMonthlySeries = (months, aggregateRows = []) => {
  const lookup = new Map(
    aggregateRows.map((row) => [
      `${row._id.year}-${String(row._id.month).padStart(2, "0")}`,
      { revenue: row.revenue || 0, orders: row.orders || 0 },
    ]),
  );

  const now = new Date();
  const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const series = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(
      firstDayCurrentMonth.getFullYear(),
      firstDayCurrentMonth.getMonth() - i,
      1,
    );
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const row = lookup.get(key) || { revenue: 0, orders: 0 };

    series.push({
      month: formatMonthLabel(date),
      revenue: roundToTwo(row.revenue),
      orders: row.orders,
    });
  }

  return series;
};

exports.getOverviewAnalytics = async () => {
  const now = new Date();
  const current30DayStart = new Date(now.getTime() - 29 * DAY_MS);
  const previous30DayStart = new Date(now.getTime() - 59 * DAY_MS);

  const [
    revenueAgg,
    totalOrders,
    totalCustomers,
    totalProducts,
    nonCancelledOrders,
    growthAgg,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]),
    Order.countDocuments(),
    User.countDocuments({ role: "user" }),
    Product.countDocuments(),
    Order.countDocuments({ orderStatus: { $ne: "cancelled" } }),
    Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: "cancelled" },
          createdAt: { $gte: previous30DayStart },
        },
      },
      {
        $group: {
          _id: null,
          currentRevenue: {
            $sum: {
              $cond: [{ $gte: ["$createdAt", current30DayStart] }, "$totalAmount", 0],
            },
          },
          previousRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$createdAt", previous30DayStart] },
                    { $lt: ["$createdAt", current30DayStart] },
                  ],
                },
                "$totalAmount",
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const totalRevenue = roundToTwo(revenueAgg?.[0]?.totalRevenue || 0);
  const currentRevenue = roundToTwo(growthAgg?.[0]?.currentRevenue || 0);
  const previousRevenue = roundToTwo(growthAgg?.[0]?.previousRevenue || 0);
  const averageOrderValue = nonCancelledOrders > 0 ? roundToTwo(totalRevenue / nonCancelledOrders) : 0;

  return {
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalProducts,
    averageOrderValue,
    revenueGrowthPercent: percentChange(currentRevenue, previousRevenue),
    currentPeriodRevenue: currentRevenue,
    previousPeriodRevenue: previousRevenue,
  };
};

exports.getSalesAnalytics = async () => {
  const now = new Date();
  const last30DayStart = new Date(now.getTime() - 29 * DAY_MS);
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const last12MonthsStart = new Date(
    startOfCurrentMonth.getFullYear(),
    startOfCurrentMonth.getMonth() - 11,
    1,
  );

  const [dailyAgg, monthlyAgg, statusAgg, categoryAgg] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: last30DayStart } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          revenue: {
            $sum: {
              $cond: [{ $ne: ["$orderStatus", "cancelled"] }, "$totalAmount", 0],
            },
          },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: last12MonthsStart } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: {
            $sum: {
              $cond: [{ $ne: ["$orderStatus", "cancelled"] }, "$totalAmount", 0],
            },
          },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: last30DayStart } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $addFields: {
          category: {
            $ifNull: [{ $arrayElemAt: ["$product.category", 0] }, "Uncategorized"],
          },
        },
      },
      {
        $group: {
          _id: "$category",
          orders: { $sum: "$items.quantity" },
          revenue: {
            $sum: {
              $cond: [
                { $ne: ["$orderStatus", "cancelled"] },
                { $multiply: ["$items.price", "$items.quantity"] },
                0,
              ],
            },
          },
        },
      },
      { $sort: { revenue: -1 } },
    ]),
  ]);

  const revenueByDay = buildDailySeries(30, dailyAgg, "revenue");
  const ordersByDay = buildDailySeries(30, dailyAgg, "orders");
  const revenueByMonth = buildMonthlySeries(12, monthlyAgg);
  const ordersByStatus = statusAgg.map((row) => ({
    status: row._id || "unknown",
    count: row.count || 0,
  }));
  const ordersByCategory = categoryAgg.map((row) => ({
    category: row._id || "Uncategorized",
    orders: row.orders || 0,
    revenue: roundToTwo(row.revenue || 0),
  }));
  const salesByCategory = ordersByCategory.map((row) => ({
    category: row.category,
    revenue: row.revenue,
  }));

  return {
    revenueByDay,
    ordersByDay,
    revenueByMonth,
    ordersByStatus,
    ordersByCategory,
    salesByCategory,
  };
};

exports.getProductAnalytics = async () => {
  const [topSellingRaw, lowStockProductsRaw, contributionRaw, totalRevenueAgg] = await Promise.all([
    Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          soldQuantity: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { soldQuantity: -1, revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          soldQuantity: 1,
          revenue: 1,
          stock: { $ifNull: [{ $arrayElemAt: ["$product.stock", 0] }, 0] },
          category: { $ifNull: [{ $arrayElemAt: ["$product.category", 0] }, "Uncategorized"] },
        },
      },
    ]),
    Product.find({ stock: { $lte: 5 }, isActive: true })
      .select("name category stock price images")
      .sort({ stock: 1, updatedAt: -1 })
      .limit(10)
      .lean(),
    Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
    Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]),
  ]);

  const totalRevenue = roundToTwo(totalRevenueAgg?.[0]?.totalRevenue || 0);

  const topSellingProducts = topSellingRaw.map((row) => ({
    productId: row._id,
    name: row.name || "Unnamed Product",
    soldQuantity: row.soldQuantity || 0,
    revenue: roundToTwo(row.revenue || 0),
    stock: row.stock || 0,
    category: row.category || "Uncategorized",
  }));

  const lowStockProducts = lowStockProductsRaw.map((row) => ({
    productId: row._id,
    name: row.name || "Unnamed Product",
    category: row.category || "Uncategorized",
    stock: row.stock || 0,
    price: roundToTwo(row.price || 0),
    image: row.images?.[0] || "",
  }));

  const productRevenueContribution = contributionRaw.map((row) => ({
    productId: row._id,
    name: row.name || "Unnamed Product",
    revenue: roundToTwo(row.revenue || 0),
    contributionPercent:
      totalRevenue > 0 ? roundToTwo(((row.revenue || 0) / totalRevenue) * 100) : 0,
  }));

  return {
    topSellingProducts,
    lowStockProducts,
    productRevenueContribution,
  };
};

exports.getCustomerAnalytics = async () => {
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalCustomers, newCustomersThisMonth, repeatAgg, topSpendersRaw] = await Promise.all([
    User.countDocuments({ role: "user" }),
    User.countDocuments({
      role: "user",
      createdAt: { $gte: startOfCurrentMonth },
    }),
    Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
        },
      },
      { $match: { orderCount: { $gt: 1 } } },
      { $count: "total" },
    ]),
    Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
          lastOrderAt: { $max: "$createdAt" },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $project: {
          _id: 1,
          orderCount: 1,
          totalSpent: 1,
          lastOrderAt: 1,
          name: { $ifNull: [{ $arrayElemAt: ["$user.name", 0] }, "Unknown User"] },
          email: { $ifNull: [{ $arrayElemAt: ["$user.email", 0] }, ""] },
        },
      },
    ]),
  ]);

  return {
    totalCustomers,
    newCustomersThisMonth,
    repeatCustomers: repeatAgg?.[0]?.total || 0,
    topCustomersBySpending: topSpendersRaw.map((row) => ({
      customerId: row._id,
      name: row.name || "Unknown User",
      email: row.email || "",
      orderCount: row.orderCount || 0,
      totalSpent: roundToTwo(row.totalSpent || 0),
      lastOrderAt: row.lastOrderAt || null,
    })),
  };
};
