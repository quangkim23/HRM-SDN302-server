const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var overtimeRequestSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    requestedHours: {
      type: Number,
      required: true,
      min: 0.5,
      max: 8,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    approvedHours: Number,
    rejectionReason: String,
  },
  { timestamps: true }
);

//Export the model
module.exports = mongoose.model(
  "OvertimeRequest",
  overtimeRequestSchema,
  "OvertimeRequests"
);
