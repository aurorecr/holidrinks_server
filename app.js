const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const eventsRoutes = require('./routes/events-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();

app.use(bodyParser.json());

app.use('/api/events', eventsRoutes); // => /api/events...
app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
  //Express will apply his is a middleware function on every incoming request

  const error = new HttpError('Could not find this route.', 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
    // this middleware is only reached if we have some request which didn't get a response before and that can only be a request which we don't want to handle
  }
  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occurred!' });
});

mongoose
  .connect('mongodb+srv://aurorecr:aurorecr@cluster0-danc1.mongodb.net/events?retryWrites=true&w=majority')
  .then(() => {
    console.log('DB Connected')
    app.listen(5000);
  })
  .catch(err => {
    console.log(err);
  });
