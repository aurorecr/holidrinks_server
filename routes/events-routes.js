const express = require('express');
const { check } = require('express-validator');

const eventsControllers = require('../controllers/events-controllers');
const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.get('/:pid', eventsControllers.getEventById);

router.get('/user/:uid', eventsControllers.getEventsByUserId);

router.use(checkAuth);

router.post(
  '/',
  fileUpload.single('image'),
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
