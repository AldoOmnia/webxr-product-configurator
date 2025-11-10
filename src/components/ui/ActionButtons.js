import { Logger } from '../../utils/Logger.js';
import { DeviceDetection } from '../../utils/DeviceDetection.js';

export class ActionButtons {
  constructor(configurator, options = {}) {
    this.configurator = configurator;
    this.options = {
      showLabels: false,
      layout: 'vertical', // 'vertical' or 'horizontal'
      ...options
    };

    Logger.info('🎮 ActionButtons initialized');
  }

  render(container = null) {
    const targetContainer = container || document.createElement('div');

    // Check if this is a mobile floating actions container
    const isMobileFloating = container && container.classList?.contains('mobile-floating-actions');

    // Clear existing content if container provided
    if (container) {
      container.innerHTML = '';
      if (!isMobileFloating) {
        container.className = 'floating-actions';
      }
    } else {
      targetContainer.className = 'floating-actions';
    }

    // Create action buttons - same for both desktop and mobile floating
    const buttons = [
      { id: 'screenshot', icon: '📸', label: 'Screenshot' },
      { id: 'share', icon: '🔗', label: 'Share' },
      { id: 'reset', icon: '🔄', label: 'Reset' },
      { id: 'fullscreen', icon: '⛶', label: 'Fullscreen' }
    ];

    buttons.forEach(btn => {
      const button = document.createElement('div');
      button.className = 'action-btn';
      button.id = `${btn.id}Btn`;
      button.title = btn.label;
      button.innerHTML = `
        <span class="btn-icon">${btn.icon}</span>
        ${this.options.showLabels ? `<span class="btn-label">${btn.label}</span>` : ''}
      `;

      button.addEventListener('click', () => this.handleAction(btn.id));
      targetContainer.appendChild(button);
    });

    // Create AR/QR button with special styling
    const arButton = document.createElement('div');
    arButton.className = 'ar-button';
    arButton.id = 'arBtn';
    arButton.title = 'QR Code / AR View';
    arButton.innerHTML = `
      <span class="btn-icon">🥽</span>
      ${this.options.showLabels ? '<span class="btn-label">AR View</span>' : ''}
    `;

    arButton.addEventListener('click', () => this.handleAction('ar'));
    targetContainer.appendChild(arButton);

    // Return container only if none was provided
    return container ? undefined : targetContainer;
  }

  bindEvents(container, buttons) {
    container.addEventListener('click', (e) => {
      const button = e.target.closest('.action-btn');
      if (button) {
        const actionId = button.dataset.action;
        const buttonConfig = buttons.find(b => b.id === actionId);

        if (buttonConfig) {
          this.createClickEffect(button);
          buttonConfig.action();
        }
      }
    });
  }

  createClickEffect(button) {
    button.classList.add('clicked');
    setTimeout(() => {
      button.classList.remove('clicked');
    }, 200);
  }

  async takeScreenshot() {
    try {
      Logger.info('📸 Taking screenshot...');
      const dataUrl = await this.configurator.takeScreenshot();

      // Create download link
      const link = document.createElement('a');
      link.download = 'floyd-weekender-configuration.png';
      link.href = dataUrl;
      link.click();

      this.showToast('Screenshot saved!', 'success');
      Logger.info('✅ Screenshot taken successfully');

    } catch (error) {
      Logger.error('❌ Screenshot failed:', error);
      this.showToast('Screenshot failed', 'error');
    }
  }

  async shareConfiguration() {
    try {
      Logger.info('🔗 Sharing configuration...');
      const shareUrl = this.configurator.getShareURL();

      if (navigator.share) {
        await navigator.share({
          title: 'Floyd Weekender Configuration',
          text: 'Check out my custom Floyd Weekender configuration!',
          url: shareUrl
        });
        Logger.info('✅ Configuration shared via Web Share API');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);
        this.showToast('Configuration URL copied to clipboard!', 'success');
        Logger.info('✅ Configuration URL copied to clipboard');
      }

    } catch (error) {
      Logger.error('❌ Share failed:', error);
      this.showToast('Share failed', 'error');
    }
  }

  resetConfiguration() {
    Logger.info('🔄 Resetting configuration...');
    this.configurator.reset();
    this.showToast('Configuration reset to defaults', 'info');
  }

  toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        Logger.info('✅ Entered fullscreen mode');
      } else {
        document.exitFullscreen();
        Logger.info('✅ Exited fullscreen mode');
      }
    } catch (error) {
      Logger.error('❌ Fullscreen toggle failed:', error);
      this.showToast('Fullscreen not supported', 'error');
    }
  }

  handleARAction() {
    const isMobile = this.isMobileDevice();
    const deviceCapabilities = DeviceDetection.getCapabilities();

    if (isMobile) {
      // On mobile, check if AR is supported
      if (!deviceCapabilities.isHTTPS && location.hostname !== 'localhost') {
        this.showError('AR requires HTTPS connection');
        return;
      }

      // Check device compatibility
      if (!DeviceDetection.supportsAR()) {
        this.showError('AR is not supported on this device');
        return;
      }

      // Activate AR with retry logic
      Logger.info('📱 Activating AR on mobile device...');
      this.configurator.activateAR();
    } else {
      // On desktop, show QR modal with enhanced instructions
      Logger.info('💻 Showing QR modal for desktop...');
      this.showQRModal();
    }
  }

  showQRModal() {
    const modal = document.createElement('div');
    modal.className = 'qr-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(5px);
    `;

    const content = document.createElement('div');
    content.className = 'qr-content';
    content.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      text-align: center;
      max-width: 90%;
      width: 400px;
    `;

    const title = document.createElement('h2');
    title.textContent = 'View in AR';
    title.style.cssText = `
      margin-bottom: 1rem;
      color: #2d3748;
      font-family: 'Inter', sans-serif;
    `;

    const instructions = document.createElement('p');
    instructions.innerHTML = `
      <strong>Instructions:</strong><br>
      1. Scan this QR code with your mobile device<br>
      2. Open the link in your browser<br>
      3. Tap the AR button to view in AR<br><br>
      <small>Requires iOS 12+ or Android 7.0+</small>
    `;
    instructions.style.cssText = `
      margin-bottom: 1.5rem;
      color: #4a5568;
      font-family: 'Inter', sans-serif;
      line-height: 1.6;
    `;

    const qrContainer = document.createElement('div');
    qrContainer.id = 'qrCode';
    qrContainer.style.cssText = `
      margin: 1rem auto;
      padding: 1rem;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText = `
      margin-top: 1.5rem;
      padding: 0.75rem 1.5rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s;
    `;
    closeButton.onclick = () => modal.remove();

    content.appendChild(title);
    content.appendChild(instructions);
    content.appendChild(qrContainer);
    content.appendChild(closeButton);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Generate QR code with current configuration
    const url = this.getCurrentURL();
    new QRCode(qrContainer, {
      text: url,
      width: 200,
      height: 200,
      colorDark: '#2d3748',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #f56565;
      color: white;
      padding: 1rem 2rem;
      border-radius: 0.5rem;
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  isMobileDevice() {
    return window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  showToast(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Style the toast
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10000;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  handleAction(action) {
    switch (action) {
      case 'screenshot':
        this.takeScreenshot();
        break;
      case 'share':
        this.shareConfiguration();
        break;
      case 'reset':
        this.resetConfiguration();
        break;
      case 'fullscreen':
        this.toggleFullscreen();
        break;
      case 'ar':
        this.handleARAction();
        break;
    }
  }

  getCurrentURL() {
    const baseUrl = window.location.origin + window.location.pathname;
    const state = this.configurator.getState();
    const params = new URLSearchParams();

    if (state.color) params.set('color', state.color);
    if (state.strap) params.set('strap', state.strap);
    if (state.environment) params.set('environment', state.environment);

    // Add AR parameter for QR code links to trigger AR on mobile
    params.set('ar', 'true');

    // Add timestamp to prevent caching
    params.set('t', Date.now());

    return `${baseUrl}?${params.toString()}`;
  }
} 