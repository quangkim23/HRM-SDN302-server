const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var employeeSchema = new mongoose.Schema({
    fullName:{
        type:String,
        required:true,
        trim: true
    },
    employeeCode: {
      type: String,
      required: true,
      unique: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true
    },
    address: {
      street: String,
      city: String,
      zipCode: String,
      country: String
    },
    phoneNumber: {
      type: String,
      unique: true,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    position: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    baseSalary: {
      type: Number
    },
    startDate: {
        type: Date
    },
    image: {
        type: String,
        default: 'https://res.cloudinary.com/dyz2xtks9/image/upload/v1741075645/Human%20Management/images/user_default_1741075643141.jpg'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'onLeave', 'terminated'],
      default: 'active'
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phoneNumber: String
    }
},{
    timestamps: true
});

//Export the model
module.exports = mongoose.model('Employee', employeeSchema, 'Employees');