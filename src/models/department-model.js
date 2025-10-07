const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var departmentSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique: true,
        trim: true
    },
    description:{
        type:String,
        trim: true
    },
    manager: {
        type: mongoose.Schema.ObjectId,
        ref: 'Employee'
    },
    employees: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Employee'
        }
    ]
}, {timestamps: true});

//Export the model
module.exports = mongoose.model('Department', departmentSchema, 'Departments');