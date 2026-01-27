const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const {connection} = require('./config/db');
const {userRouter} = require('./router/user.router');
const app = express();
require('dotenv').config();
require("./config/passport")
const port = process.env.PORT || 3000;
// Import and use user router
app.use(express.json());
// app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    httpOnly: true
  }
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use('/uploads', express.static("uploads/"));
app.use('/users/Auth', userRouter);
app.get('/', (req, res) => {
  res.send('Welcome to Hyredin');
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
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