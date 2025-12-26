const mongoose = require("mongoose");

const userAuthSchema = new mongoose.Schema(
  {
    fullName: { type: String , required:true},
    state: { type: String,required:true },
    district: { type: String,required:true,  unique: false },
    password: { type: String, required:true },
    phoneNumber: { type: String, unique: true,required:true, maxlength: 10 },
    otp: { type: String },
    otpExpiry: { type: Date },
    token: { type: String },
    verifytoken: { type: String },
    verifyTokenExpiry:{type:Date,default:null},
    confirmPassword:{type:String}
  },
  { timestamps: true }
);

const UserAuthModal = mongoose.model("AuthProvider", userAuthSchema);
module.exports = { UserAuthModal };
