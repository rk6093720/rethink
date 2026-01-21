const mongoose = require("mongoose");
const tokenSchema = new mongoose.Schema({
  token: {type :String},
  expiresAt: {type:Date}
});

const tokenModal = mongoose.model("TokenBlacklist", tokenSchema);
module.exports={
    tokenModal
}