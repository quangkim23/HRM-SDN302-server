const LeaveBalanceService = require("../services/leave-balance-service");

class LeaveBalanceController {
  updateLeaveBalance = async (req, res, next) => {
    const result = await LeaveBalanceService.updateLeaveBalance(req);

    return res.status(200).json(result);
  };
}

module.exports = new LeaveBalanceController();
