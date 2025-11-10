/**
 * Production Logger - Minimal logging for production builds
 */
export class Logger {
  static isDevelopment = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.search.includes('debug=true')
  );

  static log(...args) {
    if (this.isDevelopment) {
      console.log(...args);
    }
  }

  static warn(...args) {
    if (this.isDevelopment) {
      console.warn(...args);
    }
  }

  static error(...args) {
    // Always log errors, even in production
    console.error(...args);
  }

  static info(...args) {
    if (this.isDevelopment) {
      console.info(...args);
    }
  }

  static debug(...args) {
    if (this.isDevelopment && typeof window !== 'undefined' && window.location.search.includes('verbose=true')) {
      console.debug(...args);
    }
  }
} 