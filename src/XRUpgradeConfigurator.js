import { ConfiguratorEngine } from './core/ConfiguratorEngine.js';
import { ColorPicker } from './components/ui/ColorPicker.js';
import { StrapSelector } from './components/ui/StrapSelector.js';
import { EnvironmentSelector } from './components/ui/EnvironmentSelector.js';
import { ActionButtons } from './components/ui/ActionButtons.js';
import { MobileDock } from './components/mobile/MobileDock.js';
import { DeviceDetection } from './utils/DeviceDetection.js';
import { HealthCheck } from './utils/HealthCheck.js';
import { Logger } from './utils/Logger.js';
import { CacheManager } from './utils/CacheManager.js';

export class XRUpgradeConfigurator {
  constructor(config) {
    // Validate configuration
    this.validateConfiguration(config);

    this.config = config;
    this.engine = new ConfiguratorEngine(config);
    this.deviceInfo = DeviceDetection.getCapabilities();
    this.components = new Map();
    this.eventListeners = new Map();
    this.viewerContainer = null;
    this.cacheManager = new CacheManager();

    // Initialize UI components
    this.colorPicker = new ColorPicker(
      null, // container will be set during render
      this.config,
      (color) => this.engine.changeColor(color)
    );

    this.strapSelector = new StrapSelector(
      null, // container will be set during render
      this.config,
      (strap) => this.engine.changeStrap(strap)
    );

    this.environmentSelector = new EnvironmentSelector(
      null, // container will be set during render
      this.config,
      (env) => this.engine.changeEnvironment(env)
    );

    this.actionButtons = new ActionButtons(this, {
      layout: this.deviceInfo.isMobile ? 'vertical' : 'horizontal',
      showLabels: false
    });

    Logger.info('🎯 XRUpgradeConfigurator initialized for', this.deviceInfo.deviceType, 'device');
  }

  validateConfiguration(config) {
    if (!config) {
      throw new Error('Configuration is required');
    }

    const required = ['product', 'colors', 'straps', 'environments'];
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate product structure
    if (!config.product.model || !config.product.model.path) {
      throw new Error('Product model path is required');
    }

    // Validate colors have required textures
    for (const color of config.colors) {
      if (!color.textures || !color.textures.primary || !color.textures.accent) {
        throw new Error(`Color ${color.id} missing required textures`);
      }
    }

    // Validate default values exist
    if (config.defaultColor && !config.colors.find(c => c.id === config.defaultColor)) {
      throw new Error(`Default color '${config.defaultColor}' not found in colors array`);
    }

    if (config.defaultStrap && !config.straps.find(s => s.id === config.defaultStrap)) {
      throw new Error(`Default strap '${config.defaultStrap}' not found in straps array`);
    }

    if (config.defaultEnvironment && !config.environments.find(e => e.id === config.defaultEnvironment)) {
      throw new Error(`Default environment '${config.defaultEnvironment}' not found in environments array`);
    }

    Logger.info('✅ Configuration validation passed');
  }

  async initialize(containerId = 'configurator-container') {
    try {
      Logger.info('🚀 Initializing XRUpgrade Configurator...');

      // Get or create container
      let container = document.getElementById(containerId);
      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        document.body.appendChild(container);
      }

      // Setup container structure
      this.setupContainer(container);

      // Wait for DOM to settle
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!this.viewerContainer) {
        throw new Error('Viewer container not created during setup');
      }

      // Initialize engine first
      await this.engine.initialize(this.viewerContainer);

      // Apply URL parameters after engine is ready
      this.applyURLParameters();

      // Create UI components (only if showUI is not false)
      if (!this.hideUI) {
        this.createUI(container);
        // Sync UI with current engine state (important for URL parameters)
        this.syncUIWithEngineState();
      }

      // Setup responsive behavior (only if responsive is not false)
      if (this.enableResponsive !== false) {
        this.setupResponsiveBehavior();
      }

      Logger.info('✅ XRUpgrade Configurator initialized successfully');

