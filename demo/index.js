const express = require('express');
const bodyParser = require("body-parser");
// const admin = require("firebase-admin");
const cors = require('cors');
const {connection} = require('./config/db');
const {userRouter} = require('./router/user.router');
const { primeRouter } = require('./router/prime.router');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;
// const service = require("./firebase.json");
const { publicRouter } = require('./router/public.router');
// const { errorHandler } = require('./middleware/errorHandler');
// Import and use user router
app.use(express.json());
// app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
// admin.initializeApp({
//   credential:admin.credential.cert(service) 
// })
app.use(cors());
app.use('/uploads', express.static("uploads/"));
app.use('/users', userRouter);
app.use("/prime", primeRouter);
app.use("/public",publicRouter);

// // 404 handler
// app.use( (req,res , next)=>{
//    const error = new Error(`cannot find ${req.originalUrl} on this server!`);
//    error.statusCode = 404;
//    next(error);
// })
// // global error handler
// app.use(errorHandler);
app.get('/', (req, res) => {
  res.send('Powered by Sripuram');
});
app.listen(port,'0.0.0.0', async() => {
    try {
        await connection;
        console.log("Connected to DB");
    } catch (error) {
        console.log("Error connecting to DB", error);
    }
  console.log(`Example app listening at http://localhost:${port}`);
})