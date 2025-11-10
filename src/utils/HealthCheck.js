import { Logger } from './Logger.js';

/**
 * HealthCheck Utility
 * Provides system health monitoring for the configurator
 */
export class HealthCheck {
  constructor(configurator) {
    this.configurator = configurator;
  }

  async runChecks() {
    const results = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {}
    };

    try {
      // Test model loading
      results.checks.modelAccess = await this.checkModelAccess();

      // Test configuration loading
      results.checks.configAccess = await this.checkConfigAccess();

      // Test WebGL support
      results.checks.webglSupport = this.checkWebGLSupport();

      // Test performance
      results.checks.performance = await this.checkPerformance();

      // Test device capabilities
      results.checks.deviceCapabilities = this.checkDeviceCapabilities();

      // Overall status based on checks
      const failedChecks = Object.values(results.checks).filter(check => check.status === 'fail');
      if (failedChecks.length > 0) {
        results.status = 'unhealthy';
      } else {
        const warnChecks = Object.values(results.checks).filter(check => check.status === 'warn');
        if (warnChecks.length > 0) {
          results.status = 'degraded';
        }
      }

    } catch (error) {
      results.status = 'unhealthy';
      results.error = error.message;
      Logger.error('❌ Health check failed:', error);
    }

    return results;
  }

  async checkModelAccess() {
    try {
      const modelPath = this.configurator.config.product.model.path;
      const response = await fetch(modelPath, { method: 'HEAD' });

      if (response.ok) {
        const contentLength = response.headers.get('content-length');
        return {
          status: 'pass',
          details: {
            httpStatus: response.status,
            size: contentLength ? `${Math.round(contentLength / 1024 / 1024)}MB` : 'unknown'
          }
        };
      } else {
        return {
          status: 'fail',
          details: {
            httpStatus: response.status,
            statusText: response.statusText
          }
        };
      }
    } catch (error) {
      return { status: 'fail', details: { error: error.message } };
    }
  }

  async checkConfigAccess() {
    try {
      const config = this.configurator.config;

      // Validate configuration structure
      const issues = [];

      if (!config.colors || config.colors.length === 0) {
        issues.push('No colors defined');
      }

      if (!config.straps || config.straps.length === 0) {
        issues.push('No straps defined');
      }

      if (!config.environments || config.environments.length === 0) {
        issues.push('No environments defined');
      }

      // Check if all texture files are accessible
      const textureChecks = await Promise.all(
        config.colors.slice(0, 2).map(async (color) => {
          try {
            const response = await fetch(color.textures.primary, { method: 'HEAD' });
            return { colorId: color.id, accessible: response.ok };
          } catch {
            return { colorId: color.id, accessible: false };
          }
        })
      );

      const inaccessibleTextures = textureChecks.filter(check => !check.accessible);

      return {
        status: issues.length === 0 && inaccessibleTextures.length === 0 ? 'pass' : 'warn',
        details: {
          colors: config.colors?.length || 0,
          straps: config.straps?.length || 0,
          environments: config.environments?.length || 0,
          issues: issues,
          textureAccessibility: `${textureChecks.length - inaccessibleTextures.length}/${textureChecks.length} accessible`
        }
      };
    } catch (error) {
      return { status: 'fail', details: { error: error.message } };
    }
  }

  checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');

      if (!gl) {
        return { status: 'fail', details: { supported: false, reason: 'WebGL not supported' } };
      }

      // Get WebGL info
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';

      return {
        status: 'pass',
        details: {
          supported: true,
          version: gl.getParameter(gl.VERSION),
          renderer: renderer,
          vendor: gl.getParameter(gl.VENDOR)
        }
      };
    } catch (error) {
      return { status: 'fail', details: { error: error.message } };
    }
  }

  async checkPerformance() {
    const start = performance.now();

    // Simulate typical operations
    await new Promise(resolve => setTimeout(resolve, 10));

    // Test memory if available
    let memoryInfo = null;
    if (performance.memory) {
      memoryInfo = {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }

    const duration = performance.now() - start;
    const status = duration < 100 ? 'pass' : duration < 500 ? 'warn' : 'fail';

    return {
      status: status,
      details: {
        responseTime: Math.round(duration),
        memory: memoryInfo
      }
    };
  }

  checkDeviceCapabilities() {
    try {
      const capabilities = this.configurator.deviceInfo;

      const issues = [];
      if (!capabilities.supportsWebShare && capabilities.isMobile) {
        issues.push('Web Share API not supported on mobile device');
      }

      if (!capabilities.supportsAR && capabilities.isMobile) {
        issues.push('AR not supported on mobile device');
      }

      return {
        status: issues.length === 0 ? 'pass' : 'warn',
        details: {
          deviceType: capabilities.deviceType,
          features: {
            webShare: capabilities.supportsWebShare,
            ar: capabilities.supportsAR,
            fullscreen: capabilities.supportsFullscreen
          },
          issues: issues
        }
      };
    } catch (error) {
      return { status: 'fail', details: { error: error.message } };
    }
  }
} 