      // Make health check globally available
      window.healthCheck = async () => {
        const healthCheck = new HealthCheck(this);
        return await healthCheck.runChecks();
      };

      // Subscribe to engine events
      this.engine.subscribe('initialized', () => {
        Logger.info('🎉 Configurator fully ready');
        this.hideLoadingScreen();
      });

      this.engine.subscribe('colorChanged', (colorId) => {
        // UI components handle their own state updates
      });

      this.engine.subscribe('strapChanged', (strapId) => {
        // Update the strap selector UI to reflect the engine's strap state change
        this.components.get('strapSelector')?.setStrap(strapId);
      });

      this.engine.subscribe('environmentChanged', (environmentId) => {
        // UI components handle their own state updates
      });

      // Add texture preloading progress
      this.engine.subscribe('texturePreloadProgress', (progress) => {
        this.showPreloadProgress(progress);
      });

      this.engine.subscribe('texturePreloadComplete', (result) => {
        this.hidePreloadProgress(result);
      });

      // Add idle mode tracking
      this.engine.subscribe('idleModeChanged', (data) => {
        if (data.idle) {
          Logger.info('😴 🔄 IDLE MODE: Model auto-rotating (no user activity for 1 second)');
        } else {
          Logger.info('🎯 ⏹️  ACTIVE MODE: User interaction detected, rotation stopped');
        }
      });

