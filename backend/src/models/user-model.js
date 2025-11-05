const mongoose = require('mongoose'); // Erase if already required
const bcrypt = require('bcrypt');
const crypto = require('crypto-js')
const tokenSecret = `Nghiem-Xuan-Loc`

const DOCUMENT_NAME = 'User'
const COLLECTION_NAME = 'Users'
// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema({
    username: {
        type: String,
        trim: true,
        require: true,
        unique: true
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    passwordHash:{
        type:String,
        required:true
    },
    status:{
        type:String,
        required:true,
        enum: ['active', 'inactive'],
        default: 'inactive'
    }, 
    roles: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Role'
        }
    ],
    employee: {
        type: mongoose.Schema.ObjectId,
        ref: 'Employee',
        unique: true
    },
    refreshToken: {
        type: String
    },
    passwordChangedAt: {
        type: String
    },
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: String
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

userSchema.pre('save', async function (next) {
    console.log("call function pre of userModel")
    if(this.isModified('passwordHash')){
        console.log("bcrypt password for user")
        const salt = bcrypt.genSaltSync(10);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    }
    next();
})

userSchema.methods = {
    isCorrectPasswordAsync: async function (password) {
        return await bcrypt.compareSync(password, this.passwordHash);
    },
    createPasswordChangedToken: async function() {
        const resetToken = crypto.lib.WordArray.random(32).toString(crypto.enc.Hex);

        this.passwordResetToken = crypto.HmacSHA256(resetToken, tokenSecret).toString();
        this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

        return resetToken;
    },
    verifyPasswordToken: async function(originalPasswordToken) {
        passwordTokenHash = crypto.HmacSHA256(originalPasswordToken, tokenSecret).toString();

        return passwordTokenHash === this.passwordResetToken;
    }
}

//Export the model
module.exports = mongoose.model(DOCUMENT_NAME, userSchema);