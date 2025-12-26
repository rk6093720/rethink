const mongoose = require('mongoose');
const newOtpSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, required: true, unique: true, maxlength: 10 },
    otp: { type: String },
    createdAt: { type: Date, default: Date.now, expires: 300 }, // OTP expires in 5 minutes
    resetotp:{type:String},
    resetOtpExpire:{type:String}
  }
);
const OtpModal = mongoose.model('Otp', newOtpSchema);
module.exports = { OtpModal };
