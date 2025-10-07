const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var positionSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        trim: true
    },
    description:{
        type:String,
        trim: true
    },
    salaryRange: {
      min: {
        type: Number
      },
      max: {
        type: Number
      }
    },
    department: {
        type: mongoose.Schema.ObjectId,
        ref: 'Department',
        required: true
    }
}, {timestamps: true});

positionSchema.index({ title: 1, department: 1 }, { unique: true });

//Export the model
module.exports = mongoose.model('Position', positionSchema, 'Positions');