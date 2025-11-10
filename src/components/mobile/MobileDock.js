import { Logger } from '../../utils/Logger.js';

export class MobileDock {
  constructor(configurator) {
    this.configurator = configurator;
    this.container = null;
    this.scrollContainer = null;
    this.indicators = null;
    this.cleanupFunctions = [];
  }

  render(container) {
    Logger.info('🏗️ MobileDock: Creating mobile horizontal dock...');

    this.container = container;

    // Create the main horizontal dock
    const mobileDock = document.createElement('div');
    mobileDock.className = 'mobile-dock-horizontal';

    // Create scrollable container
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.className = 'mobile-dock-scroll';

    // Create horizontal row with labeled sections 
    const optionsRow = document.createElement('div');
    optionsRow.className = 'mobile-options-row mobile-labeled-sections';

    // Create sections
    const sections = this.createSections();
    sections.forEach(section => optionsRow.appendChild(section));

    // Assemble the dock
    this.scrollContainer.appendChild(optionsRow);
    mobileDock.appendChild(this.scrollContainer);
    container.appendChild(mobileDock);

    // Render components
    this.renderComponents(sections);

    // Add scroll indicators and onboarding
    this.setupScrollFeatures();

    Logger.info('✅ MobileDock: Mobile dock created successfully');
    return mobileDock;
  }

  createSections() {
    const sections = [];

    // Colors section
    const colorsSection = document.createElement('div');
    colorsSection.className = 'mobile-category-section';
    colorsSection.setAttribute('role', 'group');
    colorsSection.setAttribute('aria-labelledby', 'colors-label');
    colorsSection.innerHTML = `
      <div class="mobile-category-label" id="colors-label">Colors</div>
      <div class="mobile-category-items" id="mobile-color-items" role="radiogroup" aria-labelledby="colors-label"></div>
    `;
    sections.push(colorsSection);

    // Strap section
    const strapSection = document.createElement('div');
    strapSection.className = 'mobile-category-section';
    strapSection.setAttribute('role', 'group');
    strapSection.setAttribute('aria-labelledby', 'strap-label');
    strapSection.innerHTML = `
      <div class="mobile-category-label" id="strap-label">Strap</div>
      <div class="mobile-category-items" id="mobile-strap-items" role="radiogroup" aria-labelledby="strap-label"></div>
    `;
    sections.push(strapSection);

    // Environment section
    const environmentSection = document.createElement('div');
    environmentSection.className = 'mobile-category-section';
    environmentSection.setAttribute('role', 'group');
    environmentSection.setAttribute('aria-labelledby', 'environment-label');
    environmentSection.innerHTML = `
      <div class="mobile-category-label" id="environment-label">Environment</div>
      <div class="mobile-category-items" id="mobile-environment-items" role="radiogroup" aria-labelledby="environment-label"></div>
    `;
    sections.push(environmentSection);

    return sections;
  }

  renderComponents(sections) {
    const colorContainer = sections[0].querySelector('#mobile-color-items');
    const strapContainer = sections[1].querySelector('#mobile-strap-items');
    const environmentContainer = sections[2].querySelector('#mobile-environment-items');

    // Render components
    this.configurator.colorPicker.render(colorContainer);
    this.configurator.strapSelector.render(strapContainer);
    this.configurator.environmentSelector.render(environmentContainer);
  }

  setupScrollFeatures() {
    // this.addScrollIndicators(); // Removed scroll indicators
    // this.addOnboardingHint(); // Removed onboarding hint
    this.addKeyboardNavigation();
  }

  addScrollIndicators() {
    // Create indicators
    this.indicators = document.createElement('div');
    this.indicators.className = 'mobile-scroll-indicators';
    this.indicators.innerHTML = `
      <div class="scroll-indicator left" style="display: none;">‹</div>
      <div class="scroll-indicator right">›</div>
    `;

    this.scrollContainer.parentElement.appendChild(this.indicators);

    // Update indicators based on scroll position
    const updateIndicators = () => {
      const leftIndicator = this.indicators.querySelector('.left');
      const rightIndicator = this.indicators.querySelector('.right');

      leftIndicator.style.display = this.scrollContainer.scrollLeft > 10 ? 'block' : 'none';
      rightIndicator.style.display =
        this.scrollContainer.scrollLeft < (this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth - 10)
          ? 'block' : 'none';
    };

    this.scrollContainer.addEventListener('scroll', updateIndicators, { passive: true });
    updateIndicators(); // Initial state

    // Store cleanup function
    this.cleanupFunctions.push(() => {
      this.scrollContainer.removeEventListener('scroll', updateIndicators);
      if (this.indicators && this.indicators.parentElement) {
        this.indicators.parentElement.removeChild(this.indicators);
      }
    });
  }

  addOnboardingHint() {
    // Check if user has seen the hint before
    const hasSeenHint = localStorage.getItem('floyd-weekender-scroll-hint-seen');

    if (!hasSeenHint && this.scrollContainer.scrollWidth > this.scrollContainer.clientWidth) {
      const hint = document.createElement('div');
      hint.className = 'onboarding-hint';
      hint.innerHTML = `
        <div class="hint-content">
          <span>👆 Swipe to explore options</span>
          <button class="hint-close">×</button>
        </div>
      `;

      this.scrollContainer.parentElement.appendChild(hint);

      // Auto-hide after 4 seconds or on user interaction
      const hideHint = () => {
        hint.style.opacity = '0';
        setTimeout(() => {
          if (hint.parentElement) {
            hint.parentElement.removeChild(hint);
          }
        }, 300);
        localStorage.setItem('floyd-weekender-scroll-hint-seen', 'true');
      };

      // Hide on close button click
      hint.querySelector('.hint-close').addEventListener('click', hideHint);

      // Hide on scroll
      const onScroll = () => {
        hideHint();
        this.scrollContainer.removeEventListener('scroll', onScroll);
      };
      this.scrollContainer.addEventListener('scroll', onScroll, { passive: true });

      // Auto-hide after 4 seconds
      setTimeout(hideHint, 4000);
    }
  }

  addKeyboardNavigation() {
    // Make scroll container focusable
    this.scrollContainer.setAttribute('tabindex', '0');
    this.scrollContainer.setAttribute('role', 'region');
    this.scrollContainer.setAttribute('aria-label', 'Product customization options');

    // Add keyboard event listener
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.scrollContainer.scrollBy({ left: -100, behavior: 'smooth' });
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.scrollContainer.scrollBy({ left: 100, behavior: 'smooth' });
          break;
        case 'Home':
          e.preventDefault();
          this.scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
          break;
        case 'End':
          e.preventDefault();
          this.scrollContainer.scrollTo({
            left: this.scrollContainer.scrollWidth,
            behavior: 'smooth'
          });
          break;
      }
    };

    this.scrollContainer.addEventListener('keydown', handleKeyDown);

    // Store cleanup function
    this.cleanupFunctions.push(() => {
      this.scrollContainer.removeEventListener('keydown', handleKeyDown);
    });
  }

  destroy() {
    Logger.info('🧹 MobileDock: Cleaning up...');

    // Run all cleanup functions
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];

    // Remove DOM elements
    if (this.container) {
      const mobileDock = this.container.querySelector('.mobile-dock-horizontal');
      if (mobileDock) {
        mobileDock.remove();
      }
    }

    Logger.info('✅ MobileDock: Cleanup complete');
  }
} 