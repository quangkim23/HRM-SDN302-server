const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.ObjectId,
    ref: "Employee",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  dayType: {
    type: String,
    enum: ['workday', 'weekend', 'holiday'],
    required: true,
    default: 'workday'
  },
  scheduledStart: {
    type: Date,
    required: true
  },
  scheduledEnd: {
    type: Date,
    required: true
  },
  checkIn: {
    time: Date,
    device: String,
    ipAddress: String
  },
  checkOut: {
    time: Date,
    device: String,
    ipAddress: String
  },
  status: {
    type: String,
    enum: [
      "present",
      "absent",
      "halfDay",
      "late",
      "earlyLeave",
      "holiday",
      "weekend",
      "onLeave",
      "inProgress"
    ],
    required: true,
  },
  workingHours: {
    type: Number,
    default: 0,
  },
  overtimeHours: {
    type: Number,
    default: 0,
  },
  overtimeRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OvertimeRequest'
  },
  note: String,
  approvedAt: Date,
  rejectionReason: String
}, { timestamps: true });

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

//Export the model
module.exports = mongoose.model("Attendance", attendanceSchema, "Attendances");
