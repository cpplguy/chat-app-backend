const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require("cors");
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const teapot = require("./routes/teapot")
const rateLimit = require("express-rate-limit");
const DBConnect = require("./database/db");
const authRouter = require("./routes/auth");
const app = express();
const limit = rateLimit({
  windowMs: 10 * 1000,
  max: 3,
  handler: (req, res, next) => {
    res.status(429).json({error: "Too many requests. Take a quick 10 second break!"})
  }
})
app.use(cors({origin: process.env.FRONTEND_URL, credentials: true }))
app.use(cookieParser());
app.use(express.json());
//Database and such

DBConnect().then(() => {
  app.use("/users", limit);
})

// end Database


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', indexRouter);
app.use("/secret", teapot)
app.use('/api/users', usersRouter);
app.use("/api/auth", authRouter)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) =>{
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
