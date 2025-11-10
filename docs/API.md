# 📚 API Documentation

## Overview

The XRUpgrade Product Configurator provides a comprehensive JavaScript API for embedding, controlling, and extending the 3D product configurator. This document covers all public interfaces, events, and integration patterns.

> **Note on Logging**: All examples in this documentation use `Logger.info()`, `Logger.error()`, etc. from the built-in Logger utility instead of `console.log()` for production-ready logging. Import Logger from `'./src/utils/Logger.js'` to use it.

## Table of Contents

- [Getting Started](#getting-started)
- [Core API](#core-api)
- [Events API](#events-api)
- [Configuration API](#configuration-api)
- [Integration Patterns](#integration-patterns)
- [Error Handling](#error-handling)
- [TypeScript Definitions](#typescript-definitions)

## Getting Started

### Basic Usage

```javascript
// Import the configurator
import { XRUpgradeConfigurator } from './src/XRUpgradeConfigurator.js';

// Load configuration
const config = await fetch('src/config/floyd-weekender.json')
  .then(response => response.json());

// Create and initialize configurator
const configurator = new XRUpgradeConfigurator(config);
await configurator.initialize('my-container');

// Listen to changes
configurator.on('colorChanged', (colorId) => {
  console.log('Color changed to:', colorId);
});

// Control programmatically
configurator.changeColor('sky_blue');
```

### Embedding API

```javascript
// Simple embedding
const configurator = await XRUpgradeConfigurator.embed('container-id', {
  configUrl: 'path/to/config.json'
});

// Advanced embedding with full options support
const configurator = await XRUpgradeConfigurator.embed('container-id', {
  configUrl: 'path/to/config.json',
  autoInit: true,
  showUI: true,
  responsive: true,
  onReady: (instance) => {
    Logger.info('Configurator ready:', instance);
  },
  onError: (error) => {
    Logger.error('Failed to initialize:', error);
  }
});
```

## Core API

### XRUpgradeConfigurator Class

#### Constructor

```javascript
new XRUpgradeConfigurator(config)
```

**Parameters:**
- `config` (Object): Product configuration object

**Example:**
```javascript
const configurator = new XRUpgradeConfigurator({
  product: { /* product definition */ },
  colors: [ /* color options */ ],
  straps: [ /* strap options */ ],
  environments: [ /* environment options */ ],
  defaultColor: "bahia_red",
  defaultStrap: "selected",
  defaultEnvironment: "studio"
});
```

#### Methods

##### `initialize(containerId)`

Initializes the configurator and renders it into the specified container.

```javascript
async initialize(containerId: string): Promise<void>
```

**Parameters:**
- `containerId` (string): DOM element ID or element reference

**Returns:** Promise that resolves when initialization is complete

**Example:**
```javascript
await configurator.initialize('my-container');
```

##### `changeColor(colorId)`

Changes the product color.

```javascript
changeColor(colorId: string): void
```

**Parameters:**
- `colorId` (string): Color ID from configuration

**Example:**
```javascript
configurator.changeColor('bahia_red');
```

##### `changeStrap(strapId)`

Changes the strap configuration.

```javascript
changeStrap(strapId: string): void
```

**Parameters:**
- `strapId` (string): Strap ID from configuration ('selected' or 'orange')

**Example:**
```javascript
configurator.changeStrap('orange');
```

##### `changeEnvironment(environmentId)`

Changes the background environment.

```javascript
changeEnvironment(environmentId: string): void
```

**Parameters:**
- `environmentId` (string): Environment ID from configuration

**Example:**
```javascript
configurator.changeEnvironment('beach');
```

##### `getState()`

Returns the current configuration state.

```javascript
getState(): ConfigurationState
```

**Returns:**
```typescript
interface ConfigurationState {
  color: string;
  strap: string;
  environment: string;
}
```

**Example:**
```javascript
const state = configurator.getState();
// { color: 'sky_blue', strap: 'selected', environment: 'studio' }
```

##### `getShareURL()`

Generates a shareable URL with current configuration (delegated to engine).

```javascript
getShareURL(): string
```

**Returns:** URL string with configuration parameters

**Example:**
```javascript
const url = configurator.getShareURL();
// "https://example.com/?color=sky_blue&strap=orange&environment=beach"
```

##### `reset()`

Resets configuration to default values.

```javascript
reset(): void
```

**Example:**
```javascript
configurator.reset();
```

##### `takeScreenshot()`

Captures a screenshot of the current 3D view (delegated to engine).

```javascript
async takeScreenshot(): Promise<string>
```

**Returns:** Promise resolving to base64 data URL

**Example:**
```javascript
const dataUrl = await configurator.takeScreenshot();
// Use dataUrl for download or display
```

##### `activateAR()`

Activates augmented reality mode (delegated to engine, mobile only).

```javascript
activateAR(): void
```

**Example:**
```javascript
if (DeviceDetection.isMobile()) {
  configurator.activateAR();
}
```

##### `destroy()`

Cleanly destroys the configurator and frees resources.

```javascript
destroy(): void
```

**Example:**
```javascript
configurator.destroy();
```

#### Static Methods

##### `XRUpgradeConfigurator.embed()`

Static method for easy embedding.

```javascript
static async embed(containerId: string, options: EmbedOptions): Promise<XRUpgradeConfigurator>
```

**Parameters:**
```typescript
interface EmbedOptions {
  configUrl?: string;           // URL to configuration JSON (default: 'src/config/floyd-weekender.json')
  config?: Configuration;       // Direct configuration object (alternative to configUrl)
  autoInit?: boolean;           // Auto-initialize (default: true)
  showUI?: boolean;             // Show UI components (default: true)
  responsive?: boolean;         // Enable responsive design (default: true)
  onReady?: (instance: XRUpgradeConfigurator) => void; // Callback when ready
  onError?: (error: Error) => void;    // Error callback
}
```

**Example:**
```javascript
const configurator = await XRUpgradeConfigurator.embed('container', {
  configUrl: 'config/product.json',
  autoInit: true,
  showUI: true,
  responsive: true,
  onReady: (instance) => console.log('Ready!'),
  onError: (error) => console.error('Failed:', error)
});
```

## Events API

### Event System

The configurator uses an event-driven architecture. You can listen to various events and respond accordingly.

#### `on(event, callback)`

Subscribes to an event (delegates to engine.subscribe).

```javascript
on(event: string, callback: Function): void
```

#### `off(event, callback)`

Unsubscribes from an event (delegates to engine.unsubscribe).

```javascript
off(event: string, callback: Function): void
```

### Available Events

#### `initialized`

Fired when the configurator is fully initialized.

```javascript
configurator.on('initialized', (data) => {
  console.log('Configurator ready:', data);
});
```

**Event Data:**
```typescript
{
  engine: ConfiguratorEngine;
}
```

#### `colorChanged`

Fired when the color is changed.

```javascript
configurator.on('colorChanged', (colorId) => {
  console.log('Color changed to:', colorId);
  // Track analytics, update UI, etc.
});
```

**Event Data:** `string` - The new color ID

#### `strapChanged`

Fired when the strap configuration is changed.

```javascript
configurator.on('strapChanged', (strapId) => {
  console.log('Strap changed to:', strapId);
});
```

**Event Data:** `string` - The new strap ID

#### `environmentChanged`

Fired when the environment is changed.

```javascript
configurator.on('environmentChanged', (environmentId) => {
  console.log('Environment changed to:', environmentId);
});
```

**Event Data:** `string` - The new environment ID

#### `reset`

Fired when the configuration is reset to defaults.

```javascript
configurator.on('reset', (state) => {
  console.log('Configuration reset:', state);
});
```

**Event Data:** Current configuration state object

#### `modelLoaded`

Fired when the 3D model finishes loading.

```javascript
configurator.on('modelLoaded', (modelData) => {
  console.log('3D model loaded:', modelData);
});
```

**Event Data:**
```typescript
{
  model: Model;
  loadTime: number;
  fileSize: number;
}
```

#### `error`

Fired when an error occurs.

```javascript
configurator.on('error', (error) => {
  console.error('Configurator error:', error);
  // Handle error, show user message, etc.
});
```

**Event Data:**
```typescript
{
  type: 'network' | 'webgl' | 'configuration' | 'user';
  message: string;
  details: any;
  timestamp: number;
}
```

#### `screenshotTaken`

Fired when a screenshot is captured.

```javascript
configurator.on('screenshotTaken', (data) => {
  console.log('Screenshot captured:', data.size, 'bytes');
});
```

**Event Data:**
```typescript
{
  dataUrl: string;
  size: number;
  timestamp: number;
}
```

#### `arActivated`

Fired when AR mode is activated.

```javascript
configurator.on('arActivated', (data) => {
  console.log('AR mode activated:', data);
});
```

**Event Data:**
```typescript
{
  timestamp: number;
  device: DeviceCapabilities;
}
```

## Configuration API

### Configuration Schema

The configurator uses JSON configuration files that define product properties, materials, and options.

#### Root Configuration

```typescript
interface Configuration {
  product: ProductDefinition;
  defaultColor: string;
  defaultStrap: string;
  defaultEnvironment: string;
  colors: ColorOption[];
  straps: StrapOption[];
  environments: EnvironmentOption[];
  ui?: UIConfiguration;
  defaults: DefaultValues;
}
```

#### Product Definition

```typescript
interface ProductDefinition {
  id: string;
  name: string;
  model: {
    path: string;           // Path to GLB/GLTF file
    camera: {
      distance: string;     // Camera distance (e.g., "2.0m")
      target: string;       // Camera target (e.g., "0m 0m 0m")
      orbit: string;        // Camera orbit (e.g., "0deg 75deg 2.0m")
    };
  };
  materials: {
    primary: string;        // Primary material name in 3D model
    secondary: string;      // Secondary material name
    accent: string;         // Accent material name
  };
}
```

#### Color Option

```typescript
interface ColorOption {
  id: string;              // Unique color identifier
  name: string;            // Display name
  preview: string;         // Preview image path
  textures: {
    primary: string;       // Primary material texture path
    accent: string;        // Accent material texture path
    roughness: string;     // Roughness/metallic texture path
  };
}
```

#### Strap Option

```typescript
interface StrapOption {
  id: string;              // 'selected' or 'orange'
  name: string;            // Display name
  type?: 'dynamic';        // Dynamic type matches color
  texture?: string;        // Fixed texture path
  cssClass: string;        // CSS class for styling
}
```

#### Environment Option

```typescript
interface EnvironmentOption {
  id: string;              // Unique environment identifier
  name: string;            // Display name
  gradient: string;        // CSS gradient for preview
  background: string;      // CSS background for scene
  lighting: 'neutral' | 'warm' | 'cool';
}
```

#### UI Configuration

```typescript
interface UIConfiguration {
  theme: string;           // UI theme ('glass')
  animations: {
    desktop: string;       // Animation level for desktop
    mobile: string;        // Animation level for mobile
  };
  features: string[];      // Enabled features array
}
```

#### Default Values

```typescript
interface DefaultValues {
  color: string;           // Default color ID
  strap: string;           // Default strap ID
  environment: string;     // Default environment ID
}
```

### Configuration Access

```javascript
// Access individual defaults
const defaultColor = config.defaultColor;
const defaultStrap = config.defaultStrap;
const defaultEnvironment = config.defaultEnvironment;

// Access defaults object
const defaults = config.defaults;
```

## Integration Patterns

### E-commerce Integration

```javascript
// Integrate with shopping cart
configurator.on('colorChanged', (colorId) => {
  // Update product SKU
  const color = config.colors.find(c => c.id === colorId);
  updateProductSKU(`WEEKENDER-${colorId.toUpperCase()}`);
});

// Add to cart with configuration
function addToCart() {
  const state = configurator.getState();
  const shareUrl = configurator.getShareURL();
  
  cartAPI.addItem({
    productId: 'floyd-weekender',
    configuration: state,
    previewUrl: shareUrl,
    customization: {
      color: state.color,
      strap: state.strap
    }
  });
}
```

### Analytics Integration

```javascript
// Google Analytics 4
configurator.on('colorChanged', (colorId) => {
  gtag('event', 'product_customize', {
    event_category: 'configurator',
    event_label: 'color_change',
    custom_parameters: {
      color_id: colorId,
      product_id: 'floyd-weekender'
    }
  });
});

// Custom analytics
const events = ['colorChanged', 'strapChanged', 'environmentChanged', 'reset'];
events.forEach(eventName => {
  configurator.on(eventName, (data) => {
    analytics.track('configurator_interaction', {
      event: eventName,
      data: data,
      timestamp: Date.now(),
      session_id: getSessionId()
    });
  });
});
```

## Error Handling

### Error Types

The configurator handles errors gracefully with console logging and fallback behavior.

### Error Recovery

```javascript
// Basic error handling
try {
  const configurator = new XRUpgradeConfigurator(config);
  await configurator.initialize('container');
} catch (error) {
  console.error('Failed to initialize configurator:', error);
  // Implement fallback behavior
  showStaticProductImages();
}
```

## TypeScript Definitions

The configurator now includes comprehensive TypeScript definitions located at `src/types/index.d.ts`.

### Basic Interface Definitions

```typescript
declare module 'xrupgrade-configurator' {
  export interface ConfigurationState {
    color: string;
    strap: string;
    environment: string;
  }

  export interface DeviceCapabilities {
    deviceType: 'mobile' | 'tablet' | 'desktop';
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    supportsAR: boolean;
    supportsWebShare: boolean;
    supportsFullscreen: boolean;
  }

  export interface EmbedOptions {
    configUrl?: string;
  }

  export class XRUpgradeConfigurator {
    constructor(config: any);
    
    // Core methods
    initialize(containerId: string): Promise<void>;
    changeColor(colorId: string): void;
    changeStrap(strapId: string): void;
    changeEnvironment(environmentId: string): void;
    getState(): ConfigurationState;
    getShareURL(): string;
    reset(): void;
    takeScreenshot(): Promise<string>;
    activateAR(): void;
    destroy(): void;
    
    // Event methods
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    
    // Static methods
    static embed(containerId: string, options: EmbedOptions): Promise<XRUpgradeConfigurator>;
  }

  export class DeviceDetection {
    static isMobile(): boolean;
    static isTablet(): boolean;
    static isDesktop(): boolean;
    static supportsAR(): boolean;
    static supportsWebShare(): boolean;
    static supportsFullscreen(): boolean;
    static getCapabilities(): DeviceCapabilities;
  }
}
```

## Performance Considerations

### Lazy Loading

```javascript
// Only load configurator when needed
const loadConfigurator = async () => {
  const { XRUpgradeConfigurator } = await import('./src/XRUpgradeConfigurator.js');
  const config = await fetch('config.json').then(r => r.json());
  return new XRUpgradeConfigurator(config);
};

// Load on user interaction
document.getElementById('customize-button').addEventListener('click', async () => {
  const configurator = await loadConfigurator();
  await configurator.initialize('configurator-container');
});
```

### Resource Management

```javascript
// Cleanup when component unmounts
const configurator = new XRUpgradeConfigurator(config);

// In React useEffect cleanup
useEffect(() => {
  configurator.initialize('container');
  
  return () => {
    configurator.destroy(); // Important: cleanup resources
  };
}, []);
```

---

This API documentation reflects the current implementation of the XRUpgrade Product Configurator. 