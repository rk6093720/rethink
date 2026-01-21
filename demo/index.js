const express = require('express');
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const cors = require('cors');
const {connection} = require('./config/db');
const {userRouter} = require('./router/user.router');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;
// Import and use user router
app.use(express.json());
// app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static("uploads/"));
app.use('/users/Auth', userRouter);
app.get('/', (req, res) => {
  res.send('Welcome to Hyredin');
});
app.listen(port,'0.0.0.0', async() => {
    try {
      // console.log("connect", connection);
        await connection;
        console.log("Connected to DB");
    } catch (error) {
        console.log("Error connecting to DB", error);
    }
  console.log(`Example app listening at http://localhost:${port}`);
})