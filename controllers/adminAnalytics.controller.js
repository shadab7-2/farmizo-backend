const adminAnalyticsService = require("../services/adminAnalytics.service");

exports.getOverviewAnalytics = async (req, res, next) => {
  try {
    const data = await adminAnalyticsService.getOverviewAnalytics();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.getSalesAnalytics = async (req, res, next) => {
  try {
    const data = await adminAnalyticsService.getSalesAnalytics();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductAnalytics = async (req, res, next) => {
  try {
    const data = await adminAnalyticsService.getProductAnalytics();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerAnalytics = async (req, res, next) => {
  try {
    const data = await adminAnalyticsService.getCustomerAnalytics();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
