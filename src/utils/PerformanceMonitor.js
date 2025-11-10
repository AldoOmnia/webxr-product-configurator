import { Logger } from './Logger.js';

export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
  }

  startTiming(label) {
    this.metrics.set(label, {
      startTime: performance.now(),
      endTime: null,
      duration: null
    });
  }

  endTiming(label) {
    const metric = this.metrics.get(label);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;

      Logger.info(`⏱️ Performance: ${label} took ${metric.duration.toFixed(2)}ms`);

      // Log slow operations
      if (metric.duration > 100) {
        Logger.warn(`🐌 Slow operation detected: ${label} took ${metric.duration.toFixed(2)}ms`);
      }
    }
  }

  measureScrollPerformance(scrollContainer) {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFrame = () => {
      frameCount++;
      const currentTime = performance.now();

      // Measure FPS every second
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;

        if (fps < 30) {
          Logger.warn(`📉 Low FPS detected during scroll: ${fps} FPS`);
        }
      }

      requestAnimationFrame(measureFrame);
    };

    const startMeasuring = () => {
      requestAnimationFrame(measureFrame);
    };

    const stopMeasuring = () => {
      frameCount = 0;
    };

    scrollContainer.addEventListener('scroll', startMeasuring, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', startMeasuring);
      stopMeasuring();
    };
  }

  observeMemoryUsage() {
    if ('memory' in performance) {
      const logMemory = () => {
        const memory = performance.memory;
        Logger.info(`💾 Memory Usage: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB used, ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB total`);

        // Warn if memory usage is high
        if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
          Logger.warn('⚠️ High memory usage detected');
        }
      };

      // Log memory usage every 30 seconds
      const interval = setInterval(logMemory, 30000);

      return () => clearInterval(interval);
    }

    return () => { };
  }

  measureDOMOperations() {
    const originalAppendChild = Element.prototype.appendChild;
    const originalRemoveChild = Element.prototype.removeChild;

    let domOperations = 0;

    Element.prototype.appendChild = function (...args) {
      domOperations++;
      return originalAppendChild.apply(this, args);
    };

    Element.prototype.removeChild = function (...args) {
      domOperations++;
      return originalRemoveChild.apply(this, args);
    };

    // Log DOM operations every 10 seconds
    const interval = setInterval(() => {
      if (domOperations > 0) {
        Logger.info(`🔄 DOM Operations: ${domOperations} in last 10 seconds`);

        if (domOperations > 100) {
          Logger.warn('⚠️ High DOM operation count detected');
        }

        domOperations = 0;
      }
    }, 10000);

    return () => {
      Element.prototype.appendChild = originalAppendChild;
      Element.prototype.removeChild = originalRemoveChild;
      clearInterval(interval);
    };
  }

  getMetrics() {
    const results = {};
    this.metrics.forEach((metric, label) => {
      results[label] = {
        duration: metric.duration,
        startTime: metric.startTime,
        endTime: metric.endTime
      };
    });
    return results;
  }

  reset() {
    this.metrics.clear();
    this.observers.forEach(cleanup => cleanup());
    this.observers.clear();
  }
} 