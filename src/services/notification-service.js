const mongoose = require('mongoose');
const notificationModel = require('../models/notification-model');
const employeeModel = require('../models/employee-model');
const departmentModel = require('../models/department-model');
const userModel = require('../models/user-model');
const ErrorTypes = require("../constants/error-type");
const CustomError = require("../core/custom-error");

class NotificationService {
  /**
   * Tạo thông báo mới
   */

  static async createNotification(req) {
    const { title, content, targetType, targetDepartment, targetEmployees, isImportant } = req.body;
    
    // Validate dữ liệu đầu vào
    if (!title || !content) {
      throw new CustomError(
        ErrorTypes.missingInput, 
        "Title and content are required",
        400
      );
    }
    
    // Kiểm tra target hợp lệ
    if (targetType === 'department' && !targetDepartment) {
      throw new CustomError(
        ErrorTypes.missingInput, 
        "Target department is required when target type is department",
        400
      );
    }
    
    if (targetType === 'employee' && (!targetEmployees || targetEmployees.length === 0)) {
      throw new CustomError(
        ErrorTypes.missingInput, 
        "At least one target employee is required when target type is employee",
        400
      );
    }

    // Kiểm tra department tồn tại nếu gửi cho department
    if (targetType === 'department' && targetDepartment) {
      const department = await departmentModel.findById(targetDepartment);
      if (!department) {
        throw new CustomError(
          ErrorTypes.DataNotFound, 
          "Department not found",
          404
        );
      }
    }
    
    // Kiểm tra employees tồn tại nếu gửi cho employees
    if (targetType === 'employee' && targetEmployees && targetEmployees.length > 0) {
      const employees = await employeeModel.find({
        _id: { $in: targetEmployees }
      });
      
      if (employees.length !== targetEmployees.length) {
        throw new CustomError(
          ErrorTypes.DataNotFound, 
          "One or more employees not found",
          404
        );
      }
    }

    // Tạo thông báo mới
    const notification = new notificationModel({
      title,
      content,
      sender: req.user._id, // User ID từ JWT token
      targetType,
      targetDepartment: targetType === 'department' ? targetDepartment : undefined,
      targetEmployees: targetType === 'employee' ? targetEmployees : undefined,
      isImportant: isImportant || false
    });

    await notification.save();
    return notification;
  }

  /**
   * Lấy danh sách thông báo cho một nhân viên
   */
  static async getNotificationsForEmployee(req) {
    const { page = 1, limit = 10, status = 'active' } = req.query;
    
    // Lấy thông tin employee của user hiện tại
    const user = await userModel.findById(req.user.id);
    if (!user || !user.employeeId) {
      throw new CustomError(
        ErrorTypes.DataNotFound, 
        "Employee information not found for current user",
        404
      );
    }
    
    const employee = await employeeModel.findById(user.employeeId).populate('department');
    if (!employee) {
      throw new CustomError(
        ErrorTypes.DataNotFound, 
        "Employee not found",
        404
      );
    }

    // Xây dựng điều kiện truy vấn
    const query = {
      status,
      $or: [
        { targetType: 'all' },
        { targetType: 'department', targetDepartment: employee.department?._id },
        { targetType: 'employee', targetEmployees: employee._id }
      ]
    };

    // Thực hiện pagination
    const totalNotifications = await notificationModel.countDocuments(query);
    const totalPages = Math.ceil(totalNotifications / limit);
    
    const notifications = await notificationModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'fullName email')
      .populate('targetDepartment', 'name');

    // Thêm thông tin đã đọc cho từng thông báo
    const notificationsWithReadStatus = notifications.map(notification => {
      const readStatus = notification.readBy.find(
        item => item.employee.toString() === employee._id.toString()
      );
      
      return {
        ...notification.toObject(),
        isRead: !!readStatus,
        readAt: readStatus ? readStatus.readAt : null
      };
    });

    return {
      data: notificationsWithReadStatus,
      pagination: {
        totalItems: totalNotifications,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    };
  }

  /**
   * Đánh dấu thông báo đã đọc
   */
  static async markNotificationAsRead(req) {
    const { notificationId } = req.params;
    
    // Lấy thông tin employee của user hiện tại
    const user = await userModel.findById(req.user.id);
    if (!user || !user.employeeId) {
      throw new CustomError(
        ErrorTypes.DataNotFound, 
        "Employee information not found for current user",
        404
      );
    }

    const notification = await notificationModel.findById(notificationId);
    if (!notification) {
      throw new CustomError(
        ErrorTypes.DataNotFound, 
        "Notification not found",
        404
      );
    }

    // Kiểm tra xem nhân viên có quyền xem thông báo này không
    const employee = await employeeModel.findById(user.employeeId).populate('department');
    if (!employee) {
      throw new CustomError(
        ErrorTypes.DataNotFound, 
        "Employee not found",
        404
      );
    }

    const canAccess = 
      notification.targetType === 'all' ||
      (notification.targetType === 'department' && 
       notification.targetDepartment?.toString() === employee.department?._id.toString()) ||
      (notification.targetType === 'employee' && 
       notification.targetEmployees.some(id => id.toString() === employee._id.toString()));
    
    if (!canAccess) {
      throw new CustomError(
        ErrorTypes.Forbidden, 
        "You don't have permission to access this notification",
        403
      );
    }

    // Kiểm tra xem thông báo đã được đọc chưa
    const alreadyRead = notification.readBy.some(
      item => item.employee.toString() === employee._id.toString()
    );
    
    if (!alreadyRead) {
      // Đánh dấu là đã đọc
      await notificationModel.findByIdAndUpdate(
        notificationId,
        {
          $push: {
            readBy: {
              employee: employee._id,
              readAt: new Date()
            }
          }
        }
      );
    }

    return { success: true };
  }

  /**
   * Lấy thông tin chi tiết thông báo
   */
  static async getNotificationDetail(req) {
    const { notificationId } = req.params;
    
    // Lấy thông tin employee của user hiện tại
    console.log('id: ', req.user._id);
    const user = await userModel.findById(req.user._id);
    if (!user || !user.employee) {
      throw new CustomError(
        ErrorTypes.DataNotFound, 
        "Employee information not found for current user",
        404
      );
    }

    const notification = await notificationModel.findById(notificationId)
      .populate('sender', 'fullName email')
      .populate('targetDepartment', 'name')
      .populate('targetEmployees', 'fullName email');
      
    if (!notification) {
      throw new CustomError(
        ErrorTypes.DataNotFound, 
        "Notification not found",
        404
      );
    }

    // Kiểm tra xem nhân viên có quyền xem thông báo này không
    const employee = await employeeModel.findById(user.employee).populate('department');
    if (!employee) {
      throw new CustomError(
        ErrorTypes.DataNotFound, 
        "Employee not found",
        404
      );
    }

    const canAccess = 
      notification.targetType === 'all' ||
      (notification.targetType === 'department' && 
       notification.targetDepartment?.toString() === employee.department?._id.toString()) ||
      (notification.targetType === 'employee' && 
       notification.targetEmployees.some(id => id.toString() == employee._id.toString()));
    
    // if (!canAccess) {
    //   throw new CustomError(
    //     ErrorTypes.Forbidden, 
    //     "You don't have permission to access this notification",
    //     403
    //   );
    // }

    const readStatus = notification.readBy.find(
      item => item.employee.toString() === employee._id.toString()
    );
    
    // Trả về thông tin chi tiết
    return {
      ...notification.toObject(),
      isRead: !!readStatus,
      readAt: readStatus ? readStatus.readAt : null
    };
  }

  /**
   * Admin: Lấy danh sách tất cả thông báo (quyền quản lý)
   */
  static async getAllNotifications(req) {
    const { page = 1, limit = 10, status, targetType } = req.query;
    
    // Xây dựng query
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (targetType) {
      query.targetType = targetType;
    }

    // Thực hiện pagination
    const totalNotifications = await notificationModel.countDocuments(query);
    const totalPages = Math.ceil(totalNotifications / limit);
    
    const notifications = await notificationModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'fullName email')
      .populate('targetDepartment', 'name');

    return {
      data: notifications,
      pagination: {
        totalItems: totalNotifications,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    };
  }

  /**
   * Admin: Cập nhật thông báo
   */
  

  /**
   * Admin: Xóa thông báo
   */
  static async deleteNotification(req) {
    const { notificationId } = req.params;
    
    const notification = await notificationModel.findById(notificationId);
    if (!notification) {
      throw new CustomError(
        ErrorTypes.DataNotFound, 
        "Notification not found",
        404
      );
    }

    await notification.deleteOne();
    return { success: true };
  }

  /**
   * Lấy số lượng thông báo chưa đọc
   */
  static async getUnreadCount(req) {
    // Lấy thông tin employee của user hiện tại
    const user = await userModel.findById(req.user.id);
    if (!user || !user.employeeId) {
      throw new CustomError(
        ErrorTypes.DataNotFound, 
        "Employee information not found for current user",
        404
      );
    }
    
    const employee = await employeeModel.findById(user.employeeId).populate('department');
    if (!employee) {
      throw new CustomError(
        ErrorTypes.DataNotFound, 
        "Employee not found",
        404
      );
    }

    // Xây dựng điều kiện truy vấn
    const query = {
      status: 'active',
      $or: [
        { targetType: 'all' },
        { targetType: 'department', targetDepartment: employee.department?._id },
        { targetType: 'employee', targetEmployees: employee._id }
      ],
      // Thông báo mà nhân viên chưa đọc
      'readBy.employee': { $ne: employee._id }
    };

    const count = await notificationModel.countDocuments(query);
    return { unreadCount: count };
  }
}

module.exports = NotificationService;