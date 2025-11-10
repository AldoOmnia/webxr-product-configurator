export class DeviceDetection {
  static isMobile() {
    // Improved mobile detection - check both screen size and user agent
    const mobileWidth = window.innerWidth <= 768;
    const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const touchDevice = 'ontouchstart' in window;

    return mobileWidth || mobileUserAgent || touchDevice;
  }

  static isTablet() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
  }

  static isDesktop() {
    return !this.isMobile() && !this.isTablet();
  }

  static isiOS() {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent) ||
      (platform === 'macintel' && navigator.maxTouchPoints > 1);
  }

  static isAndroid() {
    const userAgent = navigator.userAgent.toLowerCase();
    return /android/.test(userAgent) && !/chrome/.test(userAgent);
  }

  static getDeviceType() {
    if (this.isMobile()) return 'mobile';
    if (this.isTablet()) return 'tablet';
    return 'desktop';
  }

  static supportsAR() {
    // Check for HTTPS first (required for AR)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      return false;
    }

    // Check for WebXR support (modern AR)
    if ('xr' in navigator && 'requestSession' in navigator.xr) {
      return true;
    }

    // Check for iOS AR support (ARKit via Quick Look)
    if (this.isiOS()) {
      return this.hasARKit();
    }

    // Check for Android AR support (ARCore via Scene Viewer)
    if (this.isAndroid()) {
      return this.hasARCore();
    }

    return false;
  }

  static getIOSVersion() {
    if (!this.isiOS()) return 0;

    // Try different methods to get iOS version
    const userAgent = navigator.userAgent;

    // Method 1: OS version in user agent
    const match = userAgent.match(/OS (\d+)_/);
    if (match) return parseInt(match[1], 10);

    // Method 2: Check for specific features
    if (window.webkit && window.webkit.messageHandlers) return 12; // iOS 12+
    if (window.webkit && window.webkit.standalone) return 11; // iOS 11+

    // Method 3: Check for AR support
    if ('xr' in navigator) return 12; // iOS 12+ has WebXR

    return 0;
  }

  static getAndroidVersion() {
    if (!this.isAndroid()) return 0;

    const userAgent = navigator.userAgent;

    // Method 1: Android version in user agent
    const match = userAgent.match(/Android (\d+(\.\d+)?)/);
    if (match) return parseFloat(match[1]);

    // Method 2: Check for specific features
    if ('xr' in navigator) return 7.0; // Android 7.0+ has WebXR
    if (window.AndroidInterface) return 7.0; // Android 7.0+ has ARCore

    return 0;
  }

  static supportsWebShare() {
    return 'share' in navigator;
  }

  static supportsFullscreen() {
    return 'requestFullscreen' in document.documentElement ||
      'webkitRequestFullscreen' in document.documentElement ||
      'mozRequestFullScreen' in document.documentElement ||
      'msRequestFullscreen' in document.documentElement;
  }

  static getScreenSize() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      ratio: window.devicePixelRatio || 1
    };
  }

  static addResizeListener(callback) {
    let resizeTimeout;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        callback({
          deviceType: this.getDeviceType(),
          screenSize: this.getScreenSize(),
          isMobile: this.isMobile(),
          isTablet: this.isTablet(),
          isDesktop: this.isDesktop()
        });
      }, 250); // Debounce resize events
    };

    window.addEventListener('resize', handleResize);

    // Return cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }

  static getCapabilities() {
    return {
      isMobile: this.isMobileDevice(),
      isiOS: this.isiOS(),
      isAndroid: this.isAndroid(),
      isHTTPS: location.protocol === 'https:' || location.hostname === 'localhost',
      hasWebXR: 'xr' in navigator && 'requestSession' in navigator.xr,
      hasARCore: this.hasARCore(),
      hasARKit: this.hasARKit(),
      iosVersion: this.getIOSVersion(),
      androidVersion: this.getAndroidVersion(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor
    };
  }

  static isMobileDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = [
      'android',
      'webos',
      'iphone',
      'ipad',
      'ipod',
      'blackberry',
      'iemobile',
      'opera mini',
      'mobile safari'
    ];
    return mobileKeywords.some(keyword => userAgent.includes(keyword));
  }

  static hasARCore() {
    if (!this.isAndroid()) return false;

    const androidVersion = this.getAndroidVersion();
    if (androidVersion < 7.0) return false;

    // Check for ARCore support
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('chrome') || userAgent.includes('samsung');
  }

  static hasARKit() {
    if (!this.isiOS()) return false;

    const iosVersion = this.getIOSVersion();
    if (iosVersion < 12) return false;

    // Check for ARKit support
    return 'xr' in navigator ||
      window.webkit &&
      window.webkit.messageHandlers &&
      window.webkit.messageHandlers.arkit;
  }

  static getARMode() {
    if (this.isiOS()) {
      return 'quick-look';
    } else if (this.isAndroid()) {
      return 'scene-viewer';
    } else if ('xr' in navigator) {
      return 'webxr';
    }
    return null;
  }

  static async checkARSupport() {
    const capabilities = this.getCapabilities();
    const support = {
      supported: false,
      mode: null,
      reason: null,
      capabilities: capabilities
    };

    // Check HTTPS requirement
    if (!capabilities.isHTTPS) {
      support.reason = 'AR requires HTTPS connection';
      return support;
    }

    // Check device type
    if (!capabilities.isiOS && !capabilities.isAndroid) {
      support.reason = 'AR is only supported on iOS and Android devices';
      return support;
    }

    // Check iOS version
    if (capabilities.isiOS && capabilities.iosVersion < 12) {
      support.reason = 'AR requires iOS 12 or later';
      return support;
    }

    // Check Android version
    if (capabilities.isAndroid && capabilities.androidVersion < 7.0) {
      support.reason = 'AR requires Android 7.0 or later';
      return support;
    }

    // Check for AR capabilities
    if (capabilities.hasWebXR || capabilities.hasARCore || capabilities.hasARKit) {
      support.supported = true;
      support.mode = this.getARMode();
      return support;
    }

    support.reason = 'AR not supported by this browser or device';
    return support;
  }
} 