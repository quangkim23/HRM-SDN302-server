const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var salarySchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    baseSalary: {
      type: Number,
      required: true,
    },
    allowances: [
      {
        type: {
          type: String,
          enum: ["transportation", "housing", "meal", "phone", "other"],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        description: String,
      },
    ],
    bonuses: [
      {
        type: {
          type: String,
          enum: ["performance", "holiday", "project", "other"],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        description: String,
      },
    ],
    deductions: [
      {
        type: {
          type: String,
          enum: ["tax", "insurance", "absence", "other"],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        description: String,
      },
    ],
    summaries: {
      totalAllowances: { type: Number, default: 0 },  
      totalBonuses: { type: Number, default: 0 },
      totalDeductions: { type: Number, default: 0 },
      totalWorkDays: { type: Number, default: 0 },
      totalAbsenceDays: { type: Number, default: 0 }
    },
    totalSalary: {
      type: Number,
      required: true,
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ["bank", "cash", "other"],
      default: "bank",
    },
    bankInfo: {
      bankName: String,
      accountNumber: String,
      accountName: String,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },
    note: String,
  },
  {
    timestamps: true,
  }
);


// salarySchema.pre('save', function(next) {

//   const totalAllowances = this.allowances.reduce((sum, item) => sum + item.amount, 0);
//   const totalBonuses = this.bonuses.reduce((sum, item) => sum + item.amount, 0);
//   const totalDeductions = this.deductions.reduce((sum, item) => sum + item.amount, 0);
  
//   if (this.summaries) {
//     this.summaries.totalAllowances = totalAllowances;
//     this.summaries.totalBonuses = totalBonuses;
//     this.summaries.totalDeductions = totalDeductions;
//   }

//   this.totalSalary = this.baseSalary + totalAllowances + totalBonuses - totalDeductions;
  
//   next();
// });

//Export the model
module.exports = mongoose.model("Salary", salarySchema, "Salaries");
