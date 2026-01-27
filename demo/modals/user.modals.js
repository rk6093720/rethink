const mongoose = require("mongoose");
const userAuthSchema = new mongoose.Schema(
  {
    email: { type: String , required:function () {
      return !this.isloginwithMobile;   
    }},
    password: { type: String, required:function () {
      return !this.isloginwithMobile;  
    }, minLength:6},
    phone:{ type :String,maxlength:10,unique:true},
    token: { type: String },
    verifytoken: { type: String },
    firstName:{type:String},
    lastName:{type:String},
    state:{type:String},
    companyname:{type:String},
    role:{type:String},
    district:{type:String},
    city:{type: String},
    pincode:{type :String,minLength:6, maxLength:6},
    street:{type :String},
    avatar:{type : String},
    coverAvatar:{type: String},
    logoutType:{type:String, enum:["Mobile","Google", "Email"]},
    googleId:{type:String},
    isloginwithMobile:{type: Boolean, default:false},
    isloginwithGoogle:{type:Boolean, default:false},
    isloginwithEmail:{type:Boolean, default:false},
    otp:{type:String},
    otpExpire:{type:String}
  },
  { timestamps: true }
);
const UserAuthModal = mongoose.model("hyredin_Auth", userAuthSchema);
module.exports = { UserAuthModal };