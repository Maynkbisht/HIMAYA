const schemes = require('../data/schemes.json');

const categories = [
    { id: 'agriculture', name: 'Agriculture', nameHi: 'कृषि', icon: '🌾' },
    { id: 'healthcare', name: 'Healthcare', nameHi: 'स्वास्थ्य', icon: '🏥' },
    { id: 'education', name: 'Education', nameHi: 'शिक्षा', icon: '📚' },
    { id: 'housing', name: 'Housing', nameHi: 'आवास', icon: '🏠' },
    { id: 'women-child', name: 'Women & Child', nameHi: 'महिला एवं बाल', icon: '👩‍👧' },
    { id: 'employment', name: 'Employment', nameHi: 'रोजगार', icon: '💼' },
    { id: 'social-security', name: 'Social Security', nameHi: 'सामाजिक सुरक्षा', icon: '🛡️' },
    { id: 'financial', name: 'Financial Inclusion', nameHi: 'वित्तीय समावेशन', icon: '💰' }
];

/**
 * Get all schemes with localized content
 */
function getAllSchemes(lang = 'en') {
    return schemes.map(scheme => formatScheme(scheme, lang));
}

/**
 * Get scheme by ID
 */
function getSchemeById(id, lang = 'en') {
    const scheme = schemes.find(s => s.id === id);
    if (!scheme) return null;
    return formatScheme(scheme, lang, true);
}

/**
 * Get schemes by category
 */
function getSchemesByCategory(category, lang = 'en') {
    return schemes
        .filter(s => s.category === category)
        .map(scheme => formatScheme(scheme, lang));
}

/**
 * Search schemes by keyword
 */
function searchSchemes(query, lang = 'en') {
    const q = query.toLowerCase();

    return schemes.filter(scheme => {
        const translation = scheme.translations[lang] || scheme.translations['en'];
        return (
            scheme.name.toLowerCase().includes(q) ||
            scheme.id.includes(q) ||
            scheme.category.includes(q) ||
            translation.name.toLowerCase().includes(q) ||
            translation.description.toLowerCase().includes(q) ||
            translation.shortDescription.toLowerCase().includes(q)
        );
    }).map(scheme => formatScheme(scheme, lang));
}

/**
 * Get all categories
 */
function getCategories() {
    return categories.map(cat => ({
        ...cat,
        schemeCount: schemes.filter(s => s.category === cat.id).length
    }));
}

/**
 * Check eligibility for all schemes based on user profile
 */
function checkEligibility(userProfile, lang = 'en') {
    const {
        age,
        income,
        occupation,
        gender,
        bpl,
        hasLand,
        landAcres,
        category: userCategory
    } = userProfile;

    const eligibleSchemes = [];

    for (const scheme of schemes) {
        const eligibility = scheme.eligibility;
        let isEligible = true;
        const reasons = [];
        const missingInfo = [];

        // Check age
        if (eligibility.minAge !== null) {
            if (age === undefined || age === null) {
                missingInfo.push('age');
            } else if (age < eligibility.minAge) {
                isEligible = false;
                reasons.push(`Minimum age is ${eligibility.minAge}`);
            }
        }
        if (eligibility.maxAge !== null) {
            if (age === undefined || age === null) {
                if (!missingInfo.includes('age')) missingInfo.push('age');
            } else if (age > eligibility.maxAge) {
                isEligible = false;
                reasons.push(`Maximum age is ${eligibility.maxAge}`);
            }
        }

        // Check income
        if (eligibility.maxIncome !== null) {
            if (income === undefined || income === null) {
                missingInfo.push('income');
            } else if (income > eligibility.maxIncome) {
                isEligible = false;
                reasons.push(`Income must be below ₹${eligibility.maxIncome.toLocaleString()}`);
            }
        }

        // Check occupation
        if (eligibility.occupation !== null) {
            if (!occupation) {
                missingInfo.push('occupation');
            } else if (!eligibility.occupation.includes(occupation.toLowerCase())) {
                isEligible = false;
                reasons.push(`Must be: ${eligibility.occupation.join(' or ')}`);
            }
        }

        // Check gender
        if (eligibility.gender !== null) {
            if (!gender) {
                missingInfo.push('gender');
            } else if (gender.toLowerCase() !== eligibility.gender) {
                isEligible = false;
                reasons.push(`Only for ${eligibility.gender}`);
            }
        }

        // Check BPL status
        if (eligibility.bpl === true) {
            if (bpl === undefined || bpl === null) {
                missingInfo.push('bpl');
            } else if (!bpl) {
                isEligible = false;
                reasons.push('Must have BPL card');
            }
        }

        // Check land ownership
        if (eligibility.hasLand === true) {
            if (hasLand === undefined || hasLand === null) {
                missingInfo.push('hasLand');
            } else if (!hasLand) {
                isEligible = false;
                reasons.push('Must own agricultural land');
            }
        }

        // Check caste category if applicable
        if (eligibility.category) {
            if (!userCategory) {
                missingInfo.push('category');
            } else if (userCategory.toUpperCase() !== eligibility.category) {
                isEligible = false;
                reasons.push(`Only for ${eligibility.category} category`);
            }
        }

        if (isEligible && reasons.length === 0) {
            const formattedScheme = formatScheme(scheme, lang);
            formattedScheme.eligibilityStatus = 'eligible';
            formattedScheme.missingInfo = missingInfo;
            eligibleSchemes.push(formattedScheme);
        }
    }

    return eligibleSchemes;
}

/**
 * Format scheme with localized content
 */
function formatScheme(scheme, lang = 'en', includeDetails = false) {
    const translation = scheme.translations[lang] || scheme.translations['en'];
    const category = categories.find(c => c.id === scheme.category);

    const formatted = {
        id: scheme.id,
        name: translation.name,
        category: scheme.category,
        categoryName: lang === 'hi' ? category?.nameHi : category?.name,
        categoryIcon: category?.icon,
        ministry: scheme.ministry,
        benefitAmount: scheme.benefitAmount,
        benefitFrequency: scheme.benefitFrequency,
        benefitDescription: translation.benefitDescription || scheme.benefitDescription,
        shortDescription: translation.shortDescription,
        website: scheme.website,
        helpline: translation.helplineNumber,
        isActive: scheme.isActive
    };

    if (includeDetails) {
        formatted.description = translation.description;
        formatted.eligibilityText = translation.eligibilityText;
        formatted.howToApply = translation.howToApply;
        formatted.documents = scheme.documents;
        formatted.eligibilityCriteria = scheme.eligibility;
        formatted.launchYear = scheme.launchYear;
    }

    return formatted;
}

module.exports = {
    getAllSchemes,
    getSchemeById,
    getSchemesByCategory,
    searchSchemes,
    getCategories,
    checkEligibility
};
