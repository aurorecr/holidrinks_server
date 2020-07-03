const express = require('express');
const { check } = require('express-validator');

const eventsControllers = require('../controllers/events-controllers');

const router = express.Router();

router.get('/:pid', eventsControllers.getEventById);

router.get('/user/:uid', eventsControllers.getEventsByUserId);

router.post(
  '/',
  [
    check('title')
      .not()
      .isEmpty(),
    check('description').isLength({ min: 5 }),
    check('address')
      .not()
      .isEmpty()
  ],
  eventsControllers.createEvent
);

router.patch(
  '/:pid',
  [
    check('title')
      .not()
      .isEmpty(),
    check('description').isLength({ min: 5 })
  ],
  eventsControllers.updateEvent
);

router.delete('/:pid', eventsControllers.deleteEvent);

module.exports = router;
