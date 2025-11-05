const express = require('express');
const asyncHandler = require('../../middlewares/async-handler-middleware');
const attendanceController = require('../../controllers/attendance-controller');
const { verifyAccessToken } = require('../../middlewares/verify-token-middleware');
const { hasPermission } = require('../../middlewares/permission-middleware');
const ResourceName = require('../../constants/resource-name');
const ActionName = require('../../constants/action-name');
const router = express.Router()

router.post('/verify-qr', asyncHandler(attendanceController.verifyAttendanceQR));

router.post('/checkIn/:id', asyncHandler(attendanceController.checkIn));

router.post('/checkOut/:id', asyncHandler(attendanceController.checkOut));

router.use(verifyAccessToken);


router.get('/createDailyAttendanceRecordsManually', asyncHandler(attendanceController.createDailyAttendanceRecordsManually));

router.put('/handleProcessingCheckoutTheDayBefore', asyncHandler(attendanceController.handleProcessingCheckoutTheDayBefore));


router.get('/qr-code', hasPermission(ResourceName.ATTENDANCE, ActionName.CLOCK_IN), asyncHandler(attendanceController.generateAttendanceQRCode));

router.get('/getAttendances', hasPermission(ResourceName.ATTENDANCE, ActionName.READ), asyncHandler(attendanceController.getAttendances));

router.get('/statistics',hasPermission(ResourceName.ATTENDANCE, ActionName.READ), asyncHandler(attendanceController.getStatistics));

router.get('/getAttendance/:id', asyncHandler(attendanceController.getAttendanceById));

router.put('/updateAttendance/:id',hasPermission(ResourceName.ATTENDANCE, ActionName.UPDATE), asyncHandler(attendanceController.updateAttendance));

module.exports = router;