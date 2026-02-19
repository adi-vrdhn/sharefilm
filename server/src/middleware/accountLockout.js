/**
 * Account Lockout Security
 * Prevents brute force attacks by locking accounts after failed attempts
 */

const loginAttempts = new Map();

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Record a failed login attempt
 */
const recordFailedAttempt = (email) => {
  const now = Date.now();
  const record = loginAttempts.get(email) || { attempts: 0, lockedUntil: null };
  
  // Check if account is currently locked
  if (record.lockedUntil && record.lockedUntil > now) {
    return {
      isLocked: true,
      remainingTime: Math.ceil((record.lockedUntil - now) / 1000 / 60) // minutes
    };
  }
  
  // Reset if lockout period has expired
  if (record.lockedUntil && record.lockedUntil <= now) {
    record.attempts = 0;
    record.lockedUntil = null;
  }
  
  // Increment attempts
  record.attempts += 1;
  
  // Lock account if max attempts exceeded
  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_TIME;
    loginAttempts.set(email, record);
    
    return {
      isLocked: true,
      remainingTime: 15 // minutes
    };
  }
  
  loginAttempts.set(email, record);
  return {
    isLocked: false,
    attemptsRemaining: MAX_ATTEMPTS - record.attempts
  };
};

/**
 * Check if account is locked
 */
const isAccountLocked = (email) => {
  const now = Date.now();
  const record = loginAttempts.get(email);
  
  if (!record) {
    return { locked: false };
  }
  
  if (record.lockedUntil && record.lockedUntil > now) {
    return {
      locked: true,
      remainingTime: Math.ceil((record.lockedUntil - now) / 1000 / 60) // minutes
    };
  }
  
  // Clear old lockouts
  if (record.lockedUntil && record.lockedUntil <= now) {
    loginAttempts.delete(email);
  }
  
  return { locked: false };
};

/**
 * Clear login attempts for successful login
 */
const clearLoginAttempts = (email) => {
  loginAttempts.delete(email);
};

/**
 * Get login attempt info (for debugging)
 */
const getLoginAttemptsInfo = (email) => {
  const record = loginAttempts.get(email);
  if (!record) {
    return null;
  }
  
  return {
    attempts: record.attempts,
    isLocked: record.lockedUntil && record.lockedUntil > Date.now(),
    lockedUntil: record.lockedUntil
  };
};

module.exports = {
  recordFailedAttempt,
  isAccountLocked,
  clearLoginAttempts,
  getLoginAttemptsInfo,
  MAX_ATTEMPTS,
  LOCKOUT_TIME
};
