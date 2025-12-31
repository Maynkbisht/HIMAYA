const schemeService = require('./schemeService');
const languageService = require('./languageService');

// Intent patterns for natural language understanding
const intentPatterns = {
    LIST_SCHEMES: [
        /what (schemes?|yojana|योजना)/i,
        /show (me )?(all )?(schemes?|yojana)/i,
        /available (schemes?|yojana)/i,
        /list (schemes?|yojana)/i,
        /browse (schemes?|yojana)/i,
        /योजनाएं (दिखाओ|बताओ)/i,
        /कौन सी योजनाएं/i
    ],
    SEARCH_SCHEME: [
        /search for (.+)/i,
        /find (.+) scheme/i,
        /(.+) के बारे में बताओ/i,
        /tell me about (.+)/i
    ],
    SCHEME_DETAILS: [
        /details? (of|about|for) (.+)/i,
        /more (about|on) (.+)/i,
        /what is (.+)/i,
        /(.+) क्या है/i,
        /(.+) scheme/i
    ],
    CHECK_ELIGIBILITY: [
        /check (my )?eligibility/i,
        /am i eligible/i,
        /eligibility (check|verify)/i,
        /पात्रता (जांचें|देखें)/i,
        /क्या मैं पात्र हूं/i,
        /eligible for (.+)/i
    ],
    CATEGORY_SCHEMES: [
        /schemes? (for|in|about) (farmers?|agriculture|कृषि|किसान)/i,
        /schemes? (for|in|about) (health|healthcare|स्वास्थ्य)/i,
        /schemes? (for|in|about) (education|शिक्षा)/i,
        /schemes? (for|in|about) (housing|आवास|घर)/i,
        /schemes? (for|in|about) (women|महिला)/i,
        /(farmer|किसान) schemes?/i,
        /(health|स्वास्थ्य) schemes?/i
    ],
    HOW_TO_APPLY: [
        /how (to|do i) apply/i,
        /apply for (.+)/i,
        /application process/i,
        /आवेदन कैसे करें/i,
        /कैसे आवेदन करूं/i
    ],
    HELP: [
        /help/i,
        /मदद/i,
        /what can you do/i,
        /options/i,
        /menu/i
    ],
    GREETING: [
        /^(hello|hi|hey|namaste|नमस्ते)/i,
        /good (morning|afternoon|evening)/i
    ],
    LANGUAGE_CHANGE: [
        /change language/i,
        /speak (in )?(hindi|english)/i,
        /हिंदी में बोलो/i,
        /switch to (hindi|english)/i
    ]
};

// DTMF to intent mapping
const dtmfMapping = {
    '1': 'LIST_SCHEMES',
    '2': 'CHECK_ELIGIBILITY',
    '3': 'HELP',
    '4': 'LANGUAGE_CHANGE',
    '0': 'REPEAT',
    '*': 'TRANSFER',
    '#': 'MAIN_MENU'
};

/**
 * Process voice input and generate response
 */
function processInput(text, language = 'en', context = {}) {
    const intent = detectIntent(text);
    const entities = extractEntities(text, intent);

    return generateResponse(intent, entities, language, context);
}

/**
 * Detect intent from text
 */
function detectIntent(text) {
    for (const [intent, patterns] of Object.entries(intentPatterns)) {
        for (const pattern of patterns) {
            if (pattern.test(text)) {
                return intent;
            }
        }
    }
    return 'UNKNOWN';
}

/**
 * Extract entities from text
 */
function extractEntities(text, intent) {
    const entities = {};

    // Extract scheme name if mentioned
    const schemePatterns = [
        /pm[- ]?kisan/i,
        /ayushman/i,
        /ujjwala/i,
        /mudra/i,
        /jan[- ]?dhan/i,
        /fasal bima/i,
        /awas/i,
        /sukanya/i
    ];

    for (const pattern of schemePatterns) {
        const match = text.match(pattern);
        if (match) {
            entities.schemeName = match[0].toLowerCase().replace(/[- ]/g, '-');
        }
    }

    // Extract category
    const categoryMap = {
        'farmer': 'agriculture',
        'किसान': 'agriculture',
        'कृषि': 'agriculture',
        'agriculture': 'agriculture',
        'health': 'healthcare',
        'स्वास्थ्य': 'healthcare',
        'education': 'education',
        'शिक्षा': 'education',
        'housing': 'housing',
        'आवास': 'housing',
        'women': 'women-child',
        'महिला': 'women-child'
    };

    for (const [word, category] of Object.entries(categoryMap)) {
        if (text.toLowerCase().includes(word)) {
            entities.category = category;
            break;
        }
    }

    // Extract numbers (age, income)
    const numbers = text.match(/\d+/g);
    if (numbers) {
        entities.numbers = numbers.map(n => parseInt(n));
    }

    return entities;
}

