const fs = require('fs');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Event = require('../models/event');
const User = require('../models/user');

const getEventById = async (req, res, next) => {
  const eventId = req.params.pid; 

  let event;
  try {
    event = await Event.findById(eventId);
    //populated allows  to refer to a document stored in another collection in MongoDB and to work with data in that existing document of that other collection to do so
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find an Holidrink.',
      500
    );
    return next(error);
  }

  if (!event) {
    const error = new HttpError(
      'Could not find a Holidrink for the provided id.',
      404
    );
    return next(error);
  }

  res.json({ event: event.toObject({ getters: true }) }); 
};


const getEventsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithEvents;
  try {
    userWithEvents = await User.findById(userId).populate('events');

  } catch (err) {
    const error = new HttpError(
      'Fetching Holidrinks failed, please try again later',
      500
    );
    return next(error);
  }

  if (!userWithEvents || userWithEvents.events.length === 0){ 
    return next(
      new HttpError('Could not find Holidrinks for the provided user id.', 404)
    );
  }

  res.json({ events: userWithEvents.events.map(event => event.toObject({ getters: true })) });
};

const createEvent = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { title, description, address } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  // const title = req.body.title;
  const createdEvent = new Event({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator: req.userData.userId
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Creating event failed, please try again.',
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError('Could not find user for provided id.', 404);
    return next(error);
  }

  console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdEvent.save({ session: sess }); 
    user.events.push(createdEvent); 
    await user.save({ session: sess }); 
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Creating holidrink failed, please try again.',
      500
    );
    return next(error);
  }

  res.status(201).json({ event: createdEvent });
};

const updateEvent= async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { title, description } = req.body;
  const eventId = req.params.pid;

  let event;
  try {
    event = await Event.findById(eventId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update Holidrink.',
      500
    );
    return next(error);
  }

  if (event.creator.toString() !== req.userData.userId){
    const error = new HttpError(
      'Sorry, you are not allowed to edit this Holidrink',
      401
      );
      return next(error);
  }

  event.title = title;
  event.description = description;

  try {
    await event.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update Holidrink.',
      500
    );
    return next(error);
  }

  res.status(200).json({ event: event.toObject({ getters: true }) });
};

const deleteEvent = async (req, res, next) => {
  const eventId = req.params.pid;

  let event;
  try {
    event = await Event.findById(eventId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete Holidrink.',
      500
    );
    return next(error);
  }

  if (!event) {
    const error = new HttpError('Could not find Holidrink for this id.', 404);
    return next(error);
  }
  
   if(event.creator.id !==req.userData.userId){
    const error = new HttpError(
      'Sorry, you are not allowed to delete this Holidrink',
      401
      );
      return next(error);
  }
  

  const imagePath = event.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await event.remove({session: sess});
    event.creator.events.pull(event);
    await event.creator.save({session: sess});
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete holidrink.',
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, err => {
    console.log(err);
  });

  res.status(200).json({ message: 'Deleted Holidrink.' });
};

exports.getEventById = getEventById;
exports.getEventsByUserId = getEventsByUserId;
exports.createEvent = createEvent;
exports.updateEvent = updateEvent;
exports.deleteEvent = deleteEvent;
