const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var holidaySchema = new mongoose.Schema({
    startDate:{
        type:Date,
        required:true
    },
    endDate:{
        type:Date,
        required:true
    },
    description: String,
    
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    modifiedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    }
}, {timestamps: true});

//Export the model
module.exports = mongoose.model('Holiday', holidaySchema, 'Holidays');