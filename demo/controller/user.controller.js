const { UserAuthModal } = require("../modals/user.modals");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose")
const india = require("india-state-district");
const { sendMsg91Sms } = require("../utils/twilosms");
const { messaging } = require("firebase-admin");
const { tokenModal } = require("../modals/tokenblacklist.modals.js");
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;

const validateEmail = (email) => {
  return emailRegex.test(email);
};

const RegisterUser = async (req, res) => {
  const { email, password, phone } = req.body;
  // console.log(`${email } ${password.length} ${phone}`)
  if (!email || !password || !phone) {
    return res.status(400).json({ success: false, message: "Email and Password , phone fields are required" });
  }
  if (password.length < 6) {
    return res.status(404).json({ success: false, message: "please put password more than 6 or equal to 6" })
  }
  if (phone.length < 10) {
    return res.status(404).json({ success: false, message: `${phone} number is invalid` })
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ success: false, message: `${email} Invalid` })
  }
  try {
    const normalizedEmail = email.toLowerCase().trim();
    // 🔹 Check phone number duplication (exclude current user)
    const emailExists = await UserAuthModal.findOne({ email });
    if (emailExists) {
      return res.status(409).json({ success: false, message: `${email} already exists` });
    }
    // 🔹 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // 🔹 Update existing user
    const newUser = await UserAuthModal.create({
      email: normalizedEmail,
      phone,
      password: hashedPassword,
      status: "active",
      isloginwithMobile: false,
      isloginwithGoogle: false,
      isloginwithEmail: false
    });
    await newUser.save();
    // 🔹 Generate JWT
    // const jwtToken = jwt.sign( {  email, userId: newUser._id }, process.env.JWT_SECRET,{ expiresIn: "2y" });
    // 🔹 Response
    return res.status(200).json({ success: true, message: "User registered successfully", newUser });

  } catch (err) {
    // console.error("Register Error:", err);
    return res.status(500).json({
      success: false, message: "Server error", error: err.message,
    });
  }
};
const LoginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await UserAuthModal.findOne({ email });
    // console.log("user",user)
    if (!user) {
      return res.status(400).json({ message: `Invalid ${email}` });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "2m" });
    user.isloginwithEmail = true;
    const loginwithemailuser = {
      uid: user._id,
      email: user.email,
      name: `${user.firstName}`,
      Mobile: user.isloginwithMobile,
      Google: user.isloginwithGoogle,
      Email: user.isloginwithEmail,
      tokenData: user.verifytoken == null ? token : null
    }
    await user.save();
    return res.status(200).json({ status: "success", message: "Login successful", loginwithemailuser });
  } catch (error) {
    res.status(500).json({ status: "failed", message: "Server error" });
  }
};

//login with Google 
const loginwithGoogle = async (req, res) => {

}
// login with Mobile and Otp 
const loginwithmobile = async (req, res) => {
  try {
    const { phone } = req.body;
    console.log(req.userId)
    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone is required" });
    }
    const existphone = await UserAuthModal.findOne({ phone });
    if (existphone) {
      return res.status(400).json({ success: false, message: `${phone} already exist here ` })
    }
    const user = await UserAuthModal.findOneAndUpdate(
      {},                         // 👈 current user (or use userId)
      {
        phone: phone,
        isloginwithMobile: true
      },
      {
        new: true,
        upsert: true
      }
    );
    console.log("UPDATED USER:", user); // 👈 debug

    return res.status(200).json({
      success: true,
      message: "Phone updated successfully",
      user
    });

  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// send otp handler
const SendOtpVerification = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Phone number required" });
    }
    // 🔍 STEP 1: Check phone in DB
    const user = await UserAuthModal.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: `${phone} not found` })
    }
    // 🔐 STEP 2: Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 💾 STEP 3: Save OTP
    await UserAuthModal.findOneAndUpdate(
      { phone },
      { otp, expiresAt }
    );

    console.log(`OTP for ${phone}: ${otp}`);

    // 📤 STEP 4: Response
    return res.status(200).json({
      message: "OTP sent successfully",
      status: "success",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to send OTP",
    });
  }
};

