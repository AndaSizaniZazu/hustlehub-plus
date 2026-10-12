const express = require('express');

const { getMyTransactions, getIncome } = require('../controllers/transaction.controller');
const protect = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

const router = express.Router();

router.get('/mine', protect, authorize('client', 'freelancer'), getMyTransactions);
router.get('/income', protect, authorize('freelancer'), getIncome);

module.exports = router;