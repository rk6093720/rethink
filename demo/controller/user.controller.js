const { UserAuthModal } = require("../modals/user.modals");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose")
  const india = require("india-state-district");
// const firebaseAdmin = require("firebase-admin")
const { sendMsg91Sms } = require("../utils/twilosms");
// const { OtpModal } = require("../modals/otp.modals");
const RegisterUser = async (req, res) => {
  try {
    // const { id } = req.params;
    const { fullName, state, district, password, phoneNumber } = req.body;

    // 🔹 Validate fields
    if (!fullName || !state || !district || !password || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // 🔹 Check phone number duplication (exclude current user)
    const phoneExists = await UserAuthModal.findOne({
      phoneNumber
    });

    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists",
      });
    }

    // 🔹 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Update existing user
    const  newuser = new UserAuthModal({
      fullName,
      state,
      district,
      password:hashedPassword,
      phoneNumber
    })

    await newuser.save();
 
    // 🔹 Generate JWT
    const jwtToken = jwt.sign(
      {  phoneNumber },
      process.env.JWT_SECRET,
      { expiresIn: "2y" }
    );

    // 🔹 Response
    res.status(200).json({
      success: true,
      message: "User registered successfully",
      newuser,
      jwtToken
    });

  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
                        
const LoginUser = async (req, res) => {
  const { phoneNumber, password } = req?.body;
  try {
    if (password) {
      const user = await UserAuthModal.findOne({
        phoneNumber
      });
      if (!user) {
        return res.status(400).json({ message: "Invalid phoneNumber" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid password" });
      }

      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "2y" }
      );

      return res.status(200).json({
        status:"success",
        message: "Login successful",
        user: {
          uid: user._id,
          phoneNumber: user.phoneNumber,
          verifytoken: token,
          token
        }
      });
    }
    return res.status(400).json({ message: "Phone number or password required" });
  } catch (error) {
    res.status(500).json({ status:"failed",message: "Server error" });
  }
};
const verifylogin = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    // 1️⃣ Validation
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // 2️⃣ Check user exists   
    const user = await UserAuthModal.findOne({ phoneNumber });

    // 3️⃣ Response based on user existence
    if (!user) {
      return res.status(200).json({
        Status: "success",
        type: "signup",
        message: "User not found, proceed to signup",
      });
    }

    return res.status(200).json({
      Status:"success",
      type: "login",
      message: "User found, proceed to login",
      userId: user._id, // frontend ke kaam aa sakta hai
    });

  } catch (error) {
    return res.status(500).json({
      Status: "failed",
      message: "Server error",
    });
  }
};


// send otp handler
const SendOtpVerification = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number required" });
    }
    // 🔍 STEP 1: Check phone in DB
    const user = await UserAuthModal.findOne({ phoneNumber });
    if(!user){
      return res.status(404).json({ message:`${phoneNumber} not found`})
    }
    // 🔐 STEP 2: Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 💾 STEP 3: Save OTP
    await UserAuthModal.findOneAndUpdate(
      { phoneNumber },
      { otp, expiresAt }
    );

    console.log(`OTP for ${phoneNumber}: ${otp}`);

    // 📤 STEP 4: Response
    return res.status(200).json({
      message: "OTP sent successfully" ,
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
    const { phoneNumber, otp } = req.body;

    const user = await UserAuthModal.findOne({ phoneNumber });
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
    const { phoneNumber } = req.body;

    const user = await UserAuthModal.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.expiresAt = Date.now() + 5 * 60 * 1000;
    await user.save();

    console.log(`Resent OTP ${otp} to ${phoneNumber}`);

    res.status(200).json({ message: "OTP resent successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const logoutUser = async (req, res) => {
  try {
    const { id } = req.params;
    res.status(200).json({
      message: `User with ID ${id} logged out successfully`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// const getPhoneNumber = async (req, res) => {
//   try {
//     // Check if user exists
//     const phoneNumber = req.body.phoneNumber;
//     const user = await UserAuthModal.findOne({ phoneNumber });
//     if (user) {
//       // User exists → Go to login page
//       return res.status(200).json({
//         status: "EXISTS",
//         message: "User found. Redirect to login.",
//         user,
//       });
//     } else {
//       // User does NOT exist → Go to signup page
//       return res.status(200).json({
//         status: "NOT_EXISTS",
//         message: "User not found. Redirect to signup.",
//       });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// forget password handler
const forgetPassword = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    // 1. Check if user exists
    const user = await UserAuthModal.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }
    // 2. Generate Password Reset OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // 3. Save OTP to user record
    user.otp = otp;
    user.otpExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    // 4. Send OTP SMS using Fast2SMS DLT
    // await sendDLTSms({
    //   templateId: process.env.DLT_TEMPLATE_ID_FORGOT,
    //   variables: otp,
    //   numbers: phoneNumber,
    // });
    console.log(`forgetotp to send ${phoneNumber} : ${otp}`)
    const token = jwt.sign({userId:user._id},process.env.JWT_SECRET);
    // console.log(token)
    user.verifytoken=token;
    await user.save();
    // 4. Send OTP SMS using Twilio
    await sendMsg91Sms({
      mobiles: `+91${phoneNumber}`, // only digits, no +91 required
      message: `Your password reset OTP is: ${otp}`,
      token
    });
    return res.status(200).json({
      status: "success",
      message: "we sent to verification code", user,
      verifytoken:token
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
      state:{ data},
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

  const { phoneNumber, otp } = req.body;

  const record = await UserAuthModal.findOne({ phoneNumber }).sort({ createdAt: -1 });

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
      phoneNumber: verify.phoneNumber,
      id: oldUser._id,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "Something Went Wrong" });
  }
};

const PhoneNumbercrete = async (req, res) => {
   const { phoneNumber } = req?.body;
  try {
    // console.log("phoneNumber:", phoneNumber);
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number required" });
    }
    // 🔍 STEP 1: Check phone in DB
    const user = await UserAuthModal.findOne({ phoneNumber });

    if (user) {
      return res.status(400).json({ message: "Phone number already exists" , type:"login" });
    }


    // 🔍 STEP 2: Create new user
    const newUser = await UserAuthModal.create({ phoneNumber });
    const Otp = Math.floor(100000 + Math.random() * 900000).toString();
    newUser.otp = Otp;
    await newUser.save();

    console.log(`OTP for ${phoneNumber}: ${Otp}`);

    return res.status(201).json({
      status: "success",
      message: "Phone number created successfully",
      data: newUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "Something Went Wrong" });
  }
};


const verifyphoneotp = async (req,res) =>{
  try {
    const {phoneNumber, otp} = req.body;
    const record = await UserAuthModal.findOne({phoneNumber});
    if(record.otp !== otp){
      return res.status(400).json({message:`${otp} is invalid`});
    }
    if(Date.now() > record.otpExpiry){
      return res.status(400).json({message:"OTP expired"});
    }
    record.otp = undefined;
    record.otpExpiry = undefined;
    await record.save();
    return res.status(200).json({message:"phone otp is verified successfully"});
  } catch (error) {
    return res.status(500).json({message:"Server error"})
  }
}
module.exports = {
  RegisterUser,
  LoginUser,
  handleOtpVerification,
  SendOtpVerification,
  ReSendOtpVerification,
  logoutUser,
  PhoneNumbercrete,
  forgetPassword,
  resetPassword,
  verifyforgetpwd,
  verifylogin,
  getStatesRead,
  verifyphoneotp
}