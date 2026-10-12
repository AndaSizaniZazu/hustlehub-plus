const crypto = require('crypto');
const mongoose = require('mongoose');
const Gig = require('../models/Gig');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const createBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const gig = await Gig.findById(req.body.gigId);
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }
    if (gig.freelancer.equals(req.user.id)) {
      return res.status(400).json({ message: 'You cannot book your own gig' });
    }

    let booking;
    let transaction;

    // booking, transaction and income update succeed together or not at all
    await session.withTransaction(async () => {
      [booking] = await Booking.create(
        [
          {
            gig: gig._id,
            client: req.user.id,
            freelancer: gig.freelancer,
            priceAtBooking: gig.price,
            status: 'confirmed', // simulated payment confirmation
          },
        ],
        { session }
      );

      [transaction] = await Transaction.create(
        [
          {
            booking: booking._id,
            client: req.user.id,
            freelancer: gig.freelancer,
            amount: gig.price,
            reference: `TXN-${crypto.randomUUID()}`,
          },
        ],
        { session }
      );

      await User.updateOne(
        { _id: gig.freelancer },
        { $inc: { totalIncome: gig.price } },
        { session }
      );
    });

    return res.status(201).json({ booking, transaction });
  } catch (err) {
    next(err);
  } finally {
    await session.endSession();
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ client: req.user.id })
      .populate('gig', 'title price')
      .populate('freelancer', 'name')
      .sort('-createdAt');
    return res.status(200).json(bookings);
  } catch (err) {
    next(err);
  }
};

const getFreelancerBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ freelancer: req.user.id })
      .populate('gig', 'title price')
      .populate('client', 'name')
      .sort('-createdAt');
    return res.status(200).json(bookings);
  } catch (err) {
    next(err);
  }
};

module.exports = { createBooking, getMyBookings, getFreelancerBookings };