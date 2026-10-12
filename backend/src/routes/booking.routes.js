const express = require('express');
const { body } = require('express-validator');

const {
  createBooking,
  getMyBookings,
  getFreelancerBookings,
} = require('../controllers/booking.controller');
const validate = require('../middleware/validate.middleware');
const protect = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const { bookingLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.post(
  '/',
  bookingLimiter,
  protect,
  authorize('client'),
  [body('gigId').isMongoId().withMessage('Valid gig id required')],
  validate,
  createBooking
);

router.get('/mine', protect, authorize('client'), getMyBookings);
router.get('/freelancer', protect, authorize('freelancer'), getFreelancerBookings);

module.exports = router;