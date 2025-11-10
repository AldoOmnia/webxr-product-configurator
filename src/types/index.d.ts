// TypeScript definitions for XRUpgrade Product Configurator
// Version: 2.0.2

declare module 'xrupgrade-configurator' {
  // Core Configuration Interfaces
  export interface ProductDefinition {
    id: string;
    name: string;
    model: {
      path: string;
      camera: {
        distance: string;
        target: string;
        orbit: string;
      };
    };
    materials: {
      primary: string;
      secondary: string;
      accent: string;
    };
  }

  export interface ColorOption {
    id: string;
    name: string;
    preview: string;
    textures: {
      primary: string;
      accent: string;
      roughness: string;
    };
  }

  export interface StrapOption {
    id: string;
    name: string;
    type?: 'dynamic';
    texture?: string;
    cssClass: string;
  }

  export interface EnvironmentOption {
    id: string;
    name: string;
    gradient: string;
    background: string;
    lighting: 'neutral' | 'warm' | 'cool';
  }

  export interface UIConfiguration {
    theme: string;
    animations: {
      desktop: string;
      mobile: string;
    };
    features: string[];
  }

  export interface DefaultValues {
    color: string;
    strap: string;
    environment: string;
  }

  export interface Configuration {
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

  // State and Event Interfaces
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

  // Event Data Interfaces
  export interface ModelLoadedEvent {
    model: any;
    loadTime: number;
    fileSize: number;
  }

  export interface ErrorEvent {
    type: 'network' | 'webgl' | 'configuration' | 'user';
    message: string;
    details: any;
    timestamp: number;
  }

  export interface ScreenshotEvent {
    dataUrl: string;
    size: number;
    timestamp: number;
  }

  export interface ARActivatedEvent {
    timestamp: number;
    device: DeviceCapabilities;
  }

  // Embed Options Interface
  export interface EmbedOptions {
    configUrl?: string;
    config?: Configuration;
    autoInit?: boolean;
    showUI?: boolean;
    responsive?: boolean;
    onReady?: (instance: XRUpgradeConfigurator) => void;
    onError?: (error: Error) => void;
  }

  // Event Callback Types
  export type EventCallback<T = any> = (data: T) => void;

  // Main Classes
  export class XRUpgradeConfigurator {
    constructor(config: Configuration);

    // Core Methods
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

    // Event Methods
    on(event: 'initialized', callback: EventCallback<{ engine: ConfiguratorEngine }>): void;
    on(event: 'colorChanged', callback: EventCallback<string>): void;
    on(event: 'strapChanged', callback: EventCallback<string>): void;
    on(event: 'environmentChanged', callback: EventCallback<string>): void;
    on(event: 'modelLoaded', callback: EventCallback<ModelLoadedEvent>): void;
    on(event: 'error', callback: EventCallback<ErrorEvent>): void;
    on(event: 'screenshotTaken', callback: EventCallback<ScreenshotEvent>): void;
    on(event: 'arActivated', callback: EventCallback<ARActivatedEvent>): void;
    on(event: 'reset', callback: EventCallback<ConfigurationState>): void;
    on(event: string, callback: EventCallback): void;

    off(event: 'initialized', callback: EventCallback<{ engine: ConfiguratorEngine }>): void;
    off(event: 'colorChanged', callback: EventCallback<string>): void;
    off(event: 'strapChanged', callback: EventCallback<string>): void;
    off(event: 'environmentChanged', callback: EventCallback<string>): void;
    off(event: 'modelLoaded', callback: EventCallback<ModelLoadedEvent>): void;
    off(event: 'error', callback: EventCallback<ErrorEvent>): void;
    off(event: 'screenshotTaken', callback: EventCallback<ScreenshotEvent>): void;
    off(event: 'arActivated', callback: EventCallback<ARActivatedEvent>): void;
    off(event: 'reset', callback: EventCallback<ConfigurationState>): void;
    off(event: string, callback: EventCallback): void;

    // Static Methods
    static embed(containerId: string, options?: EmbedOptions): Promise<XRUpgradeConfigurator | null>;
  }

  export class ConfiguratorEngine {
    constructor(config: Configuration);

    initialize(container: HTMLElement): Promise<void>;
    changeColor(colorId: string): Promise<void>;
    changeStrap(strapId: string): Promise<void>;
    changeEnvironment(environmentId: string): void;
    getState(): ConfigurationState;
    getShareURL(): string;
    takeScreenshot(): Promise<string>;
    activateAR(): void;
    reset(): void;
    subscribe(event: string, callback: EventCallback): void;
    unsubscribe(event: string, callback: EventCallback): void;
  }

  export class DeviceDetection {
    static isMobile(): boolean;
    static isTablet(): boolean;
    static isDesktop(): boolean;
    static isiOS(): boolean;
    static supportsAR(): boolean;
    static supportsWebShare(): boolean;
    static supportsFullscreen(): boolean;
    static getCapabilities(): DeviceCapabilities;
    static getDeviceType(): 'mobile' | 'tablet' | 'desktop';
    static getScreenSize(): { width: number; height: number; ratio: number };
    static addResizeListener(callback: (deviceInfo: any) => void): () => void;
  }

  // UI Component Classes
  export class ColorPicker {
    constructor(container: HTMLElement | null, config: Configuration, onColorChange: (colorId: string) => void);
    render(container?: HTMLElement): void;
    selectColor(colorId: string): void;
    setSelectedColor(colorId: string): void;
    getSelectedColor(): string;
    getCurrentColor(): string;
    setColor(colorId: string): void;
  }

  export class StrapSelector {
    constructor(container: HTMLElement | null, config: Configuration, onStrapChange: (strapId: string) => void);
    render(container?: HTMLElement): void;
    selectStrap(strapId: string): void;
    getCurrentStrap(): string;
    setStrap(strapId: string): void;
  }

  export class EnvironmentSelector {
    constructor(container: HTMLElement | null, config: Configuration, onEnvironmentChange: (envId: string) => void);
    render(container?: HTMLElement): void;
    selectEnvironment(environmentId: string): void;
    getCurrentEnvironment(): string;
    setEnvironment(environmentId: string): void;
  }

  export class ActionButtons {
    constructor(configurator: XRUpgradeConfigurator, options?: { layout?: string; showLabels?: boolean });
    render(container: HTMLElement): void;
    takeScreenshot(): void;
    shareConfiguration(): void;
    resetConfiguration(): void;
    toggleFullscreen(): void;
    showQRModal(): void;
  }

  // Global Window Interface Extension
  declare global {
    interface Window {
      configurator?: XRUpgradeConfigurator;
      XRUpgradeConfigurator: typeof XRUpgradeConfigurator;
    }
  }
}

export = 'xrupgrade-configurator';
export as namespace XRUpgradeConfigurator; 