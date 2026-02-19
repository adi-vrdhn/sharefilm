/**
 * Audit Logging
 * Logs security-related events for monitoring and detection
 */

const fs = require("fs");
const path = require("path");

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const LOG_LEVELS = {
  INFO: "INFO",
  WARNING: "WARNING",
  ERROR: "ERROR",
  SECURITY: "SECURITY"
};

/**
 * Log an audit event
 */
const log = (level, eventType, details) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    eventType,
    details,
    userId: details.userId || null,
    ipAddress: details.ipAddress || "unknown"
  };

  // Console log for development
  if (process.env.NODE_ENV !== "production") {
    console.log(`[${level}] ${eventType}:`, details);
  }

  // File logging in production
  if (process.env.NODE_ENV === "production") {
    const logFile = path.join(logsDir, `audit-${new Date().toISOString().split("T")[0]}.log`);
    fs.appendFileSync(
      logFile,
      JSON.stringify(logEntry) + "\n",
      { flag: "a" }
    );
  }

  return logEntry;
};

/**
 * Log a failed login attempt
 */
const logFailedLogin = (email, ipAddress, reason = "Invalid credentials") => {
  return log(LOG_LEVELS.SECURITY, "FAILED_LOGIN", {
    email,
    ipAddress,
    reason,
    timestamp: Date.now()
  });
};

/**
 * Log a successful login
 */
const logSuccessfulLogin = (userId, email, ipAddress) => {
  return log(LOG_LEVELS.INFO, "SUCCESSFUL_LOGIN", {
    userId,
    email,
    ipAddress,
    timestamp: Date.now()
  });
};

/**
 * Log an account lockout
 */
const logAccountLockout = (email, ipAddress) => {
  return log(LOG_LEVELS.SECURITY, "ACCOUNT_LOCKOUT", {
    email,
    ipAddress,
    reason: "Too many failed login attempts",
    timestamp: Date.now()
  });
};

/**
 * Log a suspicious activity
 */
const logSuspiciousActivity = (userId, activityType, details, ipAddress) => {
  return log(LOG_LEVELS.WARNING, "SUSPICIOUS_ACTIVITY", {
    userId,
    activityType,
    details,
    ipAddress,
    timestamp: Date.now()
  });
};

/**
 * Log a security error
 */
const logSecurityError = (errorType, details, userId = null) => {
  return log(LOG_LEVELS.ERROR, errorType, {
    userId,
    details,
    timestamp: Date.now()
  });
};

/**
 * Log unauthorized access attempt
 */
const logUnauthorizedAccess = (userId, resource, ipAddress) => {
  return log(LOG_LEVELS.SECURITY, "UNAUTHORIZED_ACCESS", {
    userId,
    resource,
    ipAddress,
    timestamp: Date.now()
  });
};

module.exports = {
  LOG_LEVELS,
  log,
  logFailedLogin,
  logSuccessfulLogin,
  logAccountLockout,
  logSuspiciousActivity,
  logSecurityError,
  logUnauthorizedAccess
};
