/**
 * HIMAYA - Offline Support Module
 * Handles service worker registration and offline functionality
 */

class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.offlineIndicator = document.getElementById('offline-indicator');
        this.cachedSchemes = null;

        this.init();
    }

    /**
     * Initialize offline support
     */
    init() {
        // Register service worker
        this.registerServiceWorker();

        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Don't show offline indicator on initial load
        // navigator.onLine can be unreliable - let API calls determine connectivity

        // Load cached data
        this.loadCachedData();
    }

    /**
     * Register service worker
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration.scope);

                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateAvailable();
                        }
                    });
                });
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    /**
     * Handle coming online
     */
    handleOnline() {
        this.isOnline = true;
        this.hideOfflineIndicator();

        // Sync any pending data
        this.syncData();

        // Dispatch event
        window.dispatchEvent(new CustomEvent('connectionChange', { detail: { online: true } }));
    }

    /**
     * Handle going offline
     */
    handleOffline() {
        this.isOnline = false;
        this.showOfflineIndicator();

        // Dispatch event
        window.dispatchEvent(new CustomEvent('connectionChange', { detail: { online: false } }));
    }

    /**
     * Show offline indicator
     */
    showOfflineIndicator() {
        if (this.offlineIndicator) {
            this.offlineIndicator.hidden = false;
        }
    }

    /**
     * Hide offline indicator
     */
    hideOfflineIndicator() {
        if (this.offlineIndicator) {
            this.offlineIndicator.hidden = true;
        }
    }

    /**
     * Show update available notification
     */
    showUpdateAvailable() {
        if (window.showToast) {
            window.showToast('New version available! Refresh to update.', 'info');
        }
    }

    /**
     * Load cached data from localStorage
     */
    loadCachedData() {
        try {
            const cachedSchemes = localStorage.getItem('himaya_schemes');
            if (cachedSchemes) {
                this.cachedSchemes = JSON.parse(cachedSchemes);
            }

            const cachedCategories = localStorage.getItem('himaya_categories');
            if (cachedCategories) {
                this.cachedCategories = JSON.parse(cachedCategories);
            }
        } catch (error) {
            console.error('Error loading cached data:', error);
        }
    }

    /**
     * Cache schemes data
     */
    cacheSchemes(schemes) {
        try {
            this.cachedSchemes = schemes;
            localStorage.setItem('himaya_schemes', JSON.stringify(schemes));
        } catch (error) {
            console.error('Error caching schemes:', error);
        }
    }

    /**
     * Cache categories data
     */
    cacheCategories(categories) {
        try {
            this.cachedCategories = categories;
            localStorage.setItem('himaya_categories', JSON.stringify(categories));
        } catch (error) {
            console.error('Error caching categories:', error);
        }
    }

    /**
     * Get cached schemes
     */
    getCachedSchemes() {
        return this.cachedSchemes;
    }

    /**
     * Get cached categories
     */
    getCachedCategories() {
        return this.cachedCategories;
    }

    /**
     * Sync data when coming back online
     */
    async syncData() {
        // In a real app, this would sync any locally stored user data
        console.log('Syncing data after coming online...');

        // Refresh schemes cache
        try {
            const response = await HIMAYA_API.getSchemes();
            if (response.success) {
                this.cacheSchemes(response.data);
            }
        } catch (error) {
            console.error('Error syncing schemes:', error);
        }
    }

    /**
     * Check if we're online
     */
    checkOnline() {
        return this.isOnline;
    }
}

// Initialize offline manager
window.offlineManager = new OfflineManager();
