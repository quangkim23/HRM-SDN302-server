const leaveBalanceController = require("../../controllers/leave-balance-controller");
const leaveController = require("../../controllers/leave-controller");
const asyncHandler = require("../../middlewares/async-handler-middleware");

const leaveBalanceRouter = require("express").Router();

leaveBalanceRouter.put(
  "/updateLeaveBalance/:leaveId",
  asyncHandler(leaveBalanceController.updateLeaveBalance)
);

module.exports = leaveBalanceRouter;
