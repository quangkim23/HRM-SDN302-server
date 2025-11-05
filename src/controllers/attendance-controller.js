const AttendanceService = require("../services/attendance-service");

class AttendanceController {
    checkIn = async (req, res, next) => {
        let result = await AttendanceService.checkIn(req);

        return res.status(200).json(result);
    }

    checkOut = async (req, res, next) => {
        let result = await AttendanceService.checkOut(req);

        return res.status(200).json(result);
    }

    createDailyAttendanceRecordsManually = async (req,res, next) => {
        let result = await AttendanceService.createDailyAttendanceRecordsJob(req);

        return res.status(200).json({});
    }

    generateAttendanceQRCode = async (req, res, next) => {
        let result = await AttendanceService.generateAttendanceQRCode(req);

        return res.status(200).json(result);
    }

    verifyAttendanceQR = async (req, res, next) => {
        let result = await AttendanceService.verifyAttendanceQRCode(req);

        return res.status(200).json(result);
    }

    getAttendances = async (req, res) => {
        let result = await AttendanceService.getAttendances(req);

        return res.status(200).json(result);
      };
    
    getAttendanceById = async (req, res) => {
        let result = await AttendanceService.getAttendanceById(req);

        return res.status(200).json(result);
    };

    updateAttendance = async (req, res) => {
        let result = await AttendanceService.updateAttendance(req);

        return res.status(200).json(result);
    };

    handleProcessingCheckoutTheDayBefore = async (req, res, next) => {
        let result = await AttendanceService.handleProcessingCheckoutTheDayBefore(req);

        return res.status(200).json(result);
    }

    getStatistics = async (req, res) => {
    const statistics = await AttendanceService.getAttendanceStatistics(req);
    new OK({
        message: 'Attendance statistics retrieved successfully',
        metadata: statistics
    }).send(res);
    };
}

module.exports = new AttendanceController();