const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');

// Database connection
const db = require('./API/models/vehicleconnection_db');
db.connectDatabase();

// Router
const vehicleRouter = require('./API/routers/vehicle_router');
const userRouter = require('./API/routers/user_router');
const discRouter = require('./API/routers/discount_router');
const rentalRouter = require('./API/routers/rentals_router')

// Middleware: morgan, bodyParser
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Middleware: CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', '*');
    return res.status(200).json({});
  }
  next();
});

// Module endpoints + routers
app.use('/vehicles', vehicleRouter);
app.use('/users', userRouter);
app.use('/discounts', discRouter);
app.use('/rentals',rentalRouter)

// Error middleware
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

module.exports = app;
