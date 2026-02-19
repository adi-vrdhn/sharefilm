/**
 * Input Sanitization Middleware
 * Sanitizes user input to prevent XSS and injection attacks
 */

// Simple sanitization functions
const sanitizeString = (str) => {
  if (typeof str !== "string") return str;
  
  return str
    .replace(/[<>]/g, "") // Remove < and >
    .trim()
    .substring(0, 1000); // Limit length
};

const sanitizeEmail = (email) => {
  if (typeof email !== "string") return email;
  
  // Simple email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return null;
  }
  
  return email.toLowerCase().trim();
};

const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return sanitizeString(obj);
  
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === "string") {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === "object") {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
};

/**
 * Middleware to sanitize request body and query
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitize params
  if (req.params && typeof req.params === "object") {
    for (const key in req.params) {
      if (typeof req.params[key] === "string") {
        req.params[key] = sanitizeString(req.params[key]);
      }
    }
  }
  
  next();
};

module.exports = {
  sanitizeString,
  sanitizeEmail,
  sanitizeObject,
  sanitizeInput
};
