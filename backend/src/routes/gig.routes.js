const express = require('express');
const { body, param } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

const {
  listGigs,
  getGig,
  getMyGigs,
  createGig,
  updateGig,
  deleteGig,
} = require('../controllers/gig.controller');
const validate = require('../middleware/validate.middleware');
const protect = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

const router = express.Router();

// strip all HTML tags to neutralise script injection
const stripTags = (value) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });

const gigRules = [
  body('title')
    .isString().withMessage('Title must be text').bail()
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title must be at most 100 characters')
    .customSanitizer(stripTags),
  body('description')
    .isString().withMessage('Description must be text').bail()
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description must be at most 2000 characters')
    .customSanitizer(stripTags),
  body('category')
    .isString().withMessage('Category must be text').bail()
    .trim()
    .notEmpty().withMessage('Category is required')
    .isLength({ max: 50 }).withMessage('Category must be at most 50 characters')
    .customSanitizer(stripTags),
  body('price')
    .isFloat({ min: 1, max: 100000 }).withMessage('Price must be between 1 and 100000')
    .toFloat(),
];

const idRule = [param('id').isMongoId().withMessage('Invalid id')];

router.get('/', listGigs);
router.get('/mine', protect, authorize('freelancer'), getMyGigs); // must sit above /:id
router.get('/:id', idRule, validate, getGig);
router.post('/', protect, authorize('freelancer'), gigRules, validate, createGig);
router.put('/:id', protect, authorize('freelancer'), idRule, gigRules, validate, updateGig);
router.delete('/:id', protect, authorize('freelancer'), idRule, validate, deleteGig);

module.exports = router;