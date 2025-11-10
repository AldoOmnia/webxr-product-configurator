# 🎯 Omnia WebXR Product Configurator

A professional, modular 3D product configurator built with vanilla JavaScript and Google's model-viewer. Designed for high performance, universal compatibility, and easy customization.

**Current Product**: Floyd Weekender Bag

**Status**: ✅ Production Ready (v2.0.2)  
**Last Updated**: January 2025  
**Dependencies**: ✅ All updated, 0 vulnerabilities

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Production Deployment](#-production-deployment)
- [Architecture Overview](#-architecture-overview)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Component System](#-component-system)
- [API Reference](#-api-reference)
- [Development Guide](#-development-guide)
- [Troubleshooting](#-troubleshooting)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ (for development server)
- Modern browser with WebGL support
- Local web server (Python, Node.js, or PHP)

### Installation & Setup

```bash
# Clone the repository
git clone <repository-url>
cd xrupgrade-product-configurator

# Install development dependencies
npm install

# Start development server (choose one)
npm run dev                    # Python server on port 8080
npm run dev-alt               # Node.js serve on port 8080
python3 -m http.server 8080   # Python alternative
php -S localhost:8080         # PHP alternative
```

### Building for Production

```bash
# Build optimized version for production
npm run build:prod

# This creates:
# - Minified CSS: src/styles/main.min.css (29% smaller)
# - Compressed assets
# - Production-ready build

# Use index.prod.html for production deployment
```

### First Run
1. Open `http://localhost:8080` in your browser
2. Wait for the 3D model to load (~20MB download)
3. Interact with color, strap, and environment options
4. Test AR functionality on mobile devices

> **Note**: For production, consider optimizing the 3D model to reduce file size

## 🚀 Production Deployment

### Quick Deploy
```bash
# 1. Build for production
npm run build:prod

# 2. Deploy files to your hosting provider
# Use index.prod.html as your main entry point

# 3. Ensure HTTPS for AR features
# 4. Configure CDN for optimal performance
```

### Production Checklist
- ✅ **Dependencies**: All updated and secure (0 vulnerabilities)
- ✅ **Build**: Minified CSS and optimized assets
- ✅ **PWA**: Manifest and service worker configured
- ✅ **Analytics**: Ready for Google Analytics integration
- ✅ **Security**: HTTPS required for AR features
- ⚠️ **Model**: Consider optimizing 20MB GLB file for better performance

### Hosting Recommendations
- **Netlify** (recommended) - Automatic HTTPS and CDN
- **Vercel** - Excellent for static sites
- **AWS S3 + CloudFront** - Enterprise solution
- **Firebase Hosting** - Google integration

See `PRODUCTION_DEPLOY.md` for detailed deployment instructions.

## ⚠️ Common Development Issues

### WebXR Permissions Warnings
If you see console warnings about `xr-spatial-tracking` permissions, this is normal for local development:

```
[Violation] Permissions policy violation: xr-spatial-tracking is not allowed
```

**Solutions**:
1. **For Development**: Warnings are harmless - AR falls back to Scene Viewer
2. **For Production**: Deploy with HTTPS - warnings will disappear
3. **Headers Fixed**: Permissions policy headers are already configured

The app works correctly despite these warnings!

## 🏗️ Architecture Overview

### Core Principles
- **Modular Design**: Self-contained components with clear interfaces
- **Configuration-Driven**: JSON-based product definitions
- **Event-Driven**: Loose coupling via event system
- **Progressive Enhancement**: Works without JavaScript
- **Mobile-First**: Responsive design with touch optimization

### Technology Stack
```
Frontend:
├── Vanilla JavaScript (ES6+)    # Core application logic
├── Google Model-Viewer          # 3D rendering & AR
├── CSS3 (Grid/Flexbox)          # Modern styling
└── HTML5                        # Semantic markup

Assets:
├── GLB/GLTF Models              # 3D models
├── JPEG Textures                # Material textures
└── SVG Icons                    # UI elements

Infrastructure:
├── Static File Hosting          # No server required
├── CDN Support                  # Global distribution
└── Progressive Web App Ready    # PWA capabilities
```

### Data Flow
```
Configuration JSON → XRUpgradeConfigurator → ConfiguratorEngine → Model-Viewer
                   ↓
User Interaction → UI Components → Event System → State Updates
                   ↓
State Changes → Material Updates → Visual Feedback → Analytics
```

## 📁 Project Structure

```
xrupgrade-product-configurator/
├── index.html                   # Application entry point
├── package.json                 # Project configuration
├── README.md                    # This documentation
│
├── src/                         # Source code
│   ├── XRUpgradeConfigurator.js     # Main application class
│   ├── core/                    # Core engine
│   │   └── ConfiguratorEngine.js
│   ├── components/              # UI components
│   │   ├── ui/                  # Desktop/mobile UI
│   │   │   ├── ColorPicker.js
│   │   │   ├── StrapSelector.js
│   │   │   ├── EnvironmentSelector.js
│   │   │   └── ActionButtons.js
│   │   ├── mobile/              # Mobile-specific components (planned)
│   │   └── effects/             # Visual effects (planned)
│   ├── utils/                   # Utility functions
│   │   └── DeviceDetection.js
│   ├── config/                  # Configuration files
│   │   └── xrupgrade-weekender.json
│   └── styles/                  # Stylesheets
│       └── main.css
│
├── public/                      # Static assets
│   ├── Weekender.glb           # 3D model (~20MB)
│   └── assets/                 # Textures & images
│       ├── *.jpg               # Color swatches
│       └── Weekender/          # Material textures
│           ├── *_BaseColor.jpg
│           └── *_MetRough.jpg
│
├── assets/                     # Application assets
│   ├── logo.svg               # Brand logo
│   ├── icon-192.svg           # PWA icon (192x192)
│   ├── icon-512.svg           # PWA icon (512x512)
│   ├── preview.svg            # Social sharing preview
│   ├── screenshot-mobile.svg  # Mobile PWA screenshot
│   └── screenshot-desktop.svg # Desktop PWA screenshot
│
├── scripts/                   # Development tools
│   └── optimize-model.js      # 3D model optimization guidance
│
└── .vscode/                   # Development settings
    └── settings.json
```

## ⚙️ Configuration

### Product Configuration (`src/config/xrupgrade-product.json`)

```json
{
      "product": {
      "id": "floyd_weekender",
      "name": "Floyd Weekender",
    "model": {
      "path": "public/Weekender.glb",
      "camera": {
        "distance": "2.0m",
        "target": "0m 0m 0m",
        "orbit": "0deg 75deg 2.0m"
      }
    },
    "materials": {
      "primary": "TkaninaMat",    // Main bag material
      "secondary": "KaiseviMat",  // Accent material
      "accent": "Kais"            // Strap material
    }
  },
  "colors": [
    {
      "id": "bahia_red",
      "name": "Bahia Red",
      "preview": "public/assets/bahia_red.jpg",
      "textures": {
        "primary": "public/assets/Weekender/BahiaRed_TkaninaMat_BaseColor.jpg",
        "accent": "public/assets/Weekender/BahiaRed_KaiseviMat_BaseColor.jpg",
        "roughness": "public/assets/Weekender/NonMetalic_TkaninaMat_MetRough.jpg"
      }
    }
    // ... additional colors
  ],
  "straps": [
    {
      "id": "selected",
      "name": "Match",
      "type": "dynamic"           // Matches selected color
    },
    {
      "id": "orange",
      "name": "Orange",
      "texture": "public/assets/Weekender/HotOrange_KaiseviMat_BaseColor.jpg"
    }
  ],
  "environments": [
    {
      "id": "studio",
      "name": "Studio",
      "gradient": "linear-gradient(45deg, #f8f9fa, #e9ecef)",
      "lighting": "neutral"
    }
    // ... additional environments
  ]
}
```

### Adding New Products

1. **Create new configuration file**: `src/config/your-product.json`
2. **Add 3D model**: `public/YourProduct.glb`
3. **Add textures**: `public/assets/YourProduct/`
4. **Add color swatches**: `public/assets/`
5. **Update material names** to match your 3D model
6. **Initialize configurator** with new config

```javascript
// Load custom product
const config = await fetch('src/config/your-product.json')
  .then(response => response.json());

const configurator = new XRUpgradeConfigurator(config);
await configurator.initialize('container-id');
```

## 🧩 Component System

### Core Components

#### **XRUpgradeConfigurator** (Main Application)
```javascript
class XRUpgradeConfigurator {
  constructor(config)              // Initialize with product config
  async initialize(containerId)    // Setup and render
  changeColor(colorId)            // Update product color
  changeStrap(strapId)            // Update strap configuration
  changeEnvironment(envId)        // Change background environment
  getState()                      // Get current configuration
  getShareURL()                   // Generate shareable URL
  reset()                         // Reset to defaults
  destroy()                       // Cleanup resources
}
```

#### **ConfiguratorEngine** (3D Rendering Core)
```javascript
class ConfiguratorEngine {
  constructor(config)              // Initialize with product config
  async initialize(container)      // Setup model-viewer
  async changeColor(colorId)       // Apply material changes
  async changeStrap(strapId)       // Update strap materials
  changeEnvironment(envId)         // Update scene environment
  subscribe(event, callback)       // Listen to engine events
  takeScreenshot()                 // Capture current view
  activateAR()                     // Launch AR experience
}
```

### UI Components

#### **ColorPicker**
```javascript
class ColorPicker {
  constructor(container, config, onColorChange)
  render(container)                // Render color swatches
  selectColor(colorId)            // Programmatically select color
  getCurrentColor()               // Get selected color ID
}
```

#### **StrapSelector**
```javascript
class StrapSelector {
  constructor(container, config, onStrapChange)
  render(container)               // Render strap options
  selectStrap(strapId)           // Programmatically select strap
  getCurrentStrap()              // Get selected strap ID
}
```

#### **EnvironmentSelector**
```javascript
class EnvironmentSelector {
  constructor(container, config, onEnvironmentChange)
  render(container)              // Render environment options
  selectEnvironment(envId)       // Programmatically select environment
  getCurrentEnvironment()        // Get selected environment ID
}
```

#### **ActionButtons**
```javascript
class ActionButtons {
  constructor(configurator, options)
  render(container)              // Render action buttons
  takeScreenshot()               // Capture and download image
  shareConfiguration()           // Share via Web Share API
  resetConfiguration()           // Reset to defaults
  toggleFullscreen()             // Enter/exit fullscreen
  showQRModal()                  // Show QR code for mobile
}
```

### Device Detection

```javascript
class DeviceDetection {
  static isMobile()              // Check if mobile device
  static isTablet()              // Check if tablet device
  static isDesktop()             // Check if desktop device
  static supportsAR()            // Check AR capabilities
  static supportsWebShare()      // Check Web Share API
  static getCapabilities()       // Get all device info
}
```

## 📚 API Reference

### Events System

```javascript
// Listen to configurator events
configurator.on('colorChanged', (colorId) => {
  console.log('Color changed to:', colorId);
  // Analytics tracking, etc.
});

configurator.on('strapChanged', (strapId) => {
  console.log('Strap changed to:', strapId);
});

configurator.on('environmentChanged', (envId) => {
  console.log('Environment changed to:', envId);
});

configurator.on('initialized', () => {
  console.log('Configurator ready');
});

// New events (implemented):
configurator.on('modelLoaded', (data) => {
  console.log('3D model loaded:', data.loadTime + 'ms');
});

configurator.on('error', (error) => {
  console.log('Error occurred:', error.message);
});

configurator.on('screenshotTaken', (data) => {
  console.log('Screenshot captured:', data.size + ' bytes');
});

configurator.on('arActivated', (data) => {
  console.log('AR activated:', data.device.deviceType);
});

configurator.on('idleModeChanged', (data) => {
  console.log('Idle mode:', data.idle ? 'entered' : 'exited');
  // data.idle = true when auto-rotation starts (after 1 second of inactivity)
  // data.idle = false when user interaction resumes
});

// Remove event listeners
configurator.off('colorChanged', callback);
```

### Embedding API

```javascript
// Basic embedding
const configurator = new XRUpgradeConfigurator(config);
await configurator.initialize('my-container');

// Advanced embedding with options (now fully implemented)
const configurator = await XRUpgradeConfigurator.embed('my-container', {
  configUrl: 'path/to/config.json',
  autoInit: true,
  showUI: true,
  responsive: true,
  onReady: (instance) => {
    Logger.info('Configurator ready:', instance);
  },
  onError: (error) => {
    Logger.error('Failed:', error);
  }
});

// Programmatic control
configurator.changeColor('sky_blue');
configurator.changeStrap('orange');
configurator.changeEnvironment('beach');

// Get current state
const state = configurator.getState();
// { color: 'sky_blue', strap: 'orange', environment: 'beach' }

// Generate share URL
const shareUrl = configurator.getShareURL();
// https://example.com/?color=sky_blue&strap=orange&environment=beach
```

### Health Check System

```javascript
// Run comprehensive system diagnostics
const healthResults = await window.healthCheck();
console.log('System status:', healthResults.status);

// Check specific issues
if (healthResults.status !== 'healthy') {
  console.log('Issues found:', healthResults.checks);
}
```

### URL Parameters

The configurator supports URL parameters for deep linking:

```
https://your-domain.com/?color=sky_blue&strap=orange&env=beach&ar=true
```

Parameters:
- `color`: Color ID from configuration
- `strap`: Strap ID from configuration  
- `env`: Environment ID from configuration
- `ar`: Set to `true` to auto-activate AR mode on mobile devices

## 🛠️ Development Guide

### Development Setup

```bash
# Install dependencies
npm install

# Start development server with live reload
npm run dev

# Alternative: use your preferred server
python3 -m http.server 8080 --bind 0.0.0.0  # Network accessible
php -S localhost:8080                        # PHP server
```

### Debug Tools

#### **Mobile Debug Mode**
For testing mobile-specific functionality on desktop:
```bash
# Open mobile debug interface
open debug-mobile.html
```
- Forces mobile UI layout on desktop
- Provides debug information overlay
- Useful for testing mobile carousel and touch interactions

### Adding New Features

#### **1. New Color Option**
```json
// Add to config/xrupgrade-weekender.json
{
  "id": "new_color",
  "name": "New Color",
  "preview": "public/assets/new_color.jpg",
  "textures": {
    "primary": "public/assets/Weekender/NewColor_TkaninaMat_BaseColor.jpg",
    "accent": "public/assets/Weekender/NewColor_KaiseviMat_BaseColor.jpg",
    "roughness": "public/assets/Weekender/NonMetalic_TkaninaMat_MetRough.jpg"
  }
}
```

#### **2. New UI Component**
```javascript
// src/components/ui/NewComponent.js
export class NewComponent {
  constructor(container, config, onChange) {
    this.container = container;
    this.config = config;
    this.onChange = onChange;
  }

  render(container = null) {
    const targetContainer = container || this.container;
    // Render component HTML
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Add event handlers
  }
}

// Add to XRUpgradeConfigurator.js
import { NewComponent } from './components/ui/NewComponent.js';

// In constructor:
this.newComponent = new NewComponent(null, this.config, (value) => {
  // Handle change
});
```

### Idle Rotation System
The configurator includes an intelligent idle detection system that provides engaging visual feedback when users aren't actively interacting:

- **Automatic Detection**: Monitors user interactions (camera movement, clicks, touches, color changes)
- **Configurable Timing**: 1-second inactivity threshold for automatic rotation
- **Smooth Transitions**: Elegant 30°/second rotation speed
- **Smart Interruption**: Instantly stops rotation when user resumes interaction
- **Event Notifications**: `idleModeChanged` events for custom logic

## 🎯 Production Optimization

### 3D Model Optimization
The 20MB Weekender.glb model can be significantly optimized for production:

```bash
# Get optimization guidance and analysis
npm run optimize-model

# Install optimization tool (if not already installed)
npm install -g gltf-pipeline

# Create optimized version (50-70% size reduction)
gltf-pipeline -i public/Weekender.glb -o public/Weekender-optimized.glb --draco.compressionLevel 10
```

**Benefits of optimization:**
- 🎯 **50-70% size reduction** (20MB → 8-12MB)
- 🚀 **Faster loading times** especially on mobile
- 📱 **Better mobile performance** and battery life
- 💾 **Progressive enhancement** with automatic fallback

### Progressive Loading
The configurator automatically uses optimized models when available:
- Tries `Weekender-optimized.glb` first
- Falls back to `Weekender.glb` if optimized version doesn't exist
- No code changes required - just add the optimized file

### Production Fixes Applied
Recent production optimizations include:
- ✅ **Clean logging** - No console spam in production
- ✅ **Complete PWA assets** - All icons and screenshots included
- ✅ **Smart model loading** - Progressive enhancement system
- ✅ **Enhanced caching** - Better Service Worker strategies

See `PRODUCTION_FIXES.md` for detailed information.

## 🚀 Deployment

### Static Hosting (Recommended)

#### **Netlify**
```bash
# Build for production
npm run build

# Deploy to Netlify
# 1. Drag and drop entire folder to Netlify
# 2. Or connect Git repository for auto-deploy
```

## ⚡ Performance Optimization

### Texture Caching System
The configurator includes an intelligent texture preloading and caching system to ensure instant color changes:

- **Smart Preloading**: Textures are loaded in the background after the 3D model loads
- **Memory Caching**: Loaded textures are cached in memory for instant reuse
- **Progressive Loading**: Current color loads first, followed by other colors
- **Visual Feedback**: Progress indicator shows texture optimization status

### Network Performance
- **CDN Optimized**: All assets are optimized for CDN delivery
- **Texture Compression**: High-quality JPEG textures (~1MB each)
- **Lazy Loading**: Non-critical textures load on demand
- **Error Handling**: Graceful fallbacks for network issues

### Browser Performance
- **WebGL Acceleration**: Hardware-accelerated 3D rendering
- **Memory Management**: Efficient texture and material handling
- **Event Debouncing**: Prevents UI lag during rapid interactions
- **Resource Cleanup**: Proper cleanup of 3D resources

### Deployment Tips
1. **Enable Gzip/Brotli** compression on your hosting platform
2. **Set cache headers** for static assets (textures, models)
3. **Use a CDN** for global asset delivery
4. **Monitor Core Web Vitals** with browser dev tools

## 🔧 Troubleshooting

### Common Issues

#### **Model Not Loading**
- Check that the model file path in configuration is correct
- Verify the GLB file is accessible via HTTP
- Ensure model-viewer library is loaded properly
- Check browser console for specific error messages

#### **Materials Not Changing**
- Verify material names in configuration match the 3D model
- Check that texture files are accessible
- Ensure all required texture paths are specified in color configuration

#### **Mobile AR Not Working**
- Ensure HTTPS deployment (required for AR)
- Test on physical iOS (12+) or Android (7.0+) devices
- Verify QR code contains `ar=true` parameter
- Check browser console for specific error messages
- Ensure model is fully loaded before AR activation

#### **WebXR Permissions Warnings**
If you see console warnings like:
```
[Violation] Permissions policy violation: xr-spatial-tracking is not allowed
```
This is **normal for local development**:
- **Development**: Warnings are harmless, AR falls back to Scene Viewer
- **Production**: Deploy with HTTPS and proper headers (already configured)
- **Headers**: Permissions policy headers are included in both HTML files
- **Functionality**: App works correctly despite these warnings

#### **Performance Issues**
- Use health check to monitor system performance
- Check model file size (large models affect loading time)
- Verify texture compression and optimization
- Monitor memory usage in browser developer tools

### AR Functionality

The configurator includes robust AR support for mobile devices:

**QR Code Workflow:**
1. Desktop users click the AR button to generate a QR code
2. Mobile users scan the QR code or open the generated URL
3. AR automatically activates on compatible mobile devices
4. Fallback button appears if user interaction is required

**AR Requirements:**
- HTTPS connection (required for security)
- iOS 12+ with Safari or Android 7.0+ with Chrome
- Physical device (simulators don't support AR)

**URL Parameters:**
- `?ar=true` - Auto-activate AR on mobile devices
- `?color=red&ar=true` - Load specific configuration in AR

### Health Check System

```javascript
// Run comprehensive system diagnostics
const healthResults = await window.healthCheck();
console.log('System status:', healthResults.status);

// Check specific issues
if (healthResults.status !== 'healthy') {
  console.log('Issues found:', healthResults.checks);
}
```

### Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebGL | 76+ | 70+ | 12+ | 79+ |
| Model-Viewer | 76+ | 70+ | 12+ | 79+ |
| AR (iOS) | N/A | N/A | 12+ | N/A |
| AR (Android) | 76+ | N/A | N/A | 79+ |
| Web Share | 89+ | 93+ | 14+ | 93+ |

---

## 📞 Support & Contributing

### Getting Help
1. Check console for error messages
2. Verify all assets are accessible
3. Test on different devices/browsers
4. Review configuration file syntax

### Contributing
1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Follow existing code style and patterns
4. Test across browsers and devices
5. Submit pull request with detailed description

---

**Built with ❤️ for XRUpgrade** | Version 2.0.2 | [License: MIT](LICENSE) 

## ✨ Features

- **3D Product Visualization** - Interactive Weekender bag configurator
- **Real-time Customization** - Instant color, strap, and environment changes
- **Texture Caching & Preloading** - Smart texture management for instant color changes
- **Idle Rotation** - Automatic model rotation when user is inactive (1 second)
- **Augmented Reality** - Native AR support on compatible devices
- **Responsive Design** - Optimized for desktop, tablet, and mobile
- **Performance Optimized** - 28KB bundle, ~9MB total (including 3D model)
- **Modern Architecture** - ES6 modules, event-driven, dependency-free 