      this.engine.subscribe('error', (error) => {
        Logger.error('🚨 Configurator error:', error);
        this.handleError(error);
      });

    } catch (error) {
      Logger.error('❌ Failed to initialize XRUpgrade Configurator:', error);
      throw error;
    }
  }

  setupContainer(container) {
    // Add necessary classes and structure
    container.className = 'configurator-container';
    container.style.cssText = `
      position: relative;
      width: 100%;
      height: 100vh;
      overflow: hidden;
    `;

    // Create the main container structure
    const mainContainer = document.createElement('div');
    mainContainer.className = 'container';

    // Create viewer container for model-viewer
    const viewer = document.createElement('div');
    viewer.id = 'viewer';
    viewer.style.cssText = `
      width: 100%;
      height: 100%;
      position: relative;
      z-index: 1;
    `;
    mainContainer.appendChild(viewer);

    container.appendChild(mainContainer);

    // Add XRUpgrade logo
    const logo = document.createElement('div');
    logo.className = 'xrupgrade-logo';
    logo.innerHTML = '<img src="assets/logo.svg" alt="XRUpgrade">';
    container.appendChild(logo);

    // Store reference to viewer for engine initialization
    this.viewerContainer = viewer;
  }

  createUI(container) {
    // Use proper device detection instead of forcing mobile
    const isMobileDebug = document.body.classList.contains('mobile-debug');
    const isMobile = isMobileDebug || this.deviceInfo.isMobile || window.innerWidth <= 768;

    Logger.info('🔍 Device Detection Results:', {
      deviceType: this.deviceInfo.deviceType,
      isMobile: this.deviceInfo.isMobile,
      screenWidth: window.innerWidth,
      userAgent: navigator.userAgent,
      isMobileDebug: isMobileDebug,
      finalDecision: isMobile ? 'MOBILE' : 'DESKTOP'
    });

    // Log device detection info
    Logger.info('🔍 DEVICE DETECTION:', {
      isMobile,
      isMobileDebug,
      screenWidth: window.innerWidth,
      deviceType: this.deviceInfo.deviceType
    });

    if (isMobile) {
      Logger.info('📱 ✅ Creating mobile UI with MobileDock component');
      this.createMobileUI(container);
    } else {
      Logger.info('🖥️ ✅ Creating Desktop Vertical Dock UI');
      this.createDesktopUI(container);
    }
  }

  createDesktopUI(container) {
    // Create vertical dock
    const dock = document.createElement('div');
    dock.className = 'vertical-dock';

    // Create containers for each component
    const colorContainer = document.createElement('div');
    const strapContainer = document.createElement('div');
    const environmentContainer = document.createElement('div');

    // Render components into their containers
    this.colorPicker.render(colorContainer);
    this.strapSelector.render(strapContainer);
    this.environmentSelector.render(environmentContainer);

    // Add component containers to dock
    dock.appendChild(colorContainer);
    dock.appendChild(strapContainer);
    dock.appendChild(environmentContainer);

    container.appendChild(dock);

    // Store component references
    this.components.set('colorPicker', this.colorPicker);
    this.components.set('strapSelector', this.strapSelector);
    this.components.set('environmentSelector', this.environmentSelector);

    // Add floating action buttons
    const floatingActions = document.createElement('div');
    floatingActions.className = 'floating-actions';
    this.actionButtons.render(floatingActions);
    container.appendChild(floatingActions);

    this.components.set('actionButtons', this.actionButtons);
  }

  createMobileUI(container) {
    Logger.info('🏗️ START: Creating mobile UI with MobileDock component...');

    // Create mobile dock using the new component
    this.mobileDock = new MobileDock(this);
    this.mobileDock.render(container);

    // Create floating action buttons
    const floatingActions = document.createElement('div');
    floatingActions.className = 'floating-actions mobile-floating-actions';
    this.actionButtons.render(floatingActions);
    container.appendChild(floatingActions);

    // Store component references
    this.components.set('colorPicker', this.colorPicker);
    this.components.set('strapSelector', this.strapSelector);
    this.components.set('environmentSelector', this.environmentSelector);
    this.components.set('actionButtons', this.actionButtons);
    this.components.set('mobileDock', this.mobileDock);

    Logger.info('✅ MOBILE UI CREATION COMPLETE');
  }

  setupResponsiveBehavior() {
    // Listen for device orientation/size changes
    this.resizeCleanup = DeviceDetection.addResizeListener((deviceInfo) => {
      if (deviceInfo.deviceType !== this.deviceInfo.deviceType) {
        Logger.info(`📱➡️🖥️ Device type changed: ${this.deviceInfo.deviceType} → ${deviceInfo.deviceType}`);
        this.deviceInfo = deviceInfo;

        // Recreate UI for new device type
        const container = document.querySelector('.configurator-container');
        if (container) {
          // Remove existing UI components
          container.querySelectorAll('.vertical-dock, .mobile-dock, .mobile-dock-horizontal, .floating-actions, .mobile-floating-actions').forEach(el => el.remove());

          // Recreate UI
          this.createUI(container);
        }
      }
    });
  }

  applyURLParameters() {
    const params = new URLSearchParams(window.location.search);

    Logger.info('🔗 Applying URL parameters:', Object.fromEntries(params.entries()));

    // Mobile debug mode for desktop testing
    if (params.has('mobile') && params.get('mobile') === 'true') {
      document.body.classList.add('mobile-debug');
      Logger.info('🧪 Mobile debug mode activated for desktop testing');
    }

    // Apply configuration parameters
    if (params.has('color')) {
      const color = params.get('color');
      Logger.info('🎨 Setting color from URL:', color);
      this.engine.changeColor(color);
      // UI components will be updated after they're created
    }

    if (params.has('strap')) {
      const strap = params.get('strap');
      Logger.info('👜 Setting strap from URL:', strap);
      this.engine.changeStrap(strap);
      // UI components will be updated after they're created
    }

    if (params.has('environment')) {
      const environment = params.get('environment');
      Logger.info('🌍 Setting environment from URL:', environment);
      this.engine.changeEnvironment(environment);
      // UI components will be updated after they're created
    }

    // Auto-activate AR on mobile devices when ar=true parameter is present
    if (params.has('ar') && params.get('ar') === 'true') {
      const deviceCapabilities = this.deviceInfo;
      const isMobile = deviceCapabilities.isMobile || window.innerWidth <= 768;

      if (isMobile) {
        Logger.info('🥽 Auto-activating AR from URL parameter...');

        // Multiple strategies to ensure AR activation works
        const tryActivateAR = () => {
          this.activateAR();
        };

        // Strategy 1: Wait for engine initialization
        if (this.engine.isReady) {
          setTimeout(tryActivateAR, 500);
        } else {
          this.engine.subscribe('initialized', () => {
            setTimeout(tryActivateAR, 1000);
          });
        }

        // Strategy 2: Also try when model loads (backup)
        this.engine.subscribe('modelLoaded', () => {
          setTimeout(tryActivateAR, 500);
        });

        // Strategy 3: Add a user interaction fallback for browsers that require user gesture
        const addARFallback = () => {
          const arFallbackButton = document.createElement('div');
          arFallbackButton.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #667eea;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
            animation: pulse 2s infinite;
          `;
          arFallbackButton.innerHTML = '🥽 Tap to View in AR';
          arFallbackButton.onclick = () => {
            tryActivateAR();
            arFallbackButton.remove();
          };

          // Add pulse animation
          const style = document.createElement('style');
          style.textContent = `
            @keyframes pulse {
              0%, 100% { transform: translateX(-50%) scale(1); }
              50% { transform: translateX(-50%) scale(1.05); }
            }
          `;
          document.head.appendChild(style);
          document.body.appendChild(arFallbackButton);

          // Auto-remove after 10 seconds
          setTimeout(() => {
            if (arFallbackButton.parentNode) {
              arFallbackButton.remove();
            }
          }, 10000);
        };

        // Show fallback button after 3 seconds if AR hasn't activated
        setTimeout(addARFallback, 3000);
      }
    }
  }

  syncUIWithEngineState() {
    // Get current engine state
    const state = this.engine.getState();
    Logger.info('🔄 Syncing UI with engine state:', state);

    // Update UI components to match engine state
    this.components.get('colorPicker')?.setColor(state.color);
    this.components.get('strapSelector')?.setStrap(state.strap);
    this.components.get('environmentSelector')?.setEnvironment(state.environment);
  }

  // Public API for embedding and external control
  static async embed(containerId, options = {}) {
    try {
      const {
        configUrl = 'src/config/xrupgrade-product.json',
        config = null,
        autoInit = true,
        showUI = true,
        responsive = true,
        onReady = null,
        onError = null
      } = options;

      let configData;

      // Load configuration
      if (config) {
        configData = config;
      } else {
        try {
          const response = await fetch(configUrl);
          if (!response.ok) {
            throw new Error(`Failed to load config: ${response.status} ${response.statusText}`);
          }
          configData = await response.json();
        } catch (error) {
          Logger.error('❌ Failed to load configuration:', error);
          if (onError) {
            onError(error);
            return null;
          }
          throw error;
        }
      }

      // Create configurator instance
      const configurator = new XRUpgradeConfigurator(configData);

      // Configure responsive behavior
      if (responsive) {
        configurator.enableResponsive = true;
      }

      // Configure UI visibility
      if (!showUI) {
        configurator.hideUI = true;
      }

      // Auto-initialize if requested
      if (autoInit) {
        try {
          await configurator.initialize(containerId);

          // Call onReady callback if provided
          if (onReady) {
            onReady(configurator);
          }

          Logger.info('✅ XRUpgrade Configurator embedded successfully');
        } catch (error) {
          Logger.error('❌ Failed to initialize embedded configurator:', error);
          if (onError) {
            onError(error);
            return null;
          }
          throw error;
        }
      }

      return configurator;

    } catch (error) {
      Logger.error('❌ Failed to embed XRUpgrade Configurator:', error);
      if (options.onError) {
        options.onError(error);
        return null;
      }
      throw error;
    }
  }

  // Public API methods
  getState() {
    return this.engine.getState();
  }

  changeColor(colorId) {
    this.engine.changeColor(colorId);
    this.components.get('colorPicker')?.setColor(colorId);
  }

  changeStrap(strapId) {
    this.engine.changeStrap(strapId);
    this.components.get('strapSelector')?.setStrap(strapId);
  }

  changeEnvironment(environmentId) {
    this.engine.changeEnvironment(environmentId);
    this.components.get('environmentSelector')?.setEnvironment(environmentId);
  }

  reset() {
    this.engine.reset();
    // Update UI components to reflect reset state
    const state = this.engine.getState();
    this.components.get('colorPicker')?.setColor(state.color);
    this.components.get('strapSelector')?.setStrap(state.strap);
    this.components.get('environmentSelector')?.setEnvironment(state.environment);
  }

  getShareURL() {
    return this.engine.getShareURL();
  }

  async takeScreenshot() {
    return await this.engine.takeScreenshot();
  }

  activateAR() {
    this.engine.activateAR();
  }

  // Event subscription
  on(event, callback) {
    this.engine.subscribe(event, callback);
  }

  off(event, callback) {
    this.engine.unsubscribe(event, callback);
  }

  // Cleanup
  destroy() {
    Logger.info('🧹 Destroying XRUpgradeConfigurator...');

    // Cleanup resize listener
    if (this.resizeCleanup) {
      this.resizeCleanup();
    }

    // Destroy engine
    if (this.engine) {
      this.engine.destroy();
    }

    // Clear all event listeners
    this.eventListeners.clear();

    // Destroy all components
    this.components.forEach(component => {
      if (component && typeof component.destroy === 'function') {
        component.destroy();
      }
    });
    this.components.clear();

    // Remove DOM elements
    const container = document.querySelector('.configurator-container');
    if (container) {
      container.innerHTML = '';
    }

    Logger.info('✅ XRUpgradeConfigurator destroyed successfully');
  }

  hideLoadingScreen() {
    setTimeout(() => {
      const loadingOverlay = document.getElementById('loadingOverlay');
      if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 500);
      }
    }, 1000);
  }

  showPreloadProgress(progress) {
    let progressBar = document.getElementById('preloadProgress');

    if (!progressBar) {
      // Create progress indicator
      progressBar = document.createElement('div');
      progressBar.id = 'preloadProgress';
      progressBar.innerHTML = `
        <div class="preload-indicator">
          <div class="preload-text">
            🚀 Optimizing 3D textures... <span id="preloadPercent">0%</span>
          </div>
          <div class="preload-bar">
            <div class="preload-fill" id="preloadFill"></div>
          </div>
        </div>
      `;
      progressBar.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.95);
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        min-width: 280px;
        backdrop-filter: blur(10px);
      `;

      // Add CSS for progress bar
      const style = document.createElement('style');
      style.textContent = `
        .preload-text {
          margin-bottom: 8px;
          color: #333;
          font-weight: 500;
        }
        .preload-bar {
          height: 4px;
          background: #e0e0e0;
          border-radius: 2px;
          overflow: hidden;
        }
        .preload-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 2px;
          transition: width 0.3s ease;
          width: 0%;
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(progressBar);
    }

    // Update progress
    const fillElement = document.getElementById('preloadFill');
    const percentElement = document.getElementById('preloadPercent');

    if (fillElement && percentElement) {
      fillElement.style.width = `${progress.percentage}%`;
      percentElement.textContent = `${progress.percentage}%`;
    }
  }

  hidePreloadProgress(result) {
    const progressBar = document.getElementById('preloadProgress');
    if (progressBar) {
      // Show completion message briefly
      const textElement = progressBar.querySelector('.preload-text');
      if (textElement) {
        textElement.innerHTML = `✅ 3D textures optimized! (${result.loaded}/${result.total} loaded)`;
      }

      setTimeout(() => {
        progressBar.style.opacity = '0';
        progressBar.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (progressBar.parentNode) {
            progressBar.parentNode.removeChild(progressBar);
          }
        }, 300);
      }, 2000);
    }
  }
}

// Global initialization for backward compatibility
window.XRUpgradeConfigurator = XRUpgradeConfigurator; 