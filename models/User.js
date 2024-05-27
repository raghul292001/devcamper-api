const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { reset } = require('nodemon');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please add a valid email']
    },
    role: {
        type: String,
        enum: ['user', 'publisher'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please add a passsword'],
        minlength: 6,
        select: false
    },
    resetPasswordToken: String,
    resetPasswordExpitre: String,
    createdAt: {
        type: Date,
        default: Date.now
    }

});

//Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

//Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPITRE
    })
}
//Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}
//Generate and hash paasword token
UserSchema.methods.getResetPasswordToken = function () {
    //Generate Token
    const resetToken = crypto.randomBytes(20).toString('hex');
    //Hash Token and set to resetPasswordToken
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    //Set expire 
    this.resetPasswordExpitre = Date.now() + 10 * 60 * 1000;
    return resetToken;
}
module.exports = mongoose.model('user', UserSchema);