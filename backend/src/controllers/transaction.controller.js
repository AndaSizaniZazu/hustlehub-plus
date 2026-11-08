const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { estimateTax } = require('../config/tax');

const getMyTransactions = async (req, res, next) => {
  try {
    // users only ever see transactions they are part of
    const filter = req.user.role === 'freelancer'
      ? { freelancer: req.user.id }
      : { client: req.user.id };

    const transactions = await Transaction.find(filter)
      .populate({
        path: 'booking',
        select: 'gig',
        populate: { path: 'gig', select: 'title' },
      })
      .sort('-createdAt');
    return res.status(200).json(transactions);
  } catch (err) {
    next(err);
  }
};

const getIncome = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('totalIncome');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const bookings = await Transaction.countDocuments({ freelancer: req.user.id });
    const tax = estimateTax(user.totalIncome);
    return res.status(200).json({ totalIncome: user.totalIncome, bookings, ...tax });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyTransactions, getIncome };