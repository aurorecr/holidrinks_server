const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fs = require('fs');
//allow to interact with files and delete them
const path = require('path');

const eventsRoutes = require('./routes/events-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();

app.use(bodyParser.json());
app.use('/uploads/images', express.static(path.join('uploads', 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');

  next();
});

app.use('/api/events', eventsRoutes); // => /api/events...
app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
  //Express will apply his is a middleware function on every incoming request

  const error = new HttpError('Could not find this route.', 404);
  throw error;
});

app.use((error, req, res, next) => {
  if(req.file){
 fs.unlink(req.file.path, (err) => {
   console.log(err);
 });
  }
  if (res.headerSent) {
    return next(error);
    // this middleware is only reached if we have some request which didn't get a response before and that can only be a request which we don't want to handle
  }
  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occurred!' });
});

mongoose
  .connect('mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0-danc1.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority')
  .then(() => {
    console.log('DB Connected')
    app.listen(5000);
  })
  .catch(err => {
    console.log(err);
  });

