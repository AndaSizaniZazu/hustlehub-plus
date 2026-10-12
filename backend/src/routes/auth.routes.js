const express = require('express');
const { body } = require('express-validator');

const { register, login, getMe } = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const protect = require('../middleware/auth.middleware');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.post(
  '/register',
   registerLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required').escape(),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
       body('role')
      .optional()
      .isIn(['client', 'freelancer'])
      .withMessage('Role must be client or freelancer'),
  ],
  validate,
  register
);

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);


router.get('/me', protect, getMe);

module.exports = router;