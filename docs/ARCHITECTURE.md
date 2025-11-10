# 🏗️ Architecture Documentation

## Overview

The XRUpgrade Product Configurator is built using a modular, event-driven architecture that prioritizes performance, maintainability, and extensibility. This document provides a deep dive into the architectural decisions and patterns used throughout the application.

## Core Architectural Principles

### 1. Modular Design
- **Separation of Concerns**: Each module has a single responsibility
- **Loose Coupling**: Components communicate through well-defined interfaces
- **High Cohesion**: Related functionality is grouped together
- **Dependency Injection**: Dependencies are passed in rather than created internally

### 2. Configuration-Driven Development
- **Data-Driven**: Product configurations stored in JSON files
- **Runtime Flexibility**: Easy to change products without code changes
- **Version Control**: Configurations can be versioned and deployed independently
- **Multi-Product Support**: Single codebase supports multiple product types

### 3. Event-Driven Communication
- **Publisher-Subscriber Pattern**: Components communicate via events
- **Loose Coupling**: Components don't need direct references to each other
- **Extensibility**: New features can listen to existing events
- **Debugging**: Event flow is traceable and logged

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser Environment                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────── │
│  │   User Input    │    │   URL Params    │    │   Local       │
│  │   (Touch/Click) │    │   (Deep Links)  │    │   Storage     │
│  └─────────────────┘    └─────────────────┘    └─────────────── │
├─────────────────────────────────────────────────────────────────┤
│                    Application Layer                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              XRUpgradeConfigurator (Main Controller)            │ │
│  │  • Initialization & Setup                                  │ │
│  │  • Component Orchestration                                 │ │
│  │  • Event Coordination                                      │ │
│  │  • State Management                                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                     Component Layer                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   UI Components │  │  Core Engine    │  │    Utilities   │  │
│  │                 │  │                 │  │                 │  │
│  │ • ColorPicker   │  │ • ConfigEngine  │  │ • DeviceDetect  │  │
│  │ • StrapSelector │  │ • Material Mgmt │  │ • EventSystem   │  │
│  │ • EnvSelector   │  │ • 3D Rendering  │  │ • URL Utils     │  │
│  │ • ActionButtons │  │ • AR Integration│  │ • Performance   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                     External Dependencies                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Google Model-   │  │     Browser     │  │     WebGL       │  │
│  │     Viewer      │  │      APIs       │  │    Rendering    │  │
│  │                 │  │                 │  │                 │  │
│  │ • 3D Rendering  │  │ • Web Share     │  │ • GPU Accel.   │  │
│  │ • AR Support    │  │ • Fullscreen    │  │ • Material      │  │
│  │ • Camera Ctrl   │  │ • File System   │  │   Rendering     │  │
│  │ • Material Sys  │  │ • Clipboard     │  │ • Texture Mgmt  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Core Components

#### XRUpgradeConfigurator (Application Controller)
**Responsibility**: Main application orchestrator and public API

```javascript
class XRUpgradeConfigurator {
  // Core responsibilities:
  // 1. Application lifecycle management
  // 2. Component initialization and coordination
  // 3. Event routing and state management
  // 4. Public API surface
  // 5. Error handling and recovery
}
```

**Key Design Patterns**:
- **Facade Pattern**: Simplifies complex subsystem interactions
- **Factory Pattern**: Creates and configures components
- **Observer Pattern**: Manages event subscriptions
- **State Machine**: Manages application lifecycle states

#### ConfiguratorEngine (3D Rendering Core)
**Responsibility**: 3D model management and WebGL operations

```javascript
class ConfiguratorEngine {
  // Core responsibilities:
  // 1. Model-viewer integration
  // 2. Material and texture management
  // 3. 3D scene manipulation
  // 4. AR functionality
  // 5. Performance optimization
}
```

**Key Design Patterns**:
- **Command Pattern**: Material change operations
- **Strategy Pattern**: Different rendering strategies
- **Proxy Pattern**: Model-viewer API abstraction
- **Chain of Responsibility**: Error handling pipeline

### UI Components

#### Component Base Pattern
All UI components follow a consistent pattern:

```javascript
class UIComponent {
  constructor(container, config, onChange) {
    this.container = container;        // DOM container
    this.config = config;             // Configuration data
    this.onChange = onChange;         // Change callback
  }

  render(container = null) {
    // Render component HTML
    // Setup event listeners
    // Apply initial state
  }

  setupEventListeners() {
    // Attach event handlers
    // Implement interaction logic
  }

  destroy() {
    // Cleanup event listeners
    // Remove DOM elements
  }
}
```

**Benefits**:
- **Consistency**: All components behave similarly
- **Testability**: Clear interfaces for testing
- **Reusability**: Components can be used in different contexts
- **Maintainability**: Standard structure for all UI code

## Data Flow Architecture

### Configuration Flow
```
JSON Config → Validation → Object Model → Component Initialization
     ↓              ↓            ↓              ↓
File System → Schema Check → Data Structure → UI Rendering
```

### User Interaction Flow
```
User Input → Event Capture → Component Handler → State Update → Visual Feedback
     ↓             ↓              ↓              ↓              ↓
Touch/Click → addEventListener → onChange() → Engine Update → Material Change
```

### State Management Flow
```
State Change → Event Emission → Listener Notification → Component Update → DOM Sync
     ↓              ↓                  ↓                    ↓              ↓
Internal → notifyListeners() → on('event') → render() → DOM Manipulation
```

## Material System Architecture

### Material Mapping Strategy
The application uses a flexible material mapping system that separates logical materials from physical 3D model materials:

```javascript
// Configuration mapping
{
  "materials": {
    "primary": "TkaninaMat",      // Maps to actual material in 3D model
    "secondary": "KaiseviMat",    // Allows configuration flexibility
    "accent": "Kais"              // 3D model can change without code changes
  }
}
```

### Texture Management
```
Texture Request → Cache Check → Network Load → GPU Upload → Material Apply
      ↓              ↓             ↓             ↓             ↓
colorChange() → Map Lookup → fetch() → WebGL → setTexture()
```

## Performance Architecture

### Loading Strategy
1. **Critical Path**: HTML → CSS → JavaScript → Model-Viewer Library
2. **Deferred Loading**: 3D Model → Initial Textures → Additional Textures
3. **Lazy Loading**: Material textures loaded on demand
4. **Progressive Enhancement**: Basic functionality without 3D model

### Memory Management
- **Texture Caching**: Reuse loaded textures
- **Component Cleanup**: Proper event listener removal
- **Model Optimization**: Efficient 3D model format (GLB)
- **Resource Pooling**: Reuse expensive objects

### Rendering Optimization
- **Viewport Culling**: Only render visible elements
- **Level of Detail**: Different quality for different devices
- **Texture Compression**: Optimized texture formats
- **GPU Acceleration**: Hardware-accelerated 3D rendering

## Device Adaptation Architecture

### Responsive Strategy
```javascript
Device Detection → Component Selection → Layout Adaptation → Feature Enabling
      ↓                    ↓                  ↓                    ↓
isMobile() → MobileComponents → Mobile CSS → Touch Events
```

### Feature Detection
- **WebGL Support**: Check before initializing 3D
- **AR Capabilities**: Enable AR features conditionally
- **Touch Support**: Adapt interaction patterns
- **Performance Tiers**: Adjust quality based on device

## Error Handling Architecture

### Error Categories
1. **Network Errors**: Failed asset loading
2. **WebGL Errors**: Graphics initialization failures
3. **Configuration Errors**: Invalid JSON or missing assets
4. **User Errors**: Invalid interactions or unsupported features

### Error Recovery Strategy
```
Error Detection → Error Classification → Recovery Attempt → User Notification
      ↓                   ↓                   ↓                ↓
try/catch → Error Type → Fallback → UI Message
```

### Graceful Degradation
- **No JavaScript**: Static fallback content
- **No WebGL**: 2D image fallback
- **No AR**: Desktop experience
- **Slow Network**: Progressive loading with feedback

## Security Architecture

### Input Validation
- **Configuration Validation**: Schema validation for JSON configs
- **URL Parameter Sanitization**: Prevent XSS through URL params
- **Asset URL Validation**: Prevent loading from unauthorized sources
- **CORS Compliance**: Proper cross-origin resource handling

### Content Security Policy
```
default-src 'self';
script-src 'self' 'unsafe-inline' unpkg.com;
style-src 'self' 'unsafe-inline' fonts.googleapis.com;
img-src 'self' data:;
model-src 'self';
```

## Deployment Architecture

### Static Asset Strategy
- **HTML/CSS/JS**: Versioned and cached
- **3D Models**: Long-term cached with ETags
- **Textures**: CDN distribution with compression
- **Configuration**: Environment-specific deployment

### CDN Integration
```
Origin Server → CDN Edge → Browser Cache → Application
     ↓             ↓            ↓             ↓
Static Files → Global Dist → Local Cache → Fast Loading
```

## Extension Points

### Adding New Products
1. Create product configuration JSON
2. Add 3D model and textures
3. Map materials to configuration
4. No code changes required

### Adding New UI Components
1. Extend base component pattern
2. Implement required interface methods
3. Register with main configurator
4. Add to appropriate layout

### Adding New Features
1. Define event interfaces
2. Implement feature logic
3. Subscribe to relevant events
4. Emit new events for integration

## Testing Architecture

### Testing Strategy
- **Unit Tests**: Individual component testing
- **Integration Tests**: Component interaction testing
- **End-to-End Tests**: Full user workflow testing
- **Performance Tests**: Loading and rendering performance
- **Device Tests**: Cross-device compatibility

### Testable Patterns
- **Dependency Injection**: Easy to mock dependencies
- **Event-Driven**: Easy to test component interactions
- **Pure Functions**: Predictable input/output testing
- **Configuration-Driven**: Easy to test different scenarios

## Future Architecture Considerations

### Scalability
- **Multi-Product Support**: Architecture supports multiple products
- **Internationalization**: Text externalization ready
- **A/B Testing**: Event system supports experimentation
- **Analytics Integration**: Comprehensive event tracking

### Performance Enhancements
- **Service Workers**: Offline functionality
- **Web Workers**: Background processing
- **WebAssembly**: Performance-critical operations
- **Streaming**: Progressive model loading

### Feature Additions
- **Real-time Collaboration**: Multi-user configuration
- **Cloud Save**: Configuration persistence
- **Advanced AR**: Hand tracking, occlusion
- **AI Integration**: Smart recommendations

---

This architecture provides a solid foundation for current needs while maintaining flexibility for future enhancements and scaling requirements. 