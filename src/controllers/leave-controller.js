const LeaveService = require("../services/leave-service");

class LeaveController {
  createLeaveRequest = async (req, res) => {
    const result = await LeaveService.createLeaveRequest(req);

    return res.status(200).json(result);
  };

  getAllLeaveRequests = async (req, res) => {
    const result = await LeaveService.getAllLeaveRequests(req);
    return res.status(200).json(result);
  };

  getMyLeaveRequests = async (req, res) => {
    const result = await LeaveService.getMyLeaveRequests(req);

    return res.status(200).json(result);
  };

  getLeaveRequestById = async (req, res) => {
    const result = await LeaveService.getLeaveRequestById(req);

    return res.status(200).json(result);
  };

  updateLeaveRequest = async (req, res) => {
    const result = await LeaveService.updateLeaveRequest(req);

    return res.status(200).json(result);
  };

  processLeaveRequest = async (req, res) => {
    const result = await LeaveService.processLeaveRequest(req);

    return res.status(200).json(result);
  };

  cancelLeaveRequest = async (req, res) => {
    const result = await LeaveService.cancelLeaveRequest(req);

    return res.status(200).json(result);
  };

  deleteLeaveRequest = async (req, res) => {
    const result = await LeaveService.deleteLeaveRequest(req);

    return res.status(200).json(result);
  };

  getLeaveBalance = async (req, res) => {
    const result = await LeaveService.getLeaveBalance(req);

    return res.status(200).json(result);
  };
}

module.exports = new LeaveController();
