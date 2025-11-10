import { Logger } from '../../utils/Logger.js';

/**
 * ColorPicker Component
 * Handles color selection for the 3D model
 */
export class ColorPicker {
  constructor(container, config, onColorChange) {
    this.container = container;
    this.config = config;
    this.onColorChange = onColorChange;
    this.currentColor = config.defaultColor || config.colors[0].id;

    // Only render if container is provided
    if (this.container) {
      this.render();
      this.setupEventListeners();
    }

    Logger.info('🎨 ColorPicker initialized with', config.colors.length, 'colors');
  }

  render(container = null) {
    // Use provided container or stored container
    const targetContainer = container || this.container;
    if (!targetContainer) {
      Logger.error('❌ No container provided for ColorPicker render');
      return;
    }

    Logger.info('🎨 ColorPicker.render() called:', {
      targetContainer: targetContainer ? targetContainer.tagName : 'NULL',
      id: targetContainer?.id,
      classList: targetContainer?.classList ? Array.from(targetContainer.classList) : 'NO_CLASSES',
      closest: !!targetContainer?.closest('.mobile-dock-horizontal'),
      innerHTML: targetContainer?.innerHTML?.substring(0, 100) || 'EMPTY'
    });

    // Update stored container reference
    this.container = targetContainer;

    // Check if this is a mobile dock container
    const isMobileDock = targetContainer.id?.includes('mobile-') ||
      targetContainer.closest('.mobile-dock-horizontal') ||
      targetContainer.closest('.mobile-category-items');

    Logger.info('🔍 ColorPicker mobile detection result:', isMobileDock);

    if (isMobileDock) {
      // Render for mobile dock - just the color options without sections
      this.container.innerHTML = `
        ${this.config.colors.map(color => `
          <div class="color-option ${color.id === this.currentColor ? 'selected' : ''}" 
               data-color="${color.id}">
            <img src="${color.preview}" alt="${color.name}">
          </div>
        `).join('')}
      `;
    } else {
      // Render for desktop dock - with sections
      this.container.innerHTML = `
        <div class="color-section">
          <div class="section-title">Colors</div>
          <div class="color-grid">
            ${this.config.colors.map(color => `
              <div class="color-option ${color.id === this.currentColor ? 'selected' : ''}" 
                   data-color="${color.id}">
                <img src="${color.preview}" alt="${color.name}">
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.container.addEventListener('click', (e) => {
      const colorOption = e.target.closest('.color-option');
      if (colorOption) {
        const colorId = colorOption.dataset.color;
        this.selectColor(colorId);
        this.createClickEffect(colorOption);
      }
    });
  }

  selectColor(colorId) {
    if (colorId === this.currentColor) return;

    // Update UI
    const colorOptions = this.container.querySelectorAll('.color-option');
    colorOptions.forEach(opt => opt.classList.remove('selected'));

    const selectedOption = this.container.querySelector(`[data-color="${colorId}"]`);
    if (selectedOption) {
      selectedOption.classList.add('selected');
    }

    this.currentColor = colorId;

    // Find color config
    const colorConfig = this.config.colors.find(c => c.id === colorId);

    // Trigger callback with colorId (not the full config object)
    if (this.onColorChange) {
      this.onColorChange(colorId);
    }

    Logger.info(`🎨 Color selected: ${colorConfig?.name}`);
  }

  createClickEffect(element) {
    // Add click pulse effect
    element.classList.add('clicked');

    // Create mini particle burst
    this.createMiniParticleBurst(element);

    // Remove effect after animation
    setTimeout(() => {
      element.classList.remove('clicked');
    }, 300);
  }

  createMiniParticleBurst(element) {
    // Only run on desktop
    const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) return;

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 6; i++) {
      const particle = document.createElement('div');
      particle.className = 'mini-particle';

      // Random direction for each particle
      const angle = (360 / 6) * i + Math.random() * 30;
      const distance = 20 + Math.random() * 15;
      const x = Math.cos(angle * Math.PI / 180) * distance;
      const y = Math.sin(angle * Math.PI / 180) * distance;

      particle.style.cssText = `
        position: fixed;
        top: ${centerY}px;
        left: ${centerX}px;
        width: 3px;
        height: 3px;
        background: radial-gradient(circle, rgba(102, 126, 234, 0.9) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        animation: miniParticleBurst 0.6s ease-out forwards;
        animation-delay: ${i * 0.05}s;
        --burst-x: ${x}px;
        --burst-y: ${y}px;
      `;

      document.body.appendChild(particle);

      // Remove particle after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 700);
    }
  }

  // Public API
  setSelectedColor(colorId) {
    this.selectColor(colorId);
  }

  getSelectedColor() {
    return this.currentColor;
  }

  getCurrentColor() {
    return this.currentColor;
  }

  setColor(colorId) {
    this.selectColor(colorId);
  }
} 