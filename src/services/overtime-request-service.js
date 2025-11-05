const overtimeRequestModel = require("../models/overtime-request-model");
const employeeModel = require("../models/employee-model");
const attendanceModel = require("../models/attendance-model");
const ErrorMessages = require("../constants/error-message");
const ErrorTypes = require("../constants/error-type");
const CustomError = require("../core/custom-error");

class OvertimeRequestService {
  static async createOvertimeRequest(req) {


    const {employeeId} = req.user;

    const { date, requestedHours, reason } = req.body;

    const existingRequest = await overtimeRequestModel.findOne({
      employee: employeeId,
      date: new Date(date),
    });

    if (existingRequest) {
      throw new CustomError(
        ErrorTypes.YouHaveOverTimeRequestForThisDay,
        ErrorMessages.YouHaveOverTimeRequestForThisDay
      );
    }

    const newOvertimeRequest = await overtimeRequestModel.create({
      employee: employeeId,
      date: new Date(date),
      requestedHours,
      reason,
    });

    console.log(newOvertimeRequest)

    const populatedRequest = await overtimeRequestModel
      .findById(newOvertimeRequest._id)
      .populate("employee", "fullName employeeCode email department position")
      .populate("approvedBy", "fullName employeeCode");

    return populatedRequest;
  }

