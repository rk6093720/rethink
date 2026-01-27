const jwt = require("jsonwebtoken");
const { UserAuthModal } = require("../modals/user.modals");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "NO_TOKEN",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "INVALID_TOKEN",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ token valid
   req.userId = decoded.userId;
    req.exp = decoded.exp;
    req.token = token;
    next();

  } catch (error) {

    // 🔥 TOKEN EXPIRED
    if (error.name === "TokenExpiredError") {

      // ⛔ Decode without verify to get userId
      const decoded = jwt.decode(req.headers.authorization?.split(" ")[1]);

      if (decoded?.userId) {
        await UserAuthModal.findByIdAndUpdate(decoded.userId, {
          isloginwithEmail: false,
          verifytoken: null
        });
      }

      return res.status(401).json({
        success: false,
        message: "TOKEN_EXPIRED",
        verifytoken: null,
        isloginwithEmail: false
      });
    }

    return res.status(401).json({
      success: false,
      message: "INVALID_TOKEN",
      verifytoken: null,
      isloginwithEmail: false
    });
  }
};

module.exports = { auth };

