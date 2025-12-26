const mongoose = require('mongoose');
require('dotenv').config();

const connection = mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

module.exports = { connection };
