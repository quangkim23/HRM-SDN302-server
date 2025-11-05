const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var leaveBalanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    annualLeave: {
      total: {
        type: Number,
        default: 12,
      },
      used: {
        type: Number,
        default: 0,
      },
      remaining: {
        type: Number,
        default: 12,
      },
    },
    sickLeave: {
      total: {
        type: Number,
        default: 30,
      },
      used: {
        type: Number,
        default: 0,
      },
      remaining: {
        type: Number,
        default: 30,
      },
    },
    unpaidLeave: {
      used: {
        type: Number,
        default: 0,
      },
    },
    note: String
  },
  { timestamps: true }
);

leaveBalanceSchema.index({ employee: 1, year: 1 }, { unique: true });

//Export the model
module.exports = mongoose.model(
  "LeaveBalance",
  leaveBalanceSchema,
  "LeaveBalances"
);