const handleOtpVerification = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await UserAuthModal.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (Date.now() > user.expiresAt) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // 🔐 Generate verify token
    const verifyToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // 🧹 clear OTP + save token
    user.otp = undefined;
    user.expiresAt = undefined;
    user.verifytoken = verifyToken;
    user.verifyTokenExpiry = Date.now() + 15 * 60 * 1000;

    await user.save();

    return res.status(200).json({
      message: "OTP verified successfully",
      verifyToken, // frontend ko bhejo
      _id: user._id
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const ReSendOtpVerification = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await UserAuthModal.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.expiresAt = Date.now() + 5 * 60 * 1000;
    await user.save();

    console.log(`Resent OTP ${otp} to ${phone}`);

    res.status(200).json({ message: "OTP resent successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const logoutUser = async (req, res) => {
  try {
    const userId = req.userId;      // from auth middleware
    const expiretime = req.exp;     // jwt expiry
    const token = req.token;        // current token

    if (!userId || !token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request"
      });
    }

    // 🔹 Find user
    const user = await UserAuthModal.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    // 🔹 Detect login type & cleanup
    if (user.isloginwithMobile) {
      user.logoutType = "Mobile";
      user.phone = null; // 🔥 remove phone on logout
    }
    if (user.isloginwithEmail) {
      user.logoutType = "Email";
    }
    if (user.isloginwithGoogle) { user.logoutType = "Google"; }

    // 🔹 Reset all login flags
    user.isloginwithMobile = false;
    user.isloginwithEmail = false;
    user.isloginwithGoogle = false;

    await user.save();

    // 🔹 Blacklist token
    await tokenModal.create({
      token,
      expiresAt: new Date(expiretime * 1000)
    });

    return res.status(200).json({
      success: true,
      message: `Logout successful from ${user.logoutType} `
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// forget password handler
const forgetPassword = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    // 1. Check if user exists
    const user = await UserAuthModal.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }
    // 2. Generate Password Reset OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // 3. Save OTP to user record
    user.otp = otp;
    user.otpExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    // 4. Send OTP SMS using Fast2SMS DLT
    // await sendDLTSms({
    //   templateId: process.env.DLT_TEMPLATE_ID_FORGOT,
    //   variables: otp,
    //   numbers: phone,
    // });
    console.log(`forgetotp to send ${phone} : ${otp}`)
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    // console.log(token)
    user.verifytoken = token;
    await user.save();
    // 4. Send OTP SMS using Twilio
    await sendMsg91Sms({
      mobiles: `+91${phone}`, // only digits, no +91 required
      message: `Your password reset OTP is: ${otp}`,
      token
    });
    return res.status(200).json({
      status: "success",
      message: "we sent to verification code", user,
      verifytoken: token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
      error: "something went wrong",
    });
  }
};

const getStatesRead = (req, res) => {
  try {
    const states = india.getAllStates(); // array of strings

    const data = states.map((stateName, stateIndex) => {
      // console.log(stateName.name);
      const districtsArr = india.getAllStatesWithDistricts(stateName.name);
      // console.log(districtsArr);
      const districts = districtsArr.map((districtName, i) => ({
        index: i + 1,
        name: districtName,
      }));

      return {
        index: stateIndex + 1,
        state: stateName,
        districts,
      };
    });

    res.status(200).json({
      status: "success",
      totalStates: data.length,
      state: { data },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "failed",
      message: "Failed to fetch states and districts",
    });
  }
};

const verifyforgetpwd = async (req, res) => {

  const { phone, otp } = req.body;

  const record = await UserAuthModal.findOne({ phone }).sort({ createdAt: -1 });

  if (!record) return res.status(400).json({ message: "OTP not found" });

  if (Date.now() > record.expiresAt) {
    return res.status(400).json({ message: "OTP expired" });
  }

  if (record.otp != otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  return res.json({ success: true, message: "OTP verified", record });

}

const resetPassword = async (req, res) => {
  try {
    const { _id, token } = req.params;
    const { password, confirmPassword } = req.body;

    console.log("_id:", _id);

    // 1️⃣ Validate ID
    if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    // 2️⃣ Find user (CORRECT WAY)
    const oldUser = await UserAuthModal.findById(_id);
    console.log("oldUser:", oldUser);

    if (!oldUser) {
      return res.status(404).json({ status: "User does not exist" });
    }

    // 3️⃣ Password match check
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // 4️⃣ Verify token
    // console.log(token);
    const secret = process.env.JWT_SECRET || "dsvfdbhjfds";
    const verify = jwt.verify(token, secret);

    // 5️⃣ Hash new password
    const encryptedPassword = await bcrypt.hash(password, 10);

    // 6️⃣ Update password (FIXED _id)
    await UserAuthModal.updateOne(
      { _id }, // ✅ correct
      {
        $set: {
          password: encryptedPassword,
          verifyToken: token,
          verifyTokenExpiry: null,
        },
      }
    );

    return res.status(200).json({
      status: "Password reset successful",
      phone: verify.phone,
      id: oldUser._id,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "Something Went Wrong" });
  }
};

module.exports = {
  RegisterUser,
  LoginUser,
  handleOtpVerification,
  SendOtpVerification,
  ReSendOtpVerification,
  logoutUser,
  forgetPassword,
  resetPassword,
  verifyforgetpwd,
  getStatesRead,
  loginwithGoogle,
  loginwithmobile
}