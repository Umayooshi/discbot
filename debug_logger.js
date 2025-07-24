const fs = require('fs');
const path = require('path');

class DebugLogger {
  constructor() {
    this.logLevels = {
      INFO: { color: '\x1b[36m', prefix: 'ℹ️' },      // Cyan
      SUCCESS: { color: '\x1b[32m', prefix: '✅' },   // Green
      WARNING: { color: '\x1b[33m', prefix: '⚠️' },   // Yellow
      ERROR: { color: '\x1b[31m', prefix: '❌' },     // Red
      CRITICAL: { color: '\x1b[35m', prefix: '🔥' },  // Magenta
      API: { color: '\x1b[34m', prefix: '🌐' },       // Blue
      DB: { color: '\x1b[90m', prefix: '💾' },        // Gray
      PERF: { color: '\x1b[95m', prefix: '⚡' }       // Bright Magenta
    };
    this.reset = '\x1b[0m';
    this.performanceTimers = new Map();
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const levelInfo = this.logLevels[level] || this.logLevels.INFO;
    
    let formattedMessage = `${levelInfo.color}${levelInfo.prefix} [${level}] ${timestamp}${this.reset} ${message}`;
    
    if (data) {
      formattedMessage += `\n${JSON.stringify(data, null, 2)}`;
    }
    
    console.log(formattedMessage);
  }

  info(message, data) { this.log('INFO', message, data); }
  success(message, data) { this.log('SUCCESS', message, data); }
  warning(message, data) { this.log('WARNING', message, data); }
  error(message, data) { this.log('ERROR', message, data); }
  critical(message, data) { this.log('CRITICAL', message, data); }
  api(message, data) { this.log('API', message, data); }
  db(message, data) { this.log('DB', message, data); }

  // Performance monitoring
  startTimer(name) {
    this.performanceTimers.set(name, Date.now());
    this.log('PERF', `Started timer: ${name}`);
  }

  endTimer(name) {
    const startTime = this.performanceTimers.get(name);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.performanceTimers.delete(name);
      this.log('PERF', `${name} completed in ${duration}ms`);
      return duration;
    }
    this.warning(`Timer '${name}' not found`);
    return null;
  }

  // API call monitoring
  logApiCall(method, url, statusCode, responseTime, data = null) {
    const status = statusCode >= 200 && statusCode < 300 ? 'SUCCESS' : 'ERROR';
    const message = `${method} ${url} - ${statusCode} (${responseTime}ms)`;
    this.log('API', message, data);
  }

  // Database operation monitoring
  logDbOperation(operation, collection, duration, result = null) {
    const message = `${operation} on ${collection} - ${duration}ms`;
    this.log('DB', message, result);
  }

  // Error tracking with stack traces
  logError(error, context = '') {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString()
    };
    this.log('ERROR', `Error in ${context}`, errorData);
  }

  // Critical system errors
  logCritical(error, context = '') {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString(),
      severity: 'CRITICAL'
    };
    this.log('CRITICAL', `CRITICAL ERROR in ${context}`, errorData);
  }
}

module.exports = new DebugLogger();