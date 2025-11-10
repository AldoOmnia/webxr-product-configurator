// CACHE BUST: Updated with fixed texture error handling
import { DeviceDetection } from '../utils/DeviceDetection.js';
import { HealthCheck } from '../utils/HealthCheck.js';
import { Logger } from '../utils/Logger.js';

export class ConfiguratorEngine {
  constructor(config) {
    this.config = config;
    this.modelViewer = null;
    this.materials = null;

    // Initialize state with config defaults
    this.currentState = {
      color: config.defaultColor || config.defaults?.color || config.colors[0]?.id,
      strap: config.defaultStrap || config.defaults?.strap || config.straps[0]?.id,
      environment: config.defaultEnvironment || config.defaults?.environment || config.environments[0]?.id
    };

    Logger.info('🎯 Initial state set:', this.currentState);
    this.eventListeners = new Map();
    this.isReady = false;

    // Texture caching
    this.textureCache = new Map();
    this.preloadedTextures = new Set();

    // Idle rotation tracking
    this.lastInteractionTime = Date.now();
    this.isIdleRotating = false;
    this.idleRotationTimeout = null;
    this.IDLE_DELAY = 1000; // 1 second of inactivity

    Logger.debug('🎯 ConfiguratorEngine initialized with texture caching and idle rotation');
    Logger.debug('🔄 Idle rotation tracking started - will activate after 1 second of inactivity');
  }

  async initialize(container) {
    Logger.info('🚀 Initializing configurator engine...');

    try {
      await this.ensureModelViewerLoaded();
      await this.ensureContainerReady(container);
      await this.createModelViewer(container);
      await this.waitForModelLoad();

      this.setupMaterialReferences();
      this.setupEnvironments(container);

      // Start texture preloading after model is ready
      this.startTexturePreloading();

      await this.applyInitialConfiguration();

      this.isReady = true;

      Logger.info('✅ ConfiguratorEngine initialized successfully');
      this.notifyListeners('initialized', { engine: this });

    } catch (error) {
      Logger.error('❌ ConfiguratorEngine initialization failed:', error);
      this.isReady = false;
      throw error;
    }
  }

  async ensureModelViewerLoaded() {
    if (!window.customElements.get('model-viewer')) {
      Logger.info('⏳ Waiting for model-viewer library...');

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          const error = new Error('model-viewer library failed to load within 10 seconds');
          this.notifyListeners('error', {
            type: 'network',
            message: 'Failed to load model-viewer library',
            details: { timeout: true },
            timestamp: Date.now()
          });
          reject(error);
        }, 10000);

        const checkModelViewer = () => {
          if (window.customElements.get('model-viewer')) {
            clearTimeout(timeout);
            Logger.info('✅ Model-viewer library loaded');
            resolve();
          } else {
            setTimeout(checkModelViewer, 100);
          }
        };

