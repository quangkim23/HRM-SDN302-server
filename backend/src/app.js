const express = require("express");
const morgan = require("morgan");
const { default: helmet } = require("helmet");
const compression = require("compression");
const connections = require("./helpers/check.connect");
const cookieParser = require('cookie-parser');
const { default: mongoose } = require("mongoose");
const { createDailyAttendanceRecords } = require("./jobs/cron-job-service");
const cors = require('cors');

const app = express();

connections();

// init middlewares
app.use(morgan("dev")); // hien thi mau sac cho status
app.use(helmet()); // ngan chan tan cong
app.use(compression()); // giam thieu dung luong payload
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());
app.use(cors());

// init database

require("./databases/init.mongodb");

// start corn

mongoose.connection.once('open', () => {
  createDailyAttendanceRecords.start();
})

// init routes

app.use("/", require("./routes/index-route"));

// handling error

app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404
  next(error)
});

app.use((error, req, res, next) => {
    const statusCode = error.status || 500
    return res.status(statusCode).json({
        status: 'error',
        code: statusCode,
        errorMessage: error.message || 'Internal Server Error',
        errorType: error.type || 'InternalServerError'
    })
  });

module.exports = app;
