const NotificationService = require("../services/notification-service");

const createNotification = async (req, res) => {
  const notification = await NotificationService.createNotification(req);

  res.status(201).json({
    success: true,
    message: "Notification created successfully",
    data: notification,
  });
};

const getNotificationsForEmployee = async (req, res) => {
  try {
    const result = await NotificationService.getNotificationsForEmployee(req);

    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error retrieving notifications",
      errorType: error.errorType,
    });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    await NotificationService.markNotificationAsRead(req);

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error marking notification as read",
      errorType: error.errorType,
    });
  }
};

const getNotificationDetail = async (req, res) => {
  const notification = await NotificationService.getNotificationDetail(req);

  console.log(notification);

  res.status(200).json({
    success: true,
    message: "Notification details retrieved successfully",
    data: notification,
  });
};

const getAllNotifications = async (req, res) => {
  const result = await NotificationService.getAllNotifications(req);

  res.status(200).json({
    success: true,
    message: "All notifications retrieved successfully",
    data: result.data,
    pagination: result.pagination,
  });
};

const updateNotification = async (req, res) => {
  const notification = await NotificationService.updateNotification(req);

  res.status(200).json({
    success: true,
    message: "Notification updated successfully",
    data: notification,
  });
};

const deleteNotification = async (req, res) => {
  await NotificationService.deleteNotification(req);

  res.status(200).json({
    success: true,
    message: "Notification deleted successfully",
  });
};

const getUnreadCount = async (req, res) => {
  const result = await NotificationService.getUnreadCount(req);

  res.status(200).json({
    success: true,
    message: "Unread count retrieved successfully",
    data: result,
  });
};

module.exports = {
  createNotification,
  getNotificationsForEmployee,
  markNotificationAsRead,
  getNotificationDetail,
  getAllNotifications,
  updateNotification,
  deleteNotification,
  getUnreadCount,
};
