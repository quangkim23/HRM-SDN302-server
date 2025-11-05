const SalaryService = require("../services/salary-service");

class SalaryController {
  // Lấy danh sách tất cả lương (Admin/HR/Manager)
  static getAllSalaries = async (req, res) => {
    const result = await SalaryService.getAllSalaries(req);
    return res.json(result);
  };

  // Tính lương cho nhân viên
  static calculateSalary = async (req, res) => {
    const salary = await SalaryService.calculateSalary(req);
    return res.json({ data: salary });
  };

  // Lấy thông tin lương theo ID
  static getSalaryById = async (req, res) => {
    const salary = await SalaryService.getSalaryById(req);
    return res.json({ data: salary });
  };

  // Lấy thông tin lương của tôi theo tháng/năm
  static getMyMonthlySalary = async (req, res) => {
    const salary = await SalaryService.getMyMonthlySalary(req);
    return res.json({ data: salary });
  };

  // Lấy tất cả bản ghi lương của tôi
  static getMyAllSalaries = async (req, res) => {
    const result = await SalaryService.getMyAllSalaries(req);
    return res.json(result);
  };

  // Cập nhật thông tin lương
  static updateSalary = async (req, res) => {
    const updatedSalary = await SalaryService.updateSalary(req);
    return res.json({ data: updatedSalary });
  };

  // Thanh toán lương
  static paySalary = async (req, res) => {
    const paidSalary = await SalaryService.paySalary(req);
    return res.json({ data: paidSalary });
  };

  // Hủy bỏ lương
  static cancelSalary = async (req, res) => {
    const cancelledSalary = await SalaryService.cancelSalary(req);
    return res.json({ data: cancelledSalary });
  };

  // Xóa bản ghi lương
  static deleteSalary = async (req, res) => {
    const result = await SalaryService.deleteSalary(req);
    return res.json(result);
  };
}

module.exports = SalaryController;
