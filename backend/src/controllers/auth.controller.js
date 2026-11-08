const bcrypt = require('bcrypt');
const User = require('../models/User');
const { generateToken } = require('../utils/token');
const { logger, requestMeta } = require('../utils/logger');

// account lockout: N consecutive wrong passwords lock that account for M minutes,
// even when the attempts come from many different IPs (which the IP rate limiter misses)
const LOCKOUT_THRESHOLD = Number(process.env.LOCKOUT_THRESHOLD) || 5;
const LOCKOUT_MINUTES = Number(process.env.LOCKOUT_MINUTES) || 15;

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      logger.warn('auth.register_failed', { ...requestMeta(req), email, reason: 'duplicate_email' });
      return res.status(400).json({ message: 'Registration failed' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role === 'freelancer' ? 'freelancer' : 'client',
    });

    logger.info('auth.register_success', { ...requestMeta(req), userId: user._id.toString(), role: user.role });
    return res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn('auth.login_failed', { ...requestMeta(req), email, reason: 'unknown_email' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // locked accounts are refused before the password is checked, so even the
    // right password does not work until the lock expires. 429 + the same message
    // as the rate limiter, so the response does not reveal that the account exists.
    if (user.lockUntil && user.lockUntil > Date.now()) {
      logger.warn('auth.login_blocked_locked', { ...requestMeta(req), email, userId: user._id.toString() });
      return res.status(429).json({ message: 'Too many requests, please try again later' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      if (attempts >= LOCKOUT_THRESHOLD) {
        user.failedLoginAttempts = 0;
        user.lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        logger.warn('auth.account_locked', {
          ...requestMeta(req), email, userId: user._id.toString(), minutes: LOCKOUT_MINUTES,
        });
      } else {
        user.failedLoginAttempts = attempts;
      }
      await user.save();
      logger.warn('auth.login_failed', { ...requestMeta(req), email, reason: 'wrong_password', attempts });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.failedLoginAttempts || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    const token = generateToken(user);

    logger.info('auth.login_success', { ...requestMeta(req), userId: user._id.toString(), role: user.role });
    return res.status(200).json({ token });
  } catch (err) {
    next(err);
  }
};

// server-side logout: bumping tokenVersion makes every token issued so far invalid
const logout = async (req, res, next) => {
  try {
    await User.updateOne({ _id: req.user.id }, { $inc: { tokenVersion: 1 } });
    logger.info('auth.logout', requestMeta(req));
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-passwordHash -failedLoginAttempts -lockUntil -tokenVersion');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, getMe };
