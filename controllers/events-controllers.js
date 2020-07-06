// const uuid = require('uuid/v1');
const { v1: uuidv1 } = require('uuid');
//uuid package allow to create id
const { validationResult } = require('express-validator');

const mongoose = require('mongoose');
const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Event = require('../models/event');
const User = require('../models/user');
const mongooseUniqueValidator = require('mongoose-unique-validator');

const getEventById = async (req, res, next) => {
  const eventId = req.params.pid; 

  let event;
  try {
    event = await (await Event.findById(eventId)).populated(creator);
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

  res.json({ event: event.toObject({ getters: true }) }); // => { event } => { event: event }
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

  if (!userWithEvents || userWithEvents.events.length === 0) {
    return next(
      new HttpError('Could not find Holidrinks for the provided user id.', 404)
    );
  }

  res.json({ events: userWithEvents.map(event => event.toObject({ getters: true })) });
};

const createEvent = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { title, description, address, creator } = req.body;

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
    image:
      'https://bit.ly/3ikLMau',
    creator
  });

  let user;

  try {
    const sess = await  mongooseUniqueValidator.startSession();
    //this is the current session that start when we went to create this new event
    // using await because it s an asynchronous task
    sess.startTransaction();
    await createdEvent.save({session:sess});
    user.events.push(createdEvent);
    await user.save({session :sess});
    await sess.commitTransaction();
  } catch (err){
    const error = new HttpError(
      'Creating Holidrinks failed,should you try again?',
      500
    );
    return next(error);
  }

  console.log(user);

  if (!user){
    const error = new  HttpError('Could not find user for provided id',404);
    return next (error)
  }

  try {
    await createdEvent.save();
  } catch (err) {
    const error = new HttpError(
      'Creating Holidrinks failed, please try again.',
      500
    );
    return next(error);
  }

  res.status(201).json({ event: createdEvent });
};

const updateEvent = async (req, res, next) => {
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
      'Something went wrong, could not update this Holidrink.',
      500
    );
    return next(error);
  }

  event.title = title;
  event.description = description;

  try {
    await event.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update this holidrink.',
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
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await event.remove({session: sess});
    event.creator.events.pull(event);
    await event.creator.save({session: sess});
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete this Holidrink.',
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      'Could not find place for the provided id.',
      404
    );
    return next(error);
  }

  try {
    await event.remove();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete this Holidrink.',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'Deleted Holidrink.' });
};

exports.getEventById = getEventById;
exports.getEventsByUserId = getEventsByUserId;
exports.createEvent = createEvent;
exports.updateEvent = updateEvent;
exports.deleteEvent = deleteEvent;