        checkModelViewer();
      });
    } else {
      Logger.info('✅ Model-viewer library already available');
    }
  }

  async ensureContainerReady(container) {
    if (!container) {
      throw new Error('Container is null or undefined');
    }

    if (!container.offsetWidth || !container.offsetHeight) {
      Logger.info('⏳ Waiting for container dimensions...');

      return new Promise((resolve, reject) => {
        const checkDimensions = () => {
          if (container.offsetWidth > 0 && container.offsetHeight > 0) {
            Logger.info('✅ Container ready');
            resolve();
          } else {
            setTimeout(checkDimensions, 50);
          }
        };

        checkDimensions();

        setTimeout(() => {
          reject(new Error('Container failed to get dimensions'));
        }, 5000);
      });
    }
  }

  async createModelViewer(container) {
    this.loadStartTime = performance.now();

    // Ensure model-viewer is loaded before creating instance
    await this.ensureModelViewerLoaded();

    this.modelViewer = document.createElement('model-viewer');

    // Set model source - use original model for now
    const modelPath = this.config.product.model.path;
    Logger.info('📦 Loading model:', modelPath);
    this.modelViewer.src = modelPath;
    this.modelViewer.alt = this.config.product.name;

    // Configure camera
    if (this.config.product.model.camera) {
      const camera = this.config.product.model.camera;
      this.modelViewer.cameraControls = true;
      this.modelViewer.setAttribute('camera-target', camera.target);
      this.modelViewer.setAttribute('camera-orbit', camera.orbit);
      this.modelViewer.setAttribute('min-camera-orbit', 'auto auto 1.5m');
      this.modelViewer.setAttribute('max-camera-orbit', 'auto auto 3m');
    }

    // Configure AR and interaction with browser-specific modes
    this.modelViewer.ar = true;

    // Set AR modes based on browser/device
    const deviceCapabilities = DeviceDetection.getCapabilities();
    let arModes = [];

    if (deviceCapabilities.isiOS) {
      arModes.push('quick-look');
    } else if (deviceCapabilities.isAndroid) {
      arModes.push('scene-viewer');
    }

    // Add WebXR as fallback for supported browsers
    if ('xr' in navigator) {
      arModes.push('webxr');
    }

    this.modelViewer.arModes = arModes.join(' ');

    // Enhanced AR configuration
    this.modelViewer.autoRotate = false;
    this.modelViewer.autoplay = false;
    this.modelViewer.loading = 'eager';
    this.modelViewer.reveal = 'auto';
    this.modelViewer.setAttribute('rotation-per-second', '10deg');
    this.modelViewer.setAttribute('ar-scale', 'auto');
    this.modelViewer.setAttribute('ar-placement', 'floor');
    this.modelViewer.setAttribute('ar-button', 'true');
    this.modelViewer.setAttribute('ar-status', 'not-presenting');

    // iOS AR support
    if (DeviceDetection.isiOS()) {
      this.modelViewer.iosSrc = this.config.product.model.path;
    }

    // Configure environment lighting
    this.modelViewer.environmentImage = 'neutral';
    this.modelViewer.skyboxImage = null;
    this.modelViewer.exposure = '1';
    this.modelViewer.shadowIntensity = '0.4';
    this.modelViewer.shadowSoftness = '0.5';

    // Style the model viewer
    this.modelViewer.style.cssText = `
      width: 100%;
      height: 100%;
      background-color: transparent;
      --poster-color: transparent;
      --progress-bar-color: #667eea;
      --progress-bar-height: 3px;
      --progress-mask: transparent;
    `;

    this.setupModelViewerEvents();
    container.appendChild(this.modelViewer);

    Logger.info('✅ Model-viewer created and configured with idle rotation');
  }

  setupModelViewerEvents() {
    this.modelViewer.addEventListener('load', () => {
      this.notifyListeners('modelLoaded', {
        model: this.modelViewer.model,
        loadTime: performance.now() - this.loadStartTime,
        fileSize: this.modelViewer.model?.size || 0
      });

      this.ensureModelVisibility();

      // Apply initial configuration first
      setTimeout(async () => {
        await this.applyInitialConfiguration();
      }, 500);

      // Start rotation immediately when model loads
      this.modelViewer.autoRotate = true;
      this.isIdleRotating = true;

      // Start idle tracking
      this.startIdleTracking();
    });

    this.modelViewer.addEventListener('error', (event) => {
      Logger.error('❌ Model load error:', event);

      this.notifyListeners('error', {
        type: 'webgl',
        message: 'Failed to load 3D model',
        details: {
          event: event.type,
          detail: event.detail,
          src: this.modelViewer.src
        },
        timestamp: Date.now()
      });

      this.diagnoseModelError();
    });

    this.modelViewer.addEventListener('progress', (event) => {
      const progress = Math.round(event.detail.totalProgress * 100);
      // Reduced logging - only log at 50% and 100%
      if (progress === 50 || progress === 100) {
        Logger.info(`📊 Loading: ${progress}%`);
      }
    });

    this.modelViewer.addEventListener('ar-status', (event) => {
      if (event.detail.status === 'session-started') {
        this.notifyListeners('arActivated', {
          timestamp: Date.now(),
          device: DeviceDetection.getCapabilities()
        });
      }
    });

    // Track ONLY direct user input events - bypass all automated camera movements
    this.modelViewer.addEventListener('mousedown', () => {
      this.onUserInteraction();
    });

    this.modelViewer.addEventListener('touchstart', () => {
      this.onUserInteraction();
    });

    this.modelViewer.addEventListener('wheel', () => {
      this.onUserInteraction();
    });
  }

  startIdleTracking() {
    // Clear any existing timer
    if (this.idleRotationTimeout) {
      clearInterval(this.idleRotationTimeout);
    }

    // Start idle detection
    this.idleRotationTimeout = setInterval(() => {
      const timeSinceLastInteraction = Date.now() - this.lastInteractionTime;

      if (timeSinceLastInteraction > this.IDLE_DELAY && !this.isIdleRotating) {
        this.enterIdleMode();
      }
    }, 1000); // Check every second
  }

  onUserInteraction() {
    this.lastInteractionTime = Date.now();

    if (this.isIdleRotating) {
      this.exitIdleMode();
    }
  }

  enterIdleMode() {
    this.isIdleRotating = true;

    if (this.modelViewer) {
      this.modelViewer.autoRotate = true;
      this.notifyListeners('idleModeChanged', { idle: true });
    }
  }

  exitIdleMode() {
    this.isIdleRotating = false;

    if (this.modelViewer) {
      this.modelViewer.autoRotate = false;
      this.notifyListeners('idleModeChanged', { idle: false });
    }
  }

  ensureModelVisibility() {
    // Set camera to configured position
    if (this.config.product.model.camera) {
      const camera = this.config.product.model.camera;
      this.modelViewer.setAttribute('camera-target', camera.target);
      this.modelViewer.setAttribute('camera-orbit', camera.orbit);
    }

    // Verify model visibility
    const rect = this.modelViewer.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      Logger.warn('⚠️ Model may not be visible');
    }
  }

  async diagnoseModelError() {
    try {
      const response = await fetch(this.modelViewer.src, { method: 'HEAD' });
      if (!response.ok) {
        Logger.error('❌ Model file not accessible:', response.status, response.statusText);
      } else {
        const size = response.headers.get('content-length');
        Logger.info('✅ Model file accessible, size:', Math.round(size / 1024 / 1024) + 'MB');
      }
    } catch (error) {
      Logger.error('❌ Error checking model file:', error);
    }
  }

  async waitForModelLoad() {
    return new Promise((resolve, reject) => {
      if (this.modelViewer.loaded) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Model load timeout'));
      }, 30000);

      this.modelViewer.addEventListener('load', () => {
        clearTimeout(timeout);
        resolve();
      }, { once: true });

      this.modelViewer.addEventListener('error', (event) => {
        clearTimeout(timeout);
        reject(new Error(`Model load failed: ${event.detail || 'Unknown error'}`));
      }, { once: true });
    });
  }

  setupMaterialReferences() {
    try {
      if (!this.modelViewer.model) {
        Logger.warn('⚠️ Model not loaded yet, materials will be set up later');
        return;
      }

      const materialNames = this.config.product.materials;

      const primaryMaterial = this.modelViewer.model.getMaterialByName(materialNames.primary);
      const secondaryMaterial = this.modelViewer.model.getMaterialByName(materialNames.secondary);
      const accentMaterial = this.modelViewer.model.getMaterialByName(materialNames.accent);

      if (primaryMaterial && secondaryMaterial && accentMaterial) {
        this.materials = {
          primary: primaryMaterial,
          secondary: secondaryMaterial,
          accent: accentMaterial
        };
        Logger.info('✅ Materials successfully referenced:', Object.keys(this.materials));
      } else {
        Logger.error('❌ Failed to find required materials');
        Logger.info('Available materials:', this.modelViewer.model.materials.map(m => m.name));
        Logger.info('Required materials:', materialNames);
      }
    } catch (error) {
      Logger.error('❌ Error setting up materials:', error);
    }
  }

  setupEnvironments(container) {
    this.config.environments.forEach(env => {
      const envElement = document.createElement('div');
      envElement.id = `${env.id}Env`;
      envElement.className = 'staging-environment';
      envElement.style.background = env.background;

      if (env.id === this.currentState.environment) {
        envElement.classList.add('active');
      }

      container.appendChild(envElement);
    });
  }

  async changeColor(colorId) {
    const color = this.config.colors.find(c => c.id === colorId);
    if (!color) {
      Logger.error(`❌ Unknown color: ${colorId}`);
      return;
    }

    // Update state immediately for instant UI feedback
    const previousColor = this.currentState.color;
    this.currentState.color = colorId;

    // Notify listeners immediately for instant UI updates
    this.notifyListeners('colorChanged', colorId);

    try {
      // Apply color textures (using cached textures for speed)
      await this.applyColorTextures(color);

      // When color changes, automatically set strap to match the new color
      // This ensures visual consistency and proper UI state
      this.currentState.strap = 'selected';
      await this.applyStrapConfiguration('selected');

      // Notify UI that strap has been updated to match new color
      this.notifyListeners('strapChanged', 'selected');

    } catch (error) {
      Logger.error(`❌ Failed to change color to ${colorId}:`, error);

      // Rollback state on error
      this.currentState.color = previousColor;
      this.notifyListeners('colorChanged', previousColor);

      // Notify error
      this.notifyListeners('error', {
        type: 'user',
        message: `Failed to change color to ${color.name}`,
        details: error,
        timestamp: Date.now()
      });
    }
  }

  async applyColorTextures(color) {
    const primaryMaterial = this.materials.primary;
    const secondaryMaterial = this.materials.secondary;
    const accentMaterial = this.materials.accent;

    if (!primaryMaterial || !secondaryMaterial || !accentMaterial) {
      throw new Error('Materials not ready');
    }

    // Use cached textures for instant color changes
    const primaryTexture = await this.getTexture(color.textures.primary);
    const accentTexture = await this.getTexture(color.textures.accent);
    const roughnessTexture = await this.getTexture(color.textures.roughness);

    primaryMaterial.pbrMetallicRoughness.baseColorTexture.setTexture(primaryTexture);
    secondaryMaterial.pbrMetallicRoughness.baseColorTexture.setTexture(accentTexture);
    accentMaterial.pbrMetallicRoughness.baseColorTexture.setTexture(accentTexture);
    primaryMaterial.pbrMetallicRoughness.metallicRoughnessTexture.setTexture(roughnessTexture);
  }

  async changeStrap(strapId) {
    const strap = this.config.straps.find(s => s.id === strapId);
    if (!strap) {
      Logger.error(`❌ Unknown strap: ${strapId}`);
      return;
    }

    this.currentState.strap = strapId;

    try {
      await this.applyStrapConfiguration(strapId);
      this.notifyListeners('strapChanged', strapId);

    } catch (error) {
      Logger.error(`❌ Failed to change strap to ${strapId}:`, error);
    }
  }

  async applyStrapConfiguration(strapId) {
    Logger.info(`🔧 Applying strap configuration: ${strapId}`);

    const accentMaterial = this.materials.accent;
    if (!accentMaterial) {
      Logger.error('❌ Accent material not ready');
      throw new Error('Accent material not ready');
    }

    let strapTexture;

    if (strapId === 'selected') {
      Logger.info('📋 Selected strap - using current color accent texture');
      const currentColor = this.config.colors.find(c => c.id === this.currentState.color);
      Logger.info(`🎨 Current color state: ${this.currentState.color}`);
      Logger.info(`🔍 Found color object:`, currentColor ? 'YES' : 'NO');

      if (currentColor && currentColor.textures) {
        strapTexture = currentColor.textures.accent;
        Logger.info(`✅ Using accent texture: ${strapTexture}`);
      } else {
        Logger.warn('⚠️ Current color or textures not found');
      }
    } else {
      Logger.info(`🎒 Custom strap requested: ${strapId}`);
      const strap = this.config.straps.find(s => s.id === strapId);
      Logger.info(`🔍 Found strap object:`, strap ? 'YES' : 'NO');
      Logger.info(`📋 Available straps:`, this.config.straps.map(s => s.id));

      if (strap && strap.texture) {
        strapTexture = strap.texture;
        Logger.info(`✅ Using strap texture: ${strapTexture}`);
      } else if (strap && !strap.texture) {
        Logger.warn(`⚠️ Strap ${strapId} found but has no texture property`);
        Logger.info(`📋 Strap object:`, strap);
      } else {
        Logger.error(`❌ Strap ${strapId} not found in configuration`);
      }
    }

    if (strapTexture) {
      Logger.info(`🖼️ Loading texture: ${strapTexture}`);
      const texture = await this.getTexture(strapTexture);
      accentMaterial.pbrMetallicRoughness.baseColorTexture.setTexture(texture);
      Logger.info('✅ Strap texture applied successfully');
    } else {
      Logger.warn('⚠️ No texture to apply for strap configuration');
    }
  }

  changeEnvironment(environmentId) {
    const environment = this.config.environments.find(e => e.id === environmentId);
    if (!environment) {
      Logger.error(`❌ Unknown environment: ${environmentId}`);
      return;
    }

    this.currentState.environment = environmentId;

    document.querySelectorAll('.staging-environment').forEach(envEl => {
      envEl.classList.remove('active');
    });

    const targetEnv = document.getElementById(`${environmentId}Env`);
    if (targetEnv) {
      targetEnv.classList.add('active');
    }

    this.notifyListeners('environmentChanged', environmentId);
  }

  async applyInitialConfiguration() {
    // Ensure materials are ready before applying configuration
    if (!this.materials || !this.materials.primary || !this.materials.secondary || !this.materials.accent) {
      Logger.warn('⚠️ Materials not ready, skipping initial configuration');
      return;
    }

    try {
      const initialColor = this.config.colors.find(c => c.id === this.currentState.color);
      if (initialColor) {
        await this.applyColorTextures(initialColor);
      }

      await this.applyStrapConfiguration(this.currentState.strap);
      Logger.info('✅ Initial configuration applied successfully');
    } catch (error) {
      Logger.error('❌ Failed to apply initial configuration:', error);
    }
  }

  // Event system
  subscribe(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  unsubscribe(event, callback) {
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          Logger.error(`❌ Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Public API
  getState() {
    return { ...this.currentState };
  }

  getShareURL() {
    const params = new URLSearchParams(this.currentState);
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }

  async takeScreenshot() {
    try {
      const dataUrl = await this.modelViewer.toDataURL();

      this.notifyListeners('screenshotTaken', {
        dataUrl: dataUrl,
        size: dataUrl.length,
        timestamp: Date.now()
      });

      Logger.info('✅ Screenshot captured');
      return dataUrl;
    } catch (error) {
      Logger.error('❌ Screenshot failed:', error);

      this.notifyListeners('error', {
        type: 'user',
        message: 'Failed to capture screenshot',
        details: error,
        timestamp: Date.now()
      });

      throw error;
    }
  }

  activateAR() {
    try {
      const deviceCapabilities = DeviceDetection.getCapabilities();

      // Check if model is loaded
      if (!this.modelViewer.loaded) {
        Logger.info('⏳ Waiting for model to load before activating AR...');
        this.modelViewer.addEventListener('load', () => {
          this.activateAR();
        }, { once: true });
        return;
      }

      // Check HTTPS requirement
      if (!deviceCapabilities.isHTTPS) {
        const message = 'AR requires HTTPS connection';
        Logger.warn(message);
        this.notifyListeners('error', {
          type: 'user',
          message: message,
          details: {
            protocol: location.protocol,
            hostname: location.hostname,
            requiresHTTPS: true
          },
          timestamp: Date.now()
        });
        return;
      }

      // Enhanced AR activation with retry logic
      const tryActivateAR = async (retryCount = 0) => {
        if (!this.modelViewer.canActivateAR) {
          // Provide specific error messages
          let errorMessage = 'AR not available on this device';

          if (!deviceCapabilities.isHTTPS) {
            errorMessage = 'AR requires HTTPS connection';
          } else if (!deviceCapabilities.isiOS && !deviceCapabilities.isAndroid) {
            errorMessage = 'AR is only supported on iOS and Android devices';
          } else if (deviceCapabilities.isiOS && DeviceDetection.getIOSVersion() < 12) {
            errorMessage = 'AR requires iOS 12 or later';
          } else if (deviceCapabilities.isAndroid && DeviceDetection.getAndroidVersion() < 7.0) {
            errorMessage = 'AR requires Android 7.0 or later';
          } else {
            errorMessage = 'AR not supported by this browser or device';
          }

          Logger.warn(errorMessage);

          this.notifyListeners('error', {
            type: 'user',
            message: errorMessage,
            details: {
              canActivateAR: this.modelViewer.canActivateAR,
              deviceCapabilities: deviceCapabilities
            },
            timestamp: Date.now()
          });
          return;
        }

        Logger.info('🥽 Activating AR...');

        try {
          await this.modelViewer.activateAR();

          this.notifyListeners('arActivated', {
            timestamp: Date.now(),
            device: deviceCapabilities
          });

          // Monitor AR session status
          this.modelViewer.addEventListener('ar-status', (event) => {
            Logger.info('AR Status:', event.detail.status);
            if (event.detail.status === 'session-started') {
              this.notifyListeners('arSessionStarted', {
                timestamp: Date.now()
              });
            }
          });
        } catch (error) {
          Logger.error('AR activation failed:', error);

          // Retry logic for certain errors
          if (retryCount < 3 && error.message.includes('user gesture')) {
            Logger.info('Retrying AR activation...');
            setTimeout(() => tryActivateAR(retryCount + 1), 1000);
          } else {
            throw error;
          }
        }
      };

      tryActivateAR();
    } catch (error) {
      Logger.error('❌ AR activation failed:', error);

      this.notifyListeners('error', {
        type: 'user',
        message: 'Failed to activate AR',
        details: error,
        timestamp: Date.now()
      });
    }
  }

  reset() {
    Logger.info('🔄 Resetting configuration...');

    this.changeColor(this.config.defaultColor || this.config.defaults?.color);
    this.changeStrap(this.config.defaultStrap || this.config.defaults?.strap);
    this.changeEnvironment(this.config.defaultEnvironment || this.config.defaults?.environment);

    this.notifyListeners('reset', this.currentState);
    Logger.info('✅ Configuration reset');
  }

  // Texture caching and preloading system
  async preloadTexture(url) {
    if (this.textureCache.has(url)) {
      return this.textureCache.get(url);
    }

    try {
      const texture = await this.modelViewer.createTexture(url);
      this.textureCache.set(url, texture);
      return texture;
    } catch (error) {
      Logger.error(`❌ Failed to preload texture ${url}:`, error);
      return null;
    }
  }

  async getTexture(url) {
    if (this.textureCache.has(url)) {
      return this.textureCache.get(url);
    }

    // If not cached, load immediately
    return await this.preloadTexture(url);
  }

  async preloadColorTextures(colorId) {
    const color = this.config.colors.find(c => c.id === colorId);
    if (!color) return;

    try {
      await Promise.all([
        this.preloadTexture(color.textures.primary),
        this.preloadTexture(color.textures.accent),
        this.preloadTexture(color.textures.roughness)
      ]);
    } catch (error) {
      Logger.error(`❌ Failed to preload textures for ${colorId}:`, error);
    }
  }

  // Add texture caching system
  startTexturePreloading() {
    if (this.isReady) return;
    this.isReady = true;

    Logger.info('🚀 Starting texture preloading...');

    // Preload textures in background, starting with most common colors
    const preloadOrder = [
      this.currentState.color, // Current color first
      ...this.config.colors.map(c => c.id).filter(id => id !== this.currentState.color)
    ];

    const preload = async () => {
      let preloadedCount = 0;

      for (const colorId of preloadOrder) {
        try {
          await this.preloadColorTextures(colorId);
          preloadedCount++;

          // Notify progress
          this.notifyListeners('texturePreloadProgress', {
            loaded: preloadedCount,
            total: this.config.colors.length,
            percentage: Math.round((preloadedCount / this.config.colors.length) * 100)
          });

          // Add small delay to avoid blocking UI
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          Logger.error(`❌ Failed to preload ${colorId}:`, error);
        }
      }

      Logger.info(`✅ Texture preloading completed: ${preloadedCount}/${this.config.colors.length} colors`);
      this.isReady = false;
      this.notifyListeners('texturePreloadComplete', { loaded: preloadedCount, total: this.config.colors.length });
    };

    // Start preloading in background
    setTimeout(() => preload(), 500);
  }

  // Add cleanup method
  destroy() {
    // Clear idle timer
    if (this.idleRotationTimeout) {
      clearInterval(this.idleRotationTimeout);
      this.idleRotationTimeout = null;
    }

    // Clear texture cache
    this.textureCache.clear();

    // Clear listeners
    this.eventListeners.clear();

    Logger.info('🧹 ConfiguratorEngine destroyed');
  }
} 