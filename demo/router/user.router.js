const { Router } = require('express');
const { RegisterUser, LoginUser, handleOtpVerification ,SendOtpVerification, ReSendOtpVerification, logoutUser, forgetPassword, resetPassword,  verifylogin, verifyforgetpwd, getStatesRead, PhoneNumbercrete, verifyphoneotp, loginwithGoogle, loginwithmobile } = require('../controller/user.controller');
const { auth } = require('../middleware/user.middleware');
const userRouter = Router();
// Define user-related routes here
userRouter.post('/register', RegisterUser);
// login route
userRouter.post('/login', LoginUser);
// login with Google
userRouter.post("/login/g",loginwithGoogle);
// login with mobile
userRouter.post("/login/p",loginwithmobile);
// verrify otp route can be added here 
userRouter.post('/verifyotp', handleOtpVerification);
// send otp route can be added here
userRouter.post('/sendotp', SendOtpVerification);
// resend otp route can be added here
userRouter.post('/resendotp', ReSendOtpVerification);
// logout  route can be added here
userRouter.post("/logout",auth, logoutUser);
// userRouter.post('/resetpassword', resetPassword)
userRouter.post("/forgetpassword", forgetPassword);

userRouter.post("/resetpassword/:_id/:token", resetPassword);
// userRouter.get("/resetpassword/:_id/:token", getResetPasswordToken);
userRouter.post("/verifyforgototp", verifyforgetpwd);

userRouter.get("/states/read", getStatesRead)
module.exports = {userRouter};