/**
 * HIMAYA - Main Application Logic
 */

class HimayaApp {
    constructor() {
        this.currentLanguage = window.i18n.currentLanguage;
        this.categories = [];
        this.schemes = []; // Initialize schemes array
        this.currentSchemeId = null;
        this.lastSynced = null;

        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        // Set up event listeners
        this.setupEventListeners();

        // Initialize reusable components
        this.initTheme();

        // Load initial data
        await this.loadData();
    }

    /**
     * Initialize theme (Dark/Light)
     */
    initTheme() {
        const savedTheme = localStorage.getItem('himaya_theme') || 'dark';
        document.body.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('himaya_theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            const sun = toggleBtn.querySelector('.icon-sun');
            const moon = toggleBtn.querySelector('.icon-moon');
            if (theme === 'dark') {
                sun.hidden = false;
                moon.hidden = true;
            } else {
                sun.hidden = true;
                moon.hidden = false;
            }
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Language toggle
        const langToggle = document.getElementById('language-toggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => this.toggleLanguage());
        }

        // Listen for language changes from other components
        window.addEventListener('languageChanged', (e) => {
            this.currentLanguage = e.detail.language;
            this.updateUIForLanguage();
        });

        // Quick action buttons
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Search input
        const searchInput = document.getElementById('scheme-search');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.searchSchemes(e.target.value);
                }, 300);
            });
        }

        // Eligibility form
        const eligibilityForm = document.getElementById('eligibility-form');
        if (eligibilityForm) {
            eligibilityForm.addEventListener('submit', (e) => this.handleEligibilitySubmit(e));
        }

        // Modal close buttons
        document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
            el.addEventListener('click', (e) => {
                // If it's a backdrop, only close if clicking the backdrop itself
                if (el.classList.contains('modal-backdrop')) {
                    if (e.target === el) this.closeModals();
                } else {
                    // For buttons, close regardless of clicking the icon or the button
                    this.closeModals();
                }
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });

        // Voice response events
        window.addEventListener('voiceResponse', (e) => {
            this.handleVoiceResponse(e.detail);
        });

        // Connection change events
        window.addEventListener('connectionChange', (e) => {
            if (e.detail.online) {
                this.loadData();
            }
        });
        
        // Manual refresh for Last Consumed
        const lastSyncedEl = document.getElementById('last-synced');
        if (lastSyncedEl) {
             lastSyncedEl.style.cursor = 'pointer';
             lastSyncedEl.addEventListener('click', () => {
                 this.loadData();
                 window.showToast(window.i18n.get('app.loading'), 'info');
             });
        }
    }

    /**
     * Load initial data
     */
    async loadData() {
        try {
            // Load categories
            await this.loadCategories();

            // Load schemes
            await this.loadSchemes();

            this.updateLastSynced();
        } catch (error) {
            console.error('Error loading data:', error);

            // Try to use cached data
            if (window.offlineManager) {
                const cachedSchemes = window.offlineManager.getCachedSchemes();
                const cachedCategories = window.offlineManager.getCachedCategories();

                if (cachedSchemes) {
                    this.schemes = cachedSchemes;
                    this.renderSchemes();
                }

                if (cachedCategories) {
                    this.categories = cachedCategories;
                    this.renderCategories();
                }
            }
        }
    }
    
    updateLastSynced() {
        this.lastSynced = new Date();
        const el = document.getElementById('last-synced');
        if (el) {
            el.textContent = `Last synced: ${this.lastSynced.toLocaleTimeString()}`;
        }
    }

    /**
     * Load categories
     */
    async loadCategories() {
        try {
            const response = await HIMAYA_API.getCategories();
            if (response.success) {
                this.categories = response.data;
                this.renderCategories();

                // Cache for offline use
                if (window.offlineManager) {
                    window.offlineManager.cacheCategories(response.data);
                }
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            throw error;
        }
    }

    /**
     * Load schemes
     */
    async loadSchemes(category = null) {
        try {
            const response = await HIMAYA_API.getSchemes(this.currentLanguage, category);
            if (response.success) {
                this.schemes = response.data;
                this.renderSchemes();

                // Cache for offline use
                if (window.offlineManager && !category) {
                    window.offlineManager.cacheSchemes(response.data);
                }
            }
        } catch (error) {
            console.error('Error loading schemes:', error);
            throw error;
        }
    }

    /**
     * Render categories
     */
    renderCategories() {
        const grid = document.getElementById('categories-grid');
        if (!grid) return;

        grid.innerHTML = this.categories.map(cat => `
      <button class="category-card" data-category="${cat.id}" aria-label="${cat.name}">
        <span class="category-icon">${cat.icon}</span>
        <span class="category-name">
          ${this.currentLanguage === 'hi' ? cat.nameHi : cat.name}
        </span>
        <span class="category-count">
          ${cat.schemeCount} ${window.i18n.get('categories.schemeCount')}
        </span>
      </button>
    `).join('');

        // Add click handlers
        grid.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.filterByCategory(category);
            });
        });
    }

    /**
     * Render schemes
     */
    renderSchemes() {
        const grid = document.getElementById('schemes-grid');
        if (!grid) return;

        if (this.schemes.length === 0) {
            grid.innerHTML = `
        <div class="no-results">
          <p>${window.i18n.get('schemes.noResults')}</p>
        </div>
      `;
            return;
        }

        grid.innerHTML = this.schemes.map(scheme => `
      <article class="scheme-card" data-scheme-id="${scheme.id}" tabindex="0" role="button">
        <div class="scheme-header">
          <span class="scheme-icon">${scheme.categoryIcon || '📋'}</span>
          <div>
            <h3 class="scheme-title">${scheme.name}</h3>
            <span class="scheme-category">${scheme.categoryName}</span>
          </div>
        </div>
        <p class="scheme-description">${scheme.shortDescription}</p>
        ${(scheme.benefitAmount || scheme.benefitDescription) ? `
          <div class="scheme-benefit">
            <span class="benefit-icon">💰</span>
            <span class="benefit-text">${scheme.benefitAmount ? `₹${scheme.benefitAmount.toLocaleString()} ${scheme.benefitFrequency}` : scheme.benefitDescription}</span>
          </div>
        ` : ''}
      </article>
    `).join('');

        // Add click handlers
        grid.querySelectorAll('.scheme-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const schemeId = e.currentTarget.dataset.schemeId;
                this.showSchemeDetail(schemeId);
            });

            // Keyboard support
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const schemeId = e.currentTarget.dataset.schemeId;
                    this.showSchemeDetail(schemeId);
                }
            });
        });
    }

    /**
     * Search schemes
     */
    async searchSchemes(query) {
        if (!query || query.length < 2) {
            await this.loadSchemes();
            return;
        }

        try {
            const response = await HIMAYA_API.searchSchemes(query, this.currentLanguage);
            if (response.success) {
                this.schemes = response.data;
                this.renderSchemes();
            }
        } catch (error) {
            console.error('Error searching schemes:', error);
            // Filter locally from cached data
            const cachedSchemes = window.offlineManager?.getCachedSchemes() || [];
            this.schemes = cachedSchemes.filter(s =>
                s.name.toLowerCase().includes(query.toLowerCase()) ||
                s.shortDescription.toLowerCase().includes(query.toLowerCase())
            );
            this.renderSchemes();
        }
    }

    /**
     * Filter by category
     */
    async filterByCategory(category) {
        try {
            await this.loadSchemes(category);

            // Scroll to schemes section
            document.getElementById('schemes-section')?.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error filtering by category:', error);
        }
    }

    /**
     * Show scheme details in modal
     */
    async showSchemeDetail(schemeId) {
        this.currentSchemeId = schemeId;
        const modal = document.getElementById('scheme-modal');
        const content = document.getElementById('scheme-detail-content');
        const modalTitle = document.getElementById('scheme-modal-title');

        if (!modal || !content) return;

        this.closeModals();

        // Show modal immediately with loading state
        content.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;
        const loadingTitle = window.i18n.get('common.loading');
        if (modalTitle) modalTitle.textContent = loadingTitle || 'Loading...';
        modal.hidden = false;

        try {
            const response = await HIMAYA_API.getSchemeById(schemeId, this.currentLanguage);

            if (response && response.success) {
                const scheme = response.data;
                
                const name = scheme.name || 'Scheme Detail';
                const ministry = scheme.ministry || '';
                const benefitAmount = scheme.benefitAmount;
                const benefitFrequency = scheme.benefitFrequency || '';
                const description = scheme.description || '';
                const eligibilityText = scheme.eligibilityText || '';
                const howToApply = scheme.howToApply || '';
                const documents = Array.isArray(scheme.documents) ? scheme.documents : [];
                const website = scheme.website || '#';
                const helpline = scheme.helpline || '';

                content.innerHTML = `
          <div class="scheme-detail-header">
            <h3 class="scheme-detail-title">${name}</h3>
            <p class="scheme-detail-ministry">${ministry}</p>
            ${(benefitAmount || scheme.benefitDescription) ? `
              <div class="scheme-detail-benefit">
                <span>💰</span>
                <span>${benefitAmount ? `₹${benefitAmount.toLocaleString()} ${benefitFrequency || ''}` : scheme.benefitDescription}</span>
              </div>
            ` : ''}
          </div>
          
          <div class="scheme-detail-section">
            <h3>${window.i18n.get('detail.description')}</h3>
            <p>${description}</p>
          </div>
          
          <div class="scheme-detail-section">
            <h3>${window.i18n.get('detail.eligibility')}</h3>
            <p>${eligibilityText}</p>
          </div>
          
          <div class="scheme-detail-section">
            <h3>${window.i18n.get('detail.howToApply')}</h3>
            <p>${howToApply.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div class="scheme-detail-section">
            <h3>${window.i18n.get('detail.documents')}</h3>
            <ul>
              ${documents.length > 0
                        ? documents.map(doc => `<li>${doc}</li>`).join('')
                        : `<li>${window.i18n.get('detail.noDocuments')}</li>`}
            </ul>
          </div>
          
          <div class="scheme-detail-actions">
            <a href="${website}" target="_blank" rel="noopener" class="btn btn-primary">
              ${window.i18n.get('detail.visitWebsite')}
            </a>
            <a href="tel:${helpline}" class="btn btn-outline">
              <span>📞 ${helpline}</span>
            </a>
          </div>
        `;

                if (modalTitle) modalTitle.textContent = name;

                const modalContent = modal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.setAttribute('tabindex', '-1');
                    modalContent.focus();
                }
            } else {
                throw new Error(response?.error || 'Failed to load scheme details');
            }
        } catch (error) {
            console.error('Error loading scheme details:', error);
            content.innerHTML = `
              <div style="text-align: center; padding: 2rem;">
                <p style="color: var(--color-error); font-size: 1.25rem;">❌ ${window.i18n.get('errors.generic')}</p>
                <p style="color: var(--color-text-secondary); margin: 1rem 0;">${error.message || window.i18n.get('errors.network')}</p>
                <button class="btn btn-outline" onclick="window.himayaApp.closeModals()">${window.i18n.get('app.close')}</button>
              </div>
            `;
            if (modalTitle) modalTitle.textContent = window.i18n.get('errors.generic');
        }
    }

    /**
     * Handle quick actions
     */
    handleQuickAction(action) {
        switch (action) {
            case 'list-schemes':
                document.getElementById('schemes-section')?.scrollIntoView({ behavior: 'smooth' });
                break;

            case 'check-eligibility':
                this.showEligibilityModal();
                break;

            case 'categories':
                document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' });
                break;

            case 'help':
                this.showHelp();
                break;
        }
    }

    /**
     * Show eligibility modal
     */
    showEligibilityModal() {
        this.closeModals();
        const modal = document.getElementById('eligibility-modal');
        if (modal) {
            modal.hidden = false;
            modal.querySelector('input')?.focus();
        }
    }

    /**
     * Handle eligibility form submit
     */
    async handleEligibilitySubmit(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);

        const profile = {
            age: parseInt(formData.get('age')) || null,
            income: parseInt(formData.get('income')) || null,
            occupation: formData.get('occupation') || null,
            gender: formData.get('gender') || null,
            bpl: formData.get('bpl') === 'on',
            hasLand: formData.get('hasLand') === 'on'
        };

        try {
            const response = await HIMAYA_API.checkEligibility(profile, this.currentLanguage);

            if (response.success) {
                this.showEligibilityResults(response.data);
            }
        } catch (error) {
            console.error('Error checking eligibility:', error);
            this.showToast(window.i18n.get('errors.checkEligibility'), 'error');
        }
    }

    /**
     * Show eligibility results
     */
    showEligibilityResults(schemes) {
        const resultsDiv = document.getElementById('eligibility-results');
        if (!resultsDiv) return;

        if (schemes.length === 0) {
            resultsDiv.innerHTML = `
        <p class="results-title" style="color: var(--color-warning);">
          ${window.i18n.get('eligibility.noMatch')}
        </p>
        <p>
          ${window.i18n.get('eligibility.tryAgain')}
        </p>
      `;
        } else {
            resultsDiv.innerHTML = `
        <p class="results-title">
          ${window.i18n.get('eligibility.matchFound', { count: schemes.length, plural: schemes.length > 1 ? 's' : '' })}
        </p>
        <div class="results-list">
          ${schemes.map(scheme => `
            <div class="result-item" data-scheme-id="${scheme.id}">
              <span class="result-icon">✓</span>
              <div>
                <strong>${scheme.name}</strong>
                <br>
                <small>${scheme.shortDescription}</small>
              </div>
            </div>
          `).join('')}
        </div>
      `;

            // Add click handlers to results
            resultsDiv.querySelectorAll('.result-item').forEach(item => {
                item.style.cursor = 'pointer';
                item.addEventListener('click', () => {
                    this.closeModals();
                    setTimeout(() => {
                        this.showSchemeDetail(item.dataset.schemeId);
                    }, 300);
                });
            });
        }

        resultsDiv.hidden = false;
    }

    /**
     * Show help
     */
    showHelp() {
        const helpText = window.i18n.get('help.voiceInstruction');
        this.showToast(helpText, 'info');

        // Also speak it
        if (window.voiceInterface) {
            window.voiceInterface.speak(helpText, this.currentLanguage);
        }
    }

    /**
     * Handle voice response
     */
    handleVoiceResponse(detail) {
        if (detail.intent === 'LIST_SCHEMES' && detail.data) {
            this.schemes = detail.data;
            this.renderSchemes();
            document.getElementById('schemes-section')?.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * Toggle language
     */
    toggleLanguage() {
        const newLang = this.currentLanguage === 'en' ? 'hi' : 'en';
        window.i18n.setLanguage(newLang);
    }
    
    /**
     * Update UI when language changes
     */
    async updateUIForLanguage() {
        // Update voice interface
        if (window.voiceInterface) {
            window.voiceInterface.setLanguage(this.currentLanguage);
        }
        
        await this.loadData();
        
        // Refresh open modal if any
        const schemeModal = document.getElementById('scheme-modal');
        if (schemeModal && !schemeModal.hidden && this.currentSchemeId) {
            this.showSchemeDetail(this.currentSchemeId);
        }
    }

    /**
     * Close all modals
     */
    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.hidden = true;
        });

        // Reset eligibility results
        const resultsDiv = document.getElementById('eligibility-results');
        if (resultsDiv) {
            resultsDiv.hidden = true;
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
      <span>${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
      <span>${message}</span>
    `;

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
}

// Global toast function
window.showToast = (message, type) => {
    if (window.himayaApp) {
        window.himayaApp.showToast(message, type);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.himayaApp = new HimayaApp();
});
