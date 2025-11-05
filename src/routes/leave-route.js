const leaveController = require("../../controllers/leave-controller");
const asyncHandler = require("../../middlewares/async-handler-middleware");
const { verifyAccessToken } = require("../../middlewares/verify-token-middleware");

const leaveRouter = require("express").Router();

leaveRouter.post(
  "/leaveRequest/:employeeId",
  asyncHandler(leaveController.leaveRequest)
);

leaveRouter.put(
  "/cancelledLeave/:leaveId",
  asyncHandler(leaveController.cancelledLeave)
);

leaveRouter.post("/createRequest",verifyAccessToken, asyncHandler(leaveController.createLeaveRequest));

leaveRouter.get("/my-requests", verifyAccessToken, asyncHandler(leaveController.getMyLeaveRequests));

leaveRouter.get("/requests/:id", asyncHandler(leaveController.getLeaveRequestById));

leaveRouter.put("/requests/:id", asyncHandler(leaveController.updateLeaveRequest));

leaveRouter.patch("/cancelRequest/:id", verifyAccessToken, asyncHandler(leaveController.cancelLeaveRequest));

leaveRouter.delete("/deleteRequest/:id", verifyAccessToken, asyncHandler(leaveController.deleteLeaveRequest));

leaveRouter.get("/balance", verifyAccessToken, asyncHandler(leaveController.getLeaveBalance));

leaveRouter.get("/requests", asyncHandler(leaveController.getAllLeaveRequests));

leaveRouter.patch("/processRequests/:id",verifyAccessToken, asyncHandler(leaveController.processLeaveRequest));

// leaveRouter.get("/balance/employee", asyncHandler(leaveController.getLeaveBalance));

module.exports = leaveRouter;
