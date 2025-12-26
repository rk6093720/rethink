const axios = require("axios");
const sendMsg91Sms = async ({ mobiles, message }) => {
  try {
    const url = "http://api.msg91.com/api/sendhttp.php";

    const params = {
      authkey: process.env.MSG91_AUTH_KEY,
      sender: process.env.MSG91_SENDER_ID,
      route: process.env.MSG91_ROUTE,
      country: "91",
      mobiles,
      message,
    };
  
    const response = await axios.get(url, { params });
    /// response is not giving
    return response.data;
  } catch (error) {
    console.error("MSG91 Error:", error.message);
    throw error;
  }
};

module.exports = { sendMsg91Sms };
