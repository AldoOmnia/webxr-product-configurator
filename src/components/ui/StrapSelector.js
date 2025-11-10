import { Logger } from '../../utils/Logger.js';

/**
 * StrapSelector Component
 * Handles strap selection for the 3D model
 */
export class StrapSelector {
  constructor(container, config, onStrapChange) {
    this.container = container;
    this.config = config;
    this.onStrapChange = onStrapChange;
    this.currentStrap = config.defaultStrap || config.straps[0].id;

    // Only render if container is provided
    if (this.container) {
      this.render();
      this.setupEventListeners();
    }

    Logger.info('👜 StrapSelector initialized with', config.straps.length, 'straps');
  }

  render(container = null) {
    // Use provided container or stored container
    const targetContainer = container || this.container;
    if (!targetContainer) {
      Logger.error('❌ No container provided for StrapSelector render');
      return;
    }

    Logger.info('🔧 StrapSelector.render() called:', {
      targetContainer: targetContainer ? targetContainer.tagName : 'NULL',
      id: targetContainer?.id,
      classList: targetContainer?.classList ? Array.from(targetContainer.classList) : 'NO_CLASSES',
      closest: !!targetContainer?.closest('.mobile-dock-horizontal')
    });

    // Update stored container reference
    this.container = targetContainer;

    // Check if this is a mobile dock container
    const isMobileDock = targetContainer.id?.includes('mobile-') ||
      targetContainer.closest('.mobile-dock-horizontal') ||
      targetContainer.closest('.mobile-category-items');

    Logger.info('🔍 StrapSelector mobile detection result:', isMobileDock);

    if (isMobileDock) {
      // Render for mobile dock - just the strap options without sections
      this.container.innerHTML = `
        ${this.config.straps.map(strap => `
          <div class="strap-option ${strap.cssClass || ''} ${strap.id === this.currentStrap ? 'selected' : ''}" 
               data-strap="${strap.id}">
            <span>${strap.name}</span>
          </div>
        `).join('')}
      `;
    } else {
      // Render for desktop dock - with sections
      this.container.innerHTML = `
        <div class="strap-section">
          <div class="section-title">Strap</div>
          <div class="strap-grid">
            ${this.config.straps.map(strap => `
              <div class="strap-option ${strap.cssClass || ''} ${strap.id === this.currentStrap ? 'selected' : ''}" 
                   data-strap="${strap.id}">
                <span>${strap.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    const strapOptions = this.container.querySelectorAll('.strap-option');

    strapOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        const strapId = e.currentTarget.dataset.strap;
        this.selectStrap(strapId);
      });
    });
  }

  selectStrap(strapId) {
    if (strapId === this.currentStrap) return;

    // Update UI
    const strapOptions = this.container.querySelectorAll('.strap-option');
    strapOptions.forEach(opt => opt.classList.remove('selected'));

    const selectedOption = this.container.querySelector(`[data-strap="${strapId}"]`);
    if (selectedOption) {
      selectedOption.classList.add('selected');
    }

    this.currentStrap = strapId;

    // Find strap config
    const strapConfig = this.config.straps.find(s => s.id === strapId);

    // Trigger callback with strapId (not the full config object)
    if (this.onStrapChange) {
      this.onStrapChange(strapId);
    }

    Logger.info(`👜 Strap selected: ${strapConfig?.name}`);
  }

  getCurrentStrap() {
    return this.currentStrap;
  }

  setStrap(strapId) {
    this.selectStrap(strapId);
  }
} 