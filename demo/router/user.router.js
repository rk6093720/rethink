const { Router } = require("express");
const passport = require("passport");
const {
    RegisterUser,
    LoginUser,
    loginwithmobile,
    handleOtpVerification,
    ReSendOtpVerification,
    logoutUser,
    forgetPassword,
    resetPassword,
    verifyforgetpwd,
    getStatesRead,
    loginwithGoogle,
    UserProfile,
    updateProfile
} = require("../controller/user.controller");

const { auth } = require("../middleware/user.middleware");
const { loginLimiter, otpLimiter } = require("../middleware/ratelimit");

const userRouter = Router();

/* =========================
   EMAIL / PASSWORD
========================= */

// Register
userRouter.post("/register", RegisterUser);
                     
// Login with Email + Password
userRouter.post("/login",loginLimiter, LoginUser);


/* =========================
   MOBILE + OTP
========================= */

// Login with Mobile (send OTP)
userRouter.post("/login/p",loginLimiter, loginwithmobile);

// Verify Mobile OTP
userRouter.post("/verifyotp",otpLimiter, handleOtpVerification);

// Resend OTP
userRouter.post("/resendotp",otpLimiter, ReSendOtpVerification);

/* =========================
   GOOGLE LOGIN (PASSPORT)
========================= */

// STEP 1: Redirect to Google
userRouter.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false
    })
);

// STEP 2: Google callback
userRouter.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: "http://localhost:3000/login"
    }),
    loginwithGoogle // controller
);

/* =========================
   LOGOUT
========================= */

userRouter.post("/logout", auth, logoutUser);

/* =========================
   FORGOT / RESET PASSWORD
========================= */

// Send forgot password OTP
userRouter.post("/forgetpassword", forgetPassword);

// Verify forgot password OTP
userRouter.post("/verifyforgototp", verifyforgetpwd);

// Reset password
userRouter.post("/resetpassword/:_id/:token", resetPassword);

/* =========================
   OTHER
========================= */

userRouter.get("/states/read", getStatesRead);
// profile 
userRouter.get("/profile", auth, UserProfile);
// update profile 
userRouter.put("/update/profile/:id",updateProfile)

module.exports = { userRouter };
