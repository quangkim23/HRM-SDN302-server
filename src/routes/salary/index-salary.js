const express = require("express");
const salaryRouter = express.Router();
const SalaryController = require("../../controllers/salary-controller");
const asyncHandler = require("../../middlewares/async-handler-middleware");
const {
  verifyAccessToken,
} = require("../../middlewares/verify-token-middleware");

salaryRouter.use(verifyAccessToken);

salaryRouter.get("/my-salaries", asyncHandler(SalaryController.getMyAllSalaries));
salaryRouter.get("/my-monthly", asyncHandler(SalaryController.getMyMonthlySalary));

// Routes cho Admin/HR/Manager
salaryRouter.get("/", asyncHandler(SalaryController.getAllSalaries));
salaryRouter.post("/calculate", asyncHandler(SalaryController.calculateSalary));
salaryRouter.get("/:salaryId", asyncHandler(SalaryController.getSalaryById));
salaryRouter.put("/:salaryId", asyncHandler(SalaryController.updateSalary));
salaryRouter.patch("/:salaryId/pay", asyncHandler(SalaryController.paySalary));
salaryRouter.patch("/:salaryId/cancel", asyncHandler(SalaryController.cancelSalary));
salaryRouter.delete("/:salaryId", asyncHandler(SalaryController.deleteSalary));

module.exports = salaryRouter;
