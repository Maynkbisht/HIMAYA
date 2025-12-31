/**
 * HIMAYA - API Client Module
 * Handles all API communication with the backend
 */

const API_BASE_URL = '/api';

/**
 * Generic fetch wrapper with error handling
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            // Network error - try to get from cache if available
            throw new Error('Network error. You may be offline.');
        }
        throw error;
    }
}

// ============ Schemes API ============

/**
 * Get all schemes
 */
async function getSchemes(lang = 'en', category = null) {
    let endpoint = `/schemes?lang=${lang}`;
    if (category) {
        endpoint += `&category=${category}`;
    }
    return apiRequest(endpoint);
}

/**
 * Get scheme by ID
 */
async function getSchemeById(id, lang = 'en') {
    return apiRequest(`/schemes/${id}?lang=${lang}`);
}

/**
 * Get schemes by category
 */
async function getSchemesByCategory(category, lang = 'en') {
    return apiRequest(`/schemes/category/${category}?lang=${lang}`);
}

/**
 * Search schemes
 */
async function searchSchemes(query, lang = 'en') {
    return apiRequest(`/schemes/search?q=${encodeURIComponent(query)}&lang=${lang}`);
}

/**
 * Get all categories
 */
async function getCategories() {
    return apiRequest('/schemes/categories');
}

/**
 * Check eligibility
 */
async function checkEligibility(profile, lang = 'en') {
    return apiRequest(`/schemes/check-eligibility?lang=${lang}`, {
        method: 'POST',
        body: JSON.stringify(profile)
    });
}

// ============ Users API ============

/**
 * Register user
 */
async function registerUser(userData) {
    return apiRequest('/users/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
}

/**
 * Get user by phone
 */
async function getUser(phone) {
    return apiRequest(`/users/${phone}`);
}

/**
 * Update user profile
 */
async function updateUser(phone, updates) {
    return apiRequest(`/users/${phone}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
    });
}

/**
 * Get eligible schemes for user
 */
async function getUserEligibleSchemes(phone, lang = 'en') {
    return apiRequest(`/users/${phone}/eligible-schemes?lang=${lang}`);
}

// ============ Voice API ============

/**
 * Process voice input
 */
async function processVoiceInput(text, language = 'en', context = {}) {
    return apiRequest('/voice/process', {
        method: 'POST',
        body: JSON.stringify({ text, language, context })
    });
}

/**
 * Get TTS configuration
 */
async function getTTSConfig(text, language = 'en') {
    return apiRequest('/voice/tts', {
        method: 'POST',
        body: JSON.stringify({ text, language })
    });
}

/**
 * Get supported languages
 */
async function getSupportedLanguages() {
    return apiRequest('/voice/languages');
}

// ============ Export API ============

window.HIMAYA_API = {
    // Schemes
    getSchemes,
    getSchemeById,
    getSchemesByCategory,
    searchSchemes,
    getCategories,
    checkEligibility,

    // Users
    registerUser,
    getUser,
    updateUser,
    getUserEligibleSchemes,

    // Voice
    processVoiceInput,
    getTTSConfig,
    getSupportedLanguages
};