  static async getOvertimeRequests(req) {
    const {
      page = 1,
      limit = 10,
      sort = "-createdAt",
      search = "",
      status,
      department,
      startDate,
      endDate,
      employee,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (employee) {
      query.employee = employee;
    }

    if (startDate && endDate) {
      const startDateObj = new Date(startDate);
      startDateObj.setHours(0, 0, 0, 0);

      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);

      query.date = {
        $gte: startDateObj,
        $lte: endDateObj,
      };
    }

    let overtimeRequestsQuery = overtimeRequestModel.find(query);

    if (search) {
      const employees = await employeeModel
        .find({
          $or: [
            { fullName: { $regex: search, $options: "i" } },
            { employeeCode: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        })
        .select("_id");

      const employeeIds = employees.map((emp) => emp._id);
      query.employee = { $in: employeeIds };

      overtimeRequestsQuery = overtimeRequestModel.find(query);
    }

    if (department) {
      const departmentEmployees = await employeeModel
        .find({
          department,
        })
        .select("_id");

      const employeeIds = departmentEmployees.map((emp) => emp._id);
      query.employee = query.employee
        ? { $in: [...query.employee.$in, ...employeeIds] }
        : { $in: employeeIds };

      overtimeRequestsQuery = overtimeRequestModel.find(query);
    }

    const overtimeRequests = await overtimeRequestsQuery
      .sort(sort.startsWith("-") ? { [sort.substring(1)]: -1 } : { [sort]: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: "employee",
        select: "fullName employeeCode email image",
        populate: [
          { path: "department", select: "name" },
          { path: "position", select: "title" },
        ],
      })
      .populate("approvedBy", "fullName employeeCode");

    const totalRecords = await overtimeRequestModel.countDocuments(query);

    const pendingRequests = await overtimeRequestModel.countDocuments({
      ...query,
      status: "pending",
    });
    const approvedRequests = await overtimeRequestModel.countDocuments({
      ...query,
      status: "approved",
    });
    const rejectedRequests = await overtimeRequestModel.countDocuments({
      ...query,
      status: "rejected",
    });

    const statistics = {
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalRequests: totalRecords,
    };

    const pagination = {
      total: totalRecords,
      limit: parseInt(limit),
      page: parseInt(page),
      totalPages: Math.ceil(totalRecords / parseInt(limit)),
    };

    return {
      data: overtimeRequests,
      pagination,
      statistics,
    };
  }

  static async getOvertimeRequestById(req) {
    const { id } = req.params;

    const overtimeRequest = await overtimeRequestModel
      .findById(id)
      .populate({
        path: "employee",
        select: "fullName employeeCode email image",
        populate: [
          { path: "department", select: "name" },
          { path: "position", select: "title" },
        ],
      })
      .populate("approvedBy", "fullName employeeCode email image");

    if (!overtimeRequest) {
      throw new CustomError(
        ErrorTypes.OverTimeRequestNotFound,
        ErrorMessages.OverTimeRequestNotFound
      );
    }

    return { overtimeRequest };
  }

  static async updateOvertimeRequest(req) {
    const { id } = req.params;
    const { requestedHours, reason } = req.body;

    const overtimeRequest = await overtimeRequestModel.findById(id);

    if (!overtimeRequest) {
      throw new CustomError(
        ErrorTypes.OverTimeRequestNotFound,
        ErrorMessages.OverTimeRequestNotFound
      );
    }

    if (overtimeRequest.status !== "pending") {
      throw new CustomError(
        ErrorTypes.OvertimeRequestIsNotPending,
        ErrorMessages.OvertimeRequestIsNotPending
      );
    }

    const updatedRequest = await overtimeRequestModel
      .findByIdAndUpdate(id, { requestedHours, reason }, { new: true })
      .populate({
        path: "employee",
        select: "fullName employeeCode email image",
        populate: [
          { path: "department", select: "name" },
          { path: "position", select: "title" },
        ],
      })
      .populate("approvedBy", "fullName employeeCode");

    return updatedRequest;
  }

  static async processOvertimeRequest(req) {
    const { id } = req.params;
    const { status, approvedHours, rejectionReason } = req.body;
    const approverId = req.user.employeeId;

    const overtimeRequest = await overtimeRequestModel.findById(id);

    if (!overtimeRequest) {
      throw new CustomError(
        ErrorTypes.OverTimeRequestNotFound,
        ErrorMessages.OverTimeRequestNotFound
      );
    }

    if (overtimeRequest.status !== "pending") {
      throw new CustomError(
        ErrorTypes.OvertimeRequestIsNotPending,
        ErrorMessages.OvertimeRequestIsNotPending
      );
    }

    const updateData = {
      status,
      approvedBy: approverId,
    };

    if (status === "approved") {
      updateData.approvedHours =
        approvedHours || overtimeRequest.requestedHours;

      const attendanceDate = new Date(overtimeRequest.date);
      attendanceDate.setHours(0, 0, 0, 0);

      const endOfDay = new Date(attendanceDate);
      endOfDay.setHours(23, 59, 59, 999);

      await attendanceModel.findOneAndUpdate(
        {
          employee: overtimeRequest.employee,
          date: {
            $gte: attendanceDate,
            $lte: endOfDay,
          },
        },
        {
          $set: {
            overtimeHours: updateData.approvedHours,
            overtimeRequest: overtimeRequest._id,
          },
        }
      );
    } else if (status === "rejected") {
      if (!rejectionReason) {
        throw new CustomError(
          ErrorTypes.MissingRejectionReason,
          ErrorMessages.MissingRejectionReason
        );
      }
      updateData.rejectionReason = rejectionReason;
    }

    const updatedRequest = await overtimeRequestModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate({
        path: "employee",
        select: "fullName employeeCode email image",
        populate: [
          { path: "department", select: "name" },
          { path: "position", select: "title" },
        ],
      })
      .populate("approvedBy", "fullName employeeCode email image");

    return updatedRequest;
  }

  static async deleteOvertimeRequest(req) {
    const { id } = req.params;

    const overtimeRequest = await overtimeRequestModel.findById(id);

    if (!overtimeRequest) {
      throw new CustomError(
        ErrorTypes.OverTimeRequestNotFound,
        ErrorMessages.OverTimeRequestNotFound
      );
    }

    if (overtimeRequest.status !== "pending") {
      throw new CustomError(
        ErrorTypes.OvertimeRequestIsNotPending,
        ErrorMessages.OvertimeRequestIsNotPending
      );
    }

    await overtimeRequestModel.findByIdAndDelete(id);

    return { message: "Overtime request deleted successfully" };
  }

  static async getMyOvertimeRequests(req) {
    const employeeId = req.user.employeeId;
    const {
      page = 1,
      limit = 10,
      sort = "-createdAt",
      status,
      startDate,
      endDate,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {
      employee: employeeId,
    };

    if (status && status !== "all") {
      query.status = status;
    }

    if (startDate && endDate) {
      const startDateObj = new Date(startDate);
      startDateObj.setHours(0, 0, 0, 0);

      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);

      query.date = {
        $gte: startDateObj,
        $lte: endDateObj,
      };
    }

    const overtimeRequests = await overtimeRequestModel
      .find(query)
      .sort(sort.startsWith("-") ? { [sort.substring(1)]: -1 } : { [sort]: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("approvedBy", "fullName employeeCode");

    const totalRecords = await overtimeRequestModel.countDocuments(query);

    const pagination = {
      total: totalRecords,
      limit: parseInt(limit),
      page: parseInt(page),
      totalPages: Math.ceil(totalRecords / parseInt(limit)),
    };

    return {
      data: overtimeRequests,
      pagination,
    };
  }
}

module.exports = OvertimeRequestService;
