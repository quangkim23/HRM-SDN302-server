const mongoose = require("mongoose");
const Salary = require("../models/salary-model");
const Employee = require("../models/employee-model");
const Attendance = require("../models/attendance-model");
const Leave = require("../models/leave-model");
const CustomError = require("../core/custom-error");
const ErrorTypes = require("../constants/error-type");
const ErrorMessages = require("../constants/error-message");
const { differenceInMinutes, format, startOfMonth, endOfMonth, isSameMonth, isBefore, differenceInBusinessDays } = require("date-fns");
const employeeModel = require("../models/employee-model");

class SalaryService {
  /**
   * Lấy danh sách tất cả bản ghi lương theo các tiêu chí lọc
   */
  static getAllSalaries = async (req) => {
    const { page = 1, limit = 10, month, year, employeeId, status, search, department, isPreliminary } = req.query;
    
    const query = {};
    
    let employeeIdsSet = new Set([]);

    console.log('search', search);
    console.log('department', department);

    if(search){
      let employees = await employeeModel.find({
        $or: [
          {fullName: {$regex: search, $options: 'i'}},
          {employeeCode: {$regex: search, $options: 'i'}}
        ]
      }).lean();

      employees.forEach(employee => {
        employeeIdsSet.add(employee._id);
      })
    }

    if(department){
      let employees = await employeeModel.find({
       department: department
      }).lean();

      employees.forEach(employee => {
        employeeIdsSet.add(employee._id);
      })
    }
    if(employeeIdsSet.size > 0) query.employee = {$in: [...employeeIdsSet]};

    console.log(query);
    
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (employeeId) query.employee = employeeId;
    if (status) query.status = status;
    if(isPreliminary) query.isPreliminary = isPreliminary;

    const totalDocuments = await Salary.countDocuments(query);
    
    const salaries = await Salary.find(query)
      .populate("employee", "fullName employeeCode image position department")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return {
      data: salaries,
      pagination: {
        total: totalDocuments,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalDocuments / limit),
      },
    };
  };

  static calculateSalary = async (req) => {
    const { 
      employeeId,
      month,
      year,
      allowances = [],
      bonuses = [],
      deductions = [],
      paymentMethod = "bank",
      bankInfo = {},
      note = "",
      isPreliminary = false // Cờ để xác định nếu đây là tính lương tạm tính giữa tháng
    } = req.body;

    // Lấy thông tin nhân viên để có mức lương cơ bản
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new CustomError(
        ErrorTypes.EmployeeIdNotExist,
        ErrorMessages.EmployeeIdNotExist
      );
    }

    if (!employee.baseSalary) {
      throw new CustomError(
        ErrorTypes.EmployeeBaseSalaryNotSet,
        "Lương cơ bản của nhân viên chưa được thiết lập."
      );
    }
    
    // Kiểm tra nếu đã tồn tại bản ghi lương cho tháng/năm này
    if (!isPreliminary) {
      const existingSalary = await Salary.findOne({
        employee: employeeId,
        month: parseInt(month),
        year: parseInt(year),
        isPreliminary: false
      });

      if (existingSalary) {
        throw new CustomError(
          ErrorTypes.SalaryAlreadyExistsForMonthYear,
          `Đã tồn tại bản ghi lương cho nhân viên này trong tháng ${month}/${year}`
        );
      }
    }

    // Thiết lập phạm vi ngày
    let startDate, endDate;
    const today = new Date();
    const targetMonth = parseInt(month) - 1; // Trừ 1 vì tháng trong JS bắt đầu từ 0
    const targetYear = parseInt(year);
    
    if (isPreliminary && 
        ((today.getMonth() === targetMonth && today.getFullYear() === targetYear) || 
         (today.getFullYear() > targetYear) || 
         (today.getFullYear() === targetYear && today.getMonth() > targetMonth))) {
      // Tính toán sơ bộ, sử dụng ngày hiện tại làm ngày kết thúc nếu vẫn trong tháng đó
      // hoặc cuối tháng nếu đã qua tháng đó
      startDate = new Date(targetYear, targetMonth, 1);
      
      if (today.getMonth() === targetMonth && today.getFullYear() === targetYear) {
        endDate = today;
      } else {
        endDate = new Date(targetYear, targetMonth + 1, 0); // Ngày cuối tháng
      }
    } else {
      // Tính toán cuối cùng hoặc tháng trong tương lai, sử dụng toàn bộ tháng
      startDate = new Date(targetYear, targetMonth, 1);
      endDate = new Date(targetYear, targetMonth + 1, 0); // Ngày cuối tháng
    }
    
    // Lấy các bản ghi chấm công cho khoảng thời gian
    const attendanceRecords = await Attendance.find({
      employee: employeeId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    const standardDailyWorkMinutes = 8 * 60;

    const firstDayOfMonth = new Date(targetYear, targetMonth, 1);
    const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0);
    const standardWorkDaysInMonth = differenceInBusinessDays(lastDayOfMonth, firstDayOfMonth) + 1;

    const totalExpectedMonthlyMinutes = standardWorkDaysInMonth * standardDailyWorkMinutes;
    
    let totalWorkedMinutes = 0;
    let totalWorkDays = 0;
    let lateMinutes = 0;
    let earlyLeaveMinutes = 0;
    let overtimeMinutes = 0;

    attendanceRecords.forEach(record => {
      // Tính số phút làm việc trong ngày này
      if (record.checkIn.time && record.checkOut.time) {
        if(record.overtimeHours){
          overtimeMinutes += record.overtimeHours * 60;
        }


        const checkInTime = new Date(record.checkIn.time);
        const checkOutTime = new Date(record.checkOut.time);
        
        // Kiểm tra nếu thời gian check-in trễ hơn thời gian bắt đầu tiêu chuẩn (ví dụ: 9:00 sáng)
        const standardStartTime = new Date(record.date);
        standardStartTime.setHours(9, 0, 0, 0); // Giả sử 9:00 sáng là giờ bắt đầu
        
        // Kiểm tra nếu thời gian check-out sớm hơn thời gian kết thúc tiêu chuẩn (ví dụ: 6:00 chiều)
        const standardEndTime = new Date(record.date);
        standardEndTime.setHours(18, 0, 0, 0); // Giả sử 6:00 chiều là giờ kết thúc
        
        // Tính số phút đi muộn
        if (checkInTime > standardStartTime) {
          const minutesLate = differenceInMinutes(checkInTime, standardStartTime);
          lateMinutes += minutesLate;
        }
        
        // Tính số phút về sớm
        if (checkOutTime < standardEndTime) {
          const minutesEarlyLeave = differenceInMinutes(standardEndTime, checkOutTime);
          earlyLeaveMinutes += minutesEarlyLeave;
        }

        let checkInCalculation = checkInTime < standardStartTime ? standardStartTime : checkInTime;
        let checkOutCalculation = checkOutTime > standardEndTime ? standardEndTime : checkOutTime;
        
        // Tính tổng số phút làm việc
        const workedMinutes = differenceInMinutes(checkOutCalculation, checkInCalculation);
        totalWorkedMinutes += workedMinutes;
        totalWorkDays += 1;
      }
    });
    
    // Lấy các đơn nghỉ phép được duyệt trong tháng
    const leaveRecords = await Leave.find({
      employee: employeeId,
      status: "approved",
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } }, // Kỳ nghỉ chồng lấp với khoảng thời gian
      ],
    });

    // Tính tổng số ngày nghỉ phép được duyệt trong khoảng thời gian
    let totalApprovedLeaveDays = 0;
    let paidLeaveMinutes = 0;
    
    leaveRecords.forEach(leave => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      
      // Nếu kỳ nghỉ chỉ một phần trong khoảng thời gian, chỉ tính ngày chồng lấn
      const effectiveStart = isBefore(leaveStart, startDate) ? startDate : leaveStart;
      const effectiveEnd = isBefore(endDate, leaveEnd) ? endDate : leaveEnd;
      
      // Tính ngày làm việc giữa effectiveStart và effectiveEnd
      // Đây là đơn giản hóa - trong ứng dụng thực tế bạn sẽ tính đến cuối tuần, ngày lễ
      const daysDifference = differenceInBusinessDays(effectiveEnd, effectiveStart) + 1;
      // Giả sử 5 ngày làm việc một tuần
      const businessDays = Math.min(daysDifference, leave.totalDays);
      
      if (["annual", "sick"].includes(leave.leaveType)) {
        // Đối với các loại nghỉ phép có lương, tính vào thời gian được trả lương
        paidLeaveMinutes += businessDays * standardDailyWorkMinutes;
        totalApprovedLeaveDays += businessDays;
      }
    });
    
    // Tính tổng số ngày vắng mặt (ngày làm việc dự kiến trừ đi ngày làm việc thực tế và ngày nghỉ phép được duyệt)
    // Đối với tính toán sơ bộ, tính tỷ lệ ngày làm việc dự kiến dựa trên ngày hiện tại
    let totalWorkingDaysInPeriod;
    let isPastFullMonth = false;
    
    if (isPreliminary && today.getMonth() === targetMonth && today.getFullYear() === targetYear) {
      // Nếu đang trong tháng đó, tính dựa trên số ngày đã qua
      const firstDayOfMonth = new Date(targetYear, targetMonth, 1);
  
      // differenceInBusinessDays không tính ngày cuối cùng, nên cần +1
      totalWorkingDaysInPeriod = differenceInBusinessDays(today, firstDayOfMonth) + 1;
      
      console.log(`Số ngày làm việc từ ${format(firstDayOfMonth, 'dd/MM/yyyy')} đến ${format(today, 'dd/MM/yyyy')}: ${totalWorkingDaysInPeriod}`);
    } else if (isPreliminary) {
      // Nếu đã qua tháng đó, sử dụng toàn bộ tháng
      totalWorkingDaysInPeriod = standardWorkDaysInMonth;
      isPastFullMonth = true;
    } else {
      // Tính toán cuối cùng, sử dụng toàn bộ tháng
      totalWorkingDaysInPeriod = standardWorkDaysInMonth;
      isPastFullMonth = true;
    }
    
    // Tính tổng số phút làm việc dự kiến trong kỳ
    const totalExpectedMinutesInPeriod = totalWorkingDaysInPeriod * standardDailyWorkMinutes;
    
    // Tính tổng số phút vắng mặt
    const totalAbsenceMinutes = Math.max(0, totalExpectedMinutesInPeriod - totalWorkedMinutes - paidLeaveMinutes);

    console.log('totalWorkingDaysInPeriod', totalWorkingDaysInPeriod);
    console.log('totalExpectedMinutesInPeriod', totalExpectedMinutesInPeriod)
    console.log('totalWorkedMinutes', totalWorkedMinutes)
    console.log('paidLeaveMinutes', paidLeaveMinutes)
    console.log('totalAbsenceMinutes', totalAbsenceMinutes)
    
    // Chuyển phút vắng mặt thành ngày vắng mặt
    const totalAbsenceDays = Math.round(totalAbsenceMinutes / standardDailyWorkMinutes * 10) / 10; // Làm tròn đến 1 chữ số thập phân
    
    // Tính khấu trừ do đi muộn/về sớm (nếu cần)
    let lateDeduction = 0;
    if (lateMinutes > 0 || earlyLeaveMinutes > 0) {
      // Ví dụ: Mỗi 30 phút đi muộn/về sớm sẽ bị khấu trừ 50,000 VND
      const totalLateEarlyMinutes = lateMinutes + earlyLeaveMinutes;
      lateDeduction = Math.floor(totalLateEarlyMinutes / 30) * 50000;
      
      // Thêm vào mảng khấu trừ
      if (lateDeduction > 0) {
        deductions.push({
          type: "other",
          amount: lateDeduction,
          description: `Khấu trừ do đi muộn ${lateMinutes} phút và về sớm ${earlyLeaveMinutes} phút`
        });
      }
    }
    
    // Tính khấu trừ do vắng mặt
    let absenceDeduction = 0;
    if (totalAbsenceDays > 0) {
      // Tính lương theo ngày
      const dailySalary = employee.baseSalary / standardWorkDaysInMonth;
      absenceDeduction = dailySalary * totalAbsenceDays;
      console.log(dailySalary)      
      // Thêm vào mảng khấu trừ
      deductions.push({
        type: "absence",
        amount: Math.round(absenceDeduction),
        description: `Khấu trừ do vắng mặt ${totalAbsenceDays} ngày`
      });
    }
    
    const moneyOT = (employee.baseSalary / standardWorkDaysInMonth) / 8 * 3;
    if(overtimeMinutes !== 0){
      let resultOT = overtimeMinutes / 60 * moneyOT;
      allowances.push({
          type: "other",
          amount: resultOT,
          description: `Overtime: ${overtimeMinutes / 60} Hours`
        });
    }
    // Tính tổng các khoản phụ cấp
    const totalAllowances = allowances.reduce((sum, item) => sum + item.amount, 0);
    
    // Tính tổng các khoản thưởng
    const totalBonuses = bonuses.reduce((sum, item) => sum + item.amount, 0);
    
    // Tính tổng các khoản khấu trừ (bao gồm cả khấu trừ do vắng mặt và đi muộn/về sớm)
    const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
    
    // Tính tổng lương
    let totalSalary;
    
    if (isPreliminary && !isPastFullMonth) {
      // Nếu là tính tạm giữa tháng, tính tỷ lệ lương cơ bản theo số ngày làm việc
      const baseSalaryProrated = (employee.baseSalary / standardWorkDaysInMonth) * totalWorkingDaysInPeriod;
      totalSalary = baseSalaryProrated + totalAllowances + totalBonuses - totalDeductions;
    } else {
      // Nếu là tính cho cả tháng hoặc tháng đã kết thúc
      totalSalary = employee.baseSalary + totalAllowances + totalBonuses - totalDeductions;
    }
    
    // Tạo và lưu bản ghi lương
    const salaryData = {
      employee: employeeId,
      baseSalary: employee.baseSalary,
      allowances,
      bonuses,
      deductions,
      summaries: {
        totalAllowances,
        totalBonuses,
        totalDeductions,
        totalWorkDays,
        totalAbsenceDays,
        totalApprovedLeaveDays
      },
      totalSalary: Math.round(totalSalary), // Làm tròn số
      month: parseInt(month),
      year: parseInt(year),
      paymentMethod,
      bankInfo,
      note,
      status: isPreliminary ? "pending" : "pending" // Luôn đặt là pending ban đầu
    };
    
    if (isPreliminary) {
      // Nếu là bản tạm tính, thêm thuộc tính isPreliminary (nếu cần)
      salaryData.isPreliminary = true;
      salaryData.baseSalaryIsPreliminary = (employee.baseSalary / standardWorkDaysInMonth) * totalWorkingDaysInPeriod;
      salaryData.note = (salaryData.note ? salaryData.note + " | " : "") + "Đây là bản tính lương tạm tính.";
    }

    console.log(salaryData)
    
    let salaryRecord;
    
    // Nếu là tính tạm và đã có bản tạm tính trước đó, cập nhật bản ghi đó
    if (isPreliminary) {
      const existingPreliminary = await Salary.findOne({
        employee: employeeId,
        month: parseInt(month),
        year: parseInt(year),
        isPreliminary: true
      });
      
      if (existingPreliminary) {
        // Cập nhật bản ghi hiện có
        salaryRecord = await Salary.findByIdAndUpdate(
          existingPreliminary._id,
          { $set: salaryData },
          { new: true }
        ).populate("employee", "fullName employeeCode image position department");
      } else {
        // Tạo bản ghi mới
        const newSalaryRecord = new Salary(salaryData);
        salaryRecord = await newSalaryRecord.save();
        salaryRecord = await Salary.findById(salaryRecord._id)
          .populate("employee", "fullName employeeCode image position department");
      }
    } else {
      // Tạo bản ghi lương mới (không phải tạm tính)
      const newSalaryRecord = new Salary(salaryData);
      salaryRecord = await newSalaryRecord.save();
      salaryRecord = await Salary.findById(salaryRecord._id)
        .populate("employee", "fullName employeeCode image position department");
    }
    
    return salaryRecord;
  };

  /**
   * Lấy thông tin lương theo ID
   */
  static getSalaryById = async (req) => {
    const { salaryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(salaryId)) {
      throw new CustomError(
        ErrorTypes.InvalidObjectId,
        ErrorMessages.InvalidObjectId
      );
    }

    const salary = await Salary.findById(salaryId)
      .populate("employee", "fullName employeeCode image position department");
    
    if (!salary) {
      throw new CustomError(
        ErrorTypes.SalaryNotFound,
        ErrorMessages.SalaryNotFound
      );
    }

    return salary;
  };

  /**
   * Lấy thông tin lương của tôi theo tháng/năm
   */
  static getMyMonthlySalary = async (req) => {
    const { month, year } = req.query;
    const employeeId = req.user.employeeId;

    const query = {
      employee: employeeId
    };

    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const salary = await Salary.findOne(query)
      .sort({ isPreliminary: 1, createdAt: -1 }) // Ưu tiên bản cuối cùng (không phải tạm tính)
      .populate("employee", "fullName employeeCode image position department");

    if (!salary) {
      // Nếu không có bản ghi lương, trả về dữ liệu trống
      return null;
    }

    return salary;
  };

  /**
   * Lấy tất cả bản ghi lương của tôi
   */
  static getMyAllSalaries = async (req) => {
    const { page = 1, limit = 10, month, year } = req.query;
    const employeeId = req.user.employeeId;
    
    const query = {
      employee: employeeId,
      isPreliminary: { $ne: true } // Chỉ lấy bản ghi cuối cùng, không lấy bản tạm
    };
    
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const totalDocuments = await Salary.countDocuments(query);
    
    const salaries = await Salary.find(query)
      .sort({ year: -1, month: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('employee');

    return {
      data: salaries,
      pagination: {
        total: totalDocuments,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalDocuments / limit),
      },
    };
  };

  /**
   * Cập nhật thông tin lương
   */
  static updateSalary = async (req) => {
    const { salaryId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(salaryId)) {
      throw new CustomError(
        ErrorTypes.InvalidObjectId,
        ErrorMessages.InvalidObjectId
      );
    }

    const salary = await Salary.findById(salaryId);
    
    if (!salary) {
      throw new CustomError(
        ErrorTypes.SalaryNotFound,
        ErrorMessages.SalaryNotFound
      );
    }

    // Kiểm tra nếu lương đã được trả, không cho phép cập nhật
    if (salary.status === "paid") {
      throw new CustomError(
        ErrorTypes.SalaryAlreadyPaid,
        "Không thể cập nhật thông tin lương đã được thanh toán."
      );
    }

    // Chỉ cho phép cập nhật một số trường cụ thể
    const allowedUpdates = [
      "allowances", 
      "bonuses", 
      "deductions", 
      "paymentMethod", 
      "bankInfo", 
      "note"
    ];
    
    const updates = {};
    
    // Lọc các trường được phép cập nhật
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    });
    
    // Nếu có cập nhật allowances, bonuses hoặc deductions, tính lại tổng
    if (updates.allowances !== undefined || 
        updates.bonuses !== undefined || 
        updates.deductions !== undefined) {
      
      // Lấy dữ liệu hiện tại hoặc cập nhật
      const allowances = updates.allowances || salary.allowances;
      const bonuses = updates.bonuses || salary.bonuses;
      const deductions = updates.deductions || salary.deductions;
      
      // Tính tổng
      const totalAllowances = allowances.reduce((sum, item) => sum + item.amount, 0);
      const totalBonuses = bonuses.reduce((sum, item) => sum + item.amount, 0);
      const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
      
      // Cập nhật tổng số
      updates.summaries = {
        ...salary.summaries,
        totalAllowances,
        totalBonuses,
        totalDeductions
      };
      
      // Tính lại tổng lương
      updates.totalSalary = Math.round(salary.baseSalary + totalAllowances + totalBonuses - totalDeductions);
    }
    
    // Cập nhật bản ghi
    const updatedSalary = await Salary.findByIdAndUpdate(
      salaryId,
      { $set: updates },
      { new: true }
    ).populate("employee", "fullName employeeCode image position department");
    
    return updatedSalary;
  };

  /**
   * Thanh toán lương
   */
  static paySalary = async (req) => {
    const { salaryId } = req.params;
    const { paymentDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(salaryId)) {
      throw new CustomError(
        ErrorTypes.InvalidObjectId,
        ErrorMessages.InvalidObjectId
      );
    }

    const salary = await Salary.findById(salaryId);
    
    if (!salary) {
      throw new CustomError(
        ErrorTypes.SalaryNotFound,
        ErrorMessages.SalaryNotFound
      );
    }

    // Kiểm tra nếu lương đã được trả
    if (salary.status === "paid") {
      throw new CustomError(
        ErrorTypes.SalaryAlreadyPaid,
        "Lương đã được thanh toán trước đó."
      );
    }
    
    // Kiểm tra nếu là bản tạm tính
    if (salary.isPreliminary) {
      throw new CustomError(
        ErrorTypes.CannotPayPreliminarySalary,
        "Không thể thanh toán bản lương tạm tính. Vui lòng tạo bản lương chính thức."
      );
    }

    // Cập nhật trạng thái và ngày thanh toán
    const updatedSalary = await Salary.findByIdAndUpdate(
      salaryId,
      { 
        $set: { 
          status: "paid",
          paymentDate: paymentDate || new Date()
        } 
      },
      { new: true }
    ).populate("employee", "fullName employeeCode image position department");
    
    return updatedSalary;
  };

  /**
   * Hủy bỏ lương
   */
  static cancelSalary = async (req) => {
    const { salaryId } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(salaryId)) {
      throw new CustomError(
        ErrorTypes.InvalidObjectId,
        ErrorMessages.InvalidObjectId
      );
    }

    const salary = await Salary.findById(salaryId);
    
    if (!salary) {
      throw new CustomError(
        ErrorTypes.SalaryNotFound,
        ErrorMessages.SalaryNotFound
      );
    }

    // Kiểm tra nếu lương đã được trả, không cho phép hủy
    if (salary.status === "paid") {
      throw new CustomError(
        ErrorTypes.SalaryAlreadyPaid,
        "Không thể hủy bỏ bản ghi lương đã được thanh toán."
      );
    }

    // Cập nhật trạng thái và ghi chú
    const updatedSalary = await Salary.findByIdAndUpdate(
      salaryId,
      { 
        $set: { 
          status: "cancelled",
          note: reason ? (salary.note ? `${salary.note} | HỦY: ${reason}` : `HỦY: ${reason}`) : salary.note
        } 
      },
      { new: true }
    ).populate("employee", "fullName employeeCode image position department");
    
    return updatedSalary;
  };

  /**
   * Xóa bản ghi lương (chỉ cho phép xóa bản tạm tính hoặc bản chưa thanh toán)
   */
  static deleteSalary = async (req) => {
    const { salaryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(salaryId)) {
      throw new CustomError(
        ErrorTypes.InvalidObjectId,
        ErrorMessages.InvalidObjectId
      );
    }

    const salary = await Salary.findById(salaryId);
    
    if (!salary) {
      throw new CustomError(
        ErrorTypes.SalaryNotFound,
        ErrorMessages.SalaryNotFound
      );
    }

    // Kiểm tra nếu lương đã được trả, không cho phép xóa
    if (salary.status === "paid") {
      throw new CustomError(
        ErrorTypes.SalaryAlreadyPaid,
        "Không thể xóa bản ghi lương đã được thanh toán."
      );
    }

    // Xóa bản ghi
    await Salary.findByIdAndDelete(salaryId);
    
    return { message: "Xóa bản ghi lương thành công." };
  };
}

module.exports = SalaryService;