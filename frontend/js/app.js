/**
 * HIMAYA - Main Application Logic
 */

class HimayaApp {
    constructor() {
        this.currentLanguage = localStorage.getItem('himaya_language') || 'en';
        this.categories = [];
        this.currentSchemeId = null;

        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        // Set up event listeners
        this.setupEventListeners();

        // Load initial data
        await this.loadData();

        // Check for stored language preference
        const storedLang = localStorage.getItem('himaya_language');
        if (storedLang) {
            this.setLanguage(storedLang);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Language toggle
        const langToggle = document.getElementById('language-toggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => this.toggleLanguage());
        }

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
                if (e.target === el) {
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
          <span class="en" ${this.currentLanguage !== 'en' ? 'hidden' : ''}>${cat.name}</span>
          <span class="hi" ${this.currentLanguage !== 'hi' ? 'hidden' : ''}>${cat.nameHi}</span>
        </span>
        <span class="category-count">
          ${this.currentLanguage === 'hi' ? `${cat.schemeCount} योजनाएं` : `${cat.schemeCount} schemes`}
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
          <p class="en" ${this.currentLanguage !== 'en' ? 'hidden' : ''}>No schemes found</p>
          <p class="hi" ${this.currentLanguage !== 'hi' ? 'hidden' : ''}>कोई योजना नहीं मिली</p>
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
        console.log('Showing scheme details for:', schemeId);
        this.currentSchemeId = schemeId;
        const modal = document.getElementById('scheme-modal');
        const content = document.getElementById('scheme-detail-content');
        const modalTitle = document.getElementById('scheme-modal-title');

        if (!modal || !content) {
            console.error('Modal or content element not found');
            return;
        }

        // Show modal immediately with loading state
        content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
        if (modalTitle) modalTitle.textContent = this.currentLanguage === 'hi' ? 'लोड हो रहा है...' : 'Loading...';
        modal.hidden = false;

        try {
            console.log(`Fetching scheme details for ${schemeId} in ${this.currentLanguage}`);
            const response = await HIMAYA_API.getSchemeById(schemeId, this.currentLanguage);

            if (response && response.success) {
                const scheme = response.data;
                console.log('Scheme data received:', scheme);

                // Safe data extraction with defaults
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
            <h3>
              <span class="en" ${this.currentLanguage !== 'en' ? 'hidden' : ''}>Description</span>
              <span class="hi" ${this.currentLanguage !== 'hi' ? 'hidden' : ''}>विवरण</span>
            </h3>
            <p>${description}</p>
          </div>
          
          <div class="scheme-detail-section">
            <h3>
              <span class="en" ${this.currentLanguage !== 'en' ? 'hidden' : ''}>Eligibility</span>
              <span class="hi" ${this.currentLanguage !== 'hi' ? 'hidden' : ''}>पात्रता</span>
            </h3>
            <p>${eligibilityText}</p>
          </div>
          
          <div class="scheme-detail-section">
            <h3>
              <span class="en" ${this.currentLanguage !== 'en' ? 'hidden' : ''}>How to Apply</span>
              <span class="hi" ${this.currentLanguage !== 'hi' ? 'hidden' : ''}>आवेदन कैसे करें</span>
            </h3>
            <p>${howToApply.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div class="scheme-detail-section">
            <h3>
              <span class="en" ${this.currentLanguage !== 'en' ? 'hidden' : ''}>Documents Required</span>
              <span class="hi" ${this.currentLanguage !== 'hi' ? 'hidden' : ''}>आवश्यक दस्तावेज</span>
            </h3>
            <ul>
              ${documents.length > 0
                        ? documents.map(doc => `<li>${doc}</li>`).join('')
                        : `<li>${this.currentLanguage === 'hi' ? 'कोई विशिष्ट दस्तावेज सूचीबद्ध नहीं हैं' : 'No specific documents listed'}</li>`}
            </ul>
          </div>
          
          <div class="scheme-detail-actions">
            <a href="${website}" target="_blank" rel="noopener" class="btn btn-primary">
              <span class="en" ${this.currentLanguage !== 'en' ? 'hidden' : ''}>Visit Official Website</span>
              <span class="hi" ${this.currentLanguage !== 'hi' ? 'hidden' : ''}>आधिकारिक वेबसाइट</span>
            </a>
            <a href="tel:${helpline}" class="btn btn-outline">
              <span>📞 ${helpline}</span>
            </a>
          </div>
        `;

                // Update modal title
                if (modalTitle) modalTitle.textContent = name;

                // Focus the modal content for accessibility
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
                <p style="color: #ef4444; font-size: 1.25rem;">❌ ${this.currentLanguage === 'hi' ? 'त्रुटि' : 'Error'}</p>
                <p style="color: #94a3b8; margin: 1rem 0;">${error.message || 'Please check your connection and try again.'}</p>
                <button class="btn btn-outline" onclick="window.munsyariApp.closeModals()">${this.currentLanguage === 'hi' ? 'बंद करें' : 'Close'}</button>
              </div>
            `;
            if (modalTitle) modalTitle.textContent = this.currentLanguage === 'hi' ? 'त्रुटि' : 'Error';
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
            this.showToast('Error checking eligibility', 'error');
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
          <span class="en">No matching schemes found</span>
          <span class="hi">कोई मिलती-जुलती योजना नहीं मिली</span>
        </p>
        <p>
          <span class="en">Try adjusting your profile or browse all schemes.</span>
          <span class="hi">अपनी प्रोफाइल बदलें या सभी योजनाएं देखें।</span>
        </p>
      `;
        } else {
            resultsDiv.innerHTML = `
        <p class="results-title">
          <span class="en">You're eligible for ${schemes.length} scheme${schemes.length > 1 ? 's' : ''}!</span>
          <span class="hi">आप ${schemes.length} योजना${schemes.length > 1 ? 'ओं' : ''} के लिए पात्र हैं!</span>
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
        const helpText = this.currentLanguage === 'hi'
            ? 'आप योजनाएं खोजने के लिए माइक्रोफोन बटन का उपयोग कर सकते हैं। "योजनाएं" या "पात्रता जांचें" बोलें।'
            : 'You can use the microphone button to find schemes. Say "schemes" or "check my eligibility".';

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
        this.setLanguage(newLang);
    }

    /**
     * Set language
     */
    async setLanguage(lang) {
        this.currentLanguage = lang;
        document.body.dataset.lang = lang;

        // Update toggle button
        const currentLangEl = document.getElementById('current-lang');
        const otherLangEl = document.getElementById('other-lang');
        if (currentLangEl && otherLangEl) {
            currentLangEl.textContent = lang === 'en' ? 'EN' : 'हिंदी';
            otherLangEl.textContent = lang === 'en' ? 'हिंदी' : 'EN';
        }

        // Update voice interface
        if (window.voiceInterface) {
            window.voiceInterface.setLanguage(lang);
        }

        // Store preference
        localStorage.setItem('himaya_language', lang);

        // Reload data in new language
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
