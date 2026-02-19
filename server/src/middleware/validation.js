const { body, param, query, validationResult } = require("express-validator");

/**
 * Request validation middleware
 * Validates and sanitizes user input
 */

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validators
const signupValidator = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2-50 characters")
    .matches(/^[a-zA-Z0-9\s_-]+$/).withMessage("Name can only contain letters, numbers, spaces, underscores, and hyphens"),
  
  body("email")
    .trim()
    .normalizeEmail()
    .isEmail().withMessage("Valid email is required")
    .isLength({ max: 255 }).withMessage("Email is too long"),
  
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Password must contain an uppercase letter")
    .matches(/[a-z]/).withMessage("Password must contain a lowercase letter")
    .matches(/[0-9]/).withMessage("Password must contain a number")
    .matches(/[!@#$%^&*]/).withMessage("Password must contain a special character (!@#$%^&*)")
];

const loginValidator = [
  body("email")
    .trim()
    .normalizeEmail()
    .isEmail().withMessage("Valid email is required"),
  
  body("password")
    .notEmpty().withMessage("Password is required")
];

// Movie search validator
const movieSearchValidator = [
  query("query")
    .trim()
    .notEmpty().withMessage("Search query is required")
    .isLength({ min: 2, max: 100 }).withMessage("Query must be 2-100 characters")
];

// Movie ID validator
const movieIdValidator = (paramName = "id") => [
  param(paramName)
    .notEmpty().withMessage(`${paramName} is required`)
    .isInt({ min: 1 }).withMessage(`${paramName} must be a positive integer`)
];

// Array validator for movie IDs
const movieIdsValidator = [
  body("movieIds")
    .isArray({ min: 1 }).withMessage("movieIds must be a non-empty array")
    .custom(value => {
      if (!value.every(id => Number.isInteger(id) && id > 0)) {
        throw new Error("All movie IDs must be positive integers");
      }
      return true;
    })
];

module.exports = {
  handleValidationErrors,
  signupValidator,
  loginValidator,
  movieSearchValidator,
  movieIdValidator,
  movieIdsValidator
};
