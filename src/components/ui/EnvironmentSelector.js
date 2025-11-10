import { Logger } from '../../utils/Logger.js';

/**
 * EnvironmentSelector Component
 * Handles environment/scene selection for the 3D model
 */
export class EnvironmentSelector {
  constructor(container, config, onEnvironmentChange) {
    this.container = container;
    this.config = config;
    this.onEnvironmentChange = onEnvironmentChange;
    this.currentEnvironment = config.defaultEnvironment || config.environments[0].id;

    // Only render if container is provided
    if (this.container) {
      this.render();
      this.setupEventListeners();
    }

    Logger.info('🌍 EnvironmentSelector initialized with', config.environments.length, 'environments');
  }

  render(container = null) {
    // Use provided container or stored container
    const targetContainer = container || this.container;
    if (!targetContainer) {
      Logger.error('❌ No container provided for EnvironmentSelector render');
      return;
    }

    Logger.info('🌍 EnvironmentSelector.render() called:', {
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

    Logger.info('🔍 EnvironmentSelector mobile detection result:', isMobileDock);

    if (isMobileDock) {
      // Render for mobile dock - just the environment options without sections
      this.container.innerHTML = `
        ${this.config.environments.map(env => `
          <div class="environment-option ${env.id === this.currentEnvironment ? 'selected' : ''}" 
               data-environment="${env.id}"
               style="background: ${env.gradient};">
            <span class="environment-label">${env.name}</span>
          </div>
        `).join('')}
      `;
    } else {
      // Render for desktop dock - with sections
      this.container.innerHTML = `
        <div class="environment-section">
          <div class="section-title">Environment</div>
          <div class="environment-grid">
            ${this.config.environments.map(env => `
              <div class="environment-option ${env.id === this.currentEnvironment ? 'selected' : ''}" 
                   data-environment="${env.id}"
                   style="background: ${env.gradient};">
                <span class="environment-label">${env.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    const environmentOptions = this.container.querySelectorAll('.environment-option');

    environmentOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        const environmentId = e.currentTarget.dataset.environment;
        this.selectEnvironment(environmentId);
      });
    });
  }

  selectEnvironment(environmentId) {
    if (environmentId === this.currentEnvironment) return;

    // Update UI
    const environmentOptions = this.container.querySelectorAll('.environment-option');
    environmentOptions.forEach(opt => opt.classList.remove('selected'));

    const selectedOption = this.container.querySelector(`[data-environment="${environmentId}"]`);
    if (selectedOption) {
      selectedOption.classList.add('selected');
    }

    this.currentEnvironment = environmentId;

    // Find environment config
    const environmentConfig = this.config.environments.find(e => e.id === environmentId);

    // Trigger callback with environmentId (not the full config object)
    if (this.onEnvironmentChange) {
      this.onEnvironmentChange(environmentId);
    }

    Logger.info(`🌍 Environment selected: ${environmentConfig?.name}`);
  }

  getCurrentEnvironment() {
    return this.currentEnvironment;
  }

  setEnvironment(environmentId) {
    this.selectEnvironment(environmentId);
  }
} 