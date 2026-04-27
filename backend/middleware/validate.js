// Location: D:\ConcertHub\backend\middleware\validate.js

const { validationResult } = require('express-validator');

// Run after express-validator rules — returns 400 if any fail
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = validate;