const axios = require("axios");

const sendDLTSms = async ({ templateId, variables, numbers }) => {
  try {
    const response = await axios.get("https://www.fast2sms.com/dev/bulkV2", {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        route: "template",
        sender_id: process.env.DLT_SENDER_ID,
        message: templateId,
        variables_values: variables,
        numbers,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Fast2SMS Error:", error.response?.data || error.message);
    throw new Error("Failed to send SMS");
  }
};

module.exports = sendDLTSms;