/**
 * Generate response based on intent
 */
function generateResponse(intent, entities, language, context) {
    const lang = languageService;

    switch (intent) {
        case 'GREETING':
            return {
                intent,
                text: lang.getResponse('greeting', language),
                followUp: true,
                actions: ['LIST_SCHEMES', 'CHECK_ELIGIBILITY', 'HELP']
            };

        case 'LIST_SCHEMES':
            const schemes = entities.category
                ? schemeService.getSchemesByCategory(entities.category, language)
                : schemeService.getAllSchemes(language);

            const schemeList = schemes.slice(0, 5).map((s, i) =>
                `${i + 1}. ${s.name} - ${s.shortDescription}`
            ).join('\n');

            return {
                intent,
                text: lang.getResponse('schemeList', language, { count: schemes.length }) + '\n' + schemeList,
                data: schemes.slice(0, 5),
                followUp: true,
                actions: ['SCHEME_DETAILS', 'CHECK_ELIGIBILITY']
            };

        case 'SCHEME_DETAILS':
        case 'SEARCH_SCHEME':
            if (entities.schemeName) {
                const scheme = schemeService.getSchemeById(entities.schemeName, language);
                if (scheme) {
                    return {
                        intent: 'SCHEME_DETAILS',
                        text: lang.formatSchemeDetails(scheme, language),
                        data: scheme,
                        followUp: true,
                        actions: ['HOW_TO_APPLY', 'CHECK_ELIGIBILITY', 'LIST_SCHEMES']
                    };
                }
            }
            return {
                intent: 'SEARCH_SCHEME',
                text: lang.getResponse('schemeNotFound', language),
                followUp: true,
                actions: ['LIST_SCHEMES']
            };

        case 'CHECK_ELIGIBILITY':
            return {
                intent,
                text: lang.getResponse('eligibilityStart', language),
                followUp: true,
                actions: ['COLLECT_AGE'],
                nextStep: 'age'
            };

        case 'CATEGORY_SCHEMES':
            const category = entities.category || 'agriculture';
            const catSchemes = schemeService.getSchemesByCategory(category, language);
            const catList = catSchemes.map((s, i) =>
                `${i + 1}. ${s.name}`
            ).join('\n');

            return {
                intent,
                text: lang.getResponse('categorySchemes', language, {
                    category: category,
                    count: catSchemes.length
                }) + '\n' + catList,
                data: catSchemes,
                followUp: true,
                actions: ['SCHEME_DETAILS']
            };

        case 'HOW_TO_APPLY':
            if (context.currentScheme) {
                const scheme = schemeService.getSchemeById(context.currentScheme, language);
                if (scheme) {
                    return {
                        intent,
                        text: scheme.howToApply,
                        data: { documents: scheme.documents, helpline: scheme.helpline },
                        followUp: true,
                        actions: ['LIST_SCHEMES', 'CHECK_ELIGIBILITY']
                    };
                }
            }
            return {
                intent,
                text: lang.getResponse('selectSchemeFirst', language),
                followUp: true,
                actions: ['LIST_SCHEMES']
            };

        case 'HELP':
            return {
                intent,
                text: lang.getResponse('help', language),
                followUp: true,
                actions: ['LIST_SCHEMES', 'CHECK_ELIGIBILITY']
            };

        case 'LANGUAGE_CHANGE':
            const newLang = language === 'en' ? 'hi' : 'en';
            return {
                intent,
                text: lang.getResponse('languageChanged', newLang),
                language: newLang,
                followUp: true,
                actions: ['MAIN_MENU']
            };

        default:
            return {
                intent: 'UNKNOWN',
                text: lang.getResponse('notUnderstood', language),
                followUp: true,
                actions: ['HELP', 'LIST_SCHEMES']
            };
    }
}

/**
 * Convert DTMF digit to intent
 */
function dtmfToIntent(digits) {
    return dtmfMapping[digits] || 'UNKNOWN';
}

module.exports = {
    processInput,
    detectIntent,
    extractEntities,
    dtmfToIntent
};
