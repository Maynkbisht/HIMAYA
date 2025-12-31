// Supported languages
const languages = {
    en: {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        voice: 'en-IN',
        ttsVoice: 'Raveena'
    },
    hi: {
        code: 'hi',
        name: 'Hindi',
        nativeName: 'हिंदी',
        voice: 'hi-IN',
        ttsVoice: 'Aditi'
    }
};

// Response templates
const responses = {
    greeting: {
        en: "Hello and welcome to HIMAYA, your local guide for government schemes in Uttarakhand. I can help you find schemes you're eligible for. Say 'schemes' to browse, or 'eligibility' to check what you qualify for.",
        hi: "नमस्ते! हिमाया में आपका स्वागत है, उत्तराखंड की सरकारी योजनाओं के लिए आपका स्थानीय मार्गदर्शक। मैं आपको पात्र योजनाएं खोजने में मदद कर सकता हूं। योजनाएं देखने के लिए 'योजनाएं' बोलें, या पात्रता जांचने के लिए 'पात्रता' बोलें।"
    },
    schemeList: {
        en: "I found {count} schemes. Here are the top ones:",
        hi: "मुझे {count} योजनाएं मिलीं। यहां शीर्ष योजनाएं हैं:"
    },
    categorySchemes: {
        en: "Here are {count} schemes in {category}:",
        hi: "{category} में {count} योजनाएं हैं:"
    },
    schemeNotFound: {
        en: "I couldn't find that scheme. Would you like me to list all available schemes?",
        hi: "मुझे वह योजना नहीं मिली। क्या आप चाहते हैं कि मैं सभी उपलब्ध योजनाएं दिखाऊं?"
    },
    eligibilityStart: {
        en: "I'll help you check your eligibility. Please tell me your age.",
        hi: "मैं आपकी पात्रता जांचने में मदद करूंगा। कृपया अपनी उम्र बताएं।"
    },
    eligibilityResult: {
        en: "Based on your profile, you are eligible for {count} schemes:",
        hi: "आपकी जानकारी के आधार पर, आप {count} योजनाओं के लिए पात्र हैं:"
    },
    noEligibleSchemes: {
        en: "Based on the information provided, I couldn't find matching schemes. Would you like to browse all schemes?",
        hi: "दी गई जानकारी के आधार पर, मुझे मिलती-जुलती योजनाएं नहीं मिलीं। क्या आप सभी योजनाएं देखना चाहेंगे?"
    },
    selectSchemeFirst: {
        en: "Please select a scheme first. Say 'schemes' to see the list.",
        hi: "कृपया पहले कोई योजना चुनें। सूची देखने के लिए 'योजनाएं' बोलें।"
    },
    help: {
        en: "I can help you with:\n1. Browse government schemes - say 'schemes'\n2. Check your eligibility - say 'eligibility'\n3. Get scheme details - say the scheme name\n4. Filter by category - say 'farmer schemes' or 'health schemes'\n\nWhat would you like to do?",
        hi: "मैं आपकी इन चीजों में मदद कर सकता हूं:\n1. सरकारी योजनाएं देखें - 'योजनाएं' बोलें\n2. पात्रता जांचें - 'पात्रता' बोलें\n3. योजना विवरण - योजना का नाम बोलें\n4. श्रेणी के अनुसार - 'किसान योजनाएं' या 'स्वास्थ्य योजनाएं' बोलें\n\nआप क्या करना चाहेंगे?"
    },
    notUnderstood: {
        en: "I didn't quite understand that. You can say 'help' for options, or 'schemes' to browse available schemes.",
        hi: "मैं समझ नहीं पाया। आप मदद के लिए 'मदद' बोल सकते हैं, या योजनाएं देखने के लिए 'योजनाएं' बोलें।"
    },
    languageChanged: {
        en: "Language changed to English. How can I help you?",
        hi: "भाषा हिंदी में बदल दी गई है। मैं आपकी कैसे मदद कर सकता हूं?"
    },
    goodbye: {
        en: "Thank you for using HIMAYA. Hope to see you back in the mountains! Goodbye!",
        hi: "हिमाया का उपयोग करने के लिए धन्यवाद। पहाड़ों में फिर मिलेंगे! अलविदा!"
    },
    askAge: {
        en: "What is your age?",
        hi: "आपकी उम्र क्या है?"
    },
    askIncome: {
        en: "What is your annual income in rupees?",
        hi: "आपकी वार्षिक आय कितनी है (रुपयों में)?"
    },
    askOccupation: {
        en: "What is your occupation? For example: farmer, self-employed, student, employed",
        hi: "आपका पेशा क्या है? उदाहरण: किसान, स्व-रोजगार, छात्र, नौकरी"
    },
    askBPL: {
        en: "Do you have a BPL (Below Poverty Line) card? Say yes or no.",
        hi: "क्या आपके पास BPL (गरीबी रेखा से नीचे) कार्ड है? हां या नहीं बोलें।"
    },
    askLand: {
        en: "Do you own agricultural land? If yes, how many acres?",
        hi: "क्या आपके पास कृषि भूमि है? यदि हां, तो कितने एकड़?"
    }
};

// Prompts for different contexts
const prompts = {
    welcome: {
        en: {
            main: "Welcome to HIMAYA",
            instruction: "Press 1 for English, 2 for Hindi"
        },
        hi: {
            main: "हिमाया में आपका स्वागत है",
            instruction: "English के लिए 1, हिंदी के लिए 2 दबाएं"
        }
    },
    mainMenu: {
        en: {
            main: "Main Menu",
            options: [
                "Press 1 to browse schemes",
                "Press 2 to check eligibility",
                "Press 3 for help",
                "Press 4 to change language"
            ]
        },
        hi: {
            main: "मुख्य मेनू",
            options: [
                "योजनाएं देखने के लिए 1 दबाएं",
                "पात्रता जांचने के लिए 2 दबाएं",
                "मदद के लिए 3 दबाएं",
                "भाषा बदलने के लिए 4 दबाएं"
            ]
        }
    }
};

/**
 * Get supported languages
 */
function getSupportedLanguages() {
    return Object.values(languages);
}

/**
 * Get voice configuration for language
 */
function getVoiceForLanguage(lang) {
    return languages[lang]?.voice || 'en-IN';
}

/**
 * Get response text for a key
 */
function getResponse(key, lang = 'en', params = {}) {
    let text = responses[key]?.[lang] || responses[key]?.['en'] || '';

    // Replace placeholders
    for (const [param, value] of Object.entries(params)) {
        text = text.replace(`{${param}}`, value);
    }

    return text;
}

/**
 * Format scheme details for voice output
 */
function formatSchemeDetails(scheme, lang = 'en') {
    if (lang === 'hi') {
        return `${scheme.name}। ${scheme.shortDescription}। ` +
            `इस योजना में ${scheme.benefitDescription} का लाभ मिलता है। ` +
            `अधिक जानकारी के लिए ${scheme.helpline} पर कॉल करें।`;
    }

    return `${scheme.name}. ${scheme.shortDescription}. ` +
        `This scheme provides ${scheme.benefitDescription}. ` +
        `For more information, call ${scheme.helpline}.`;
}

/**
 * Get prompts for a context
 */
function getPromptsForContext(context, lang = 'en') {
    return prompts[context]?.[lang] || prompts[context]?.['en'] || {};
}

module.exports = {
    getSupportedLanguages,
    getVoiceForLanguage,
    getResponse,
    formatSchemeDetails,
    getPromptsForContext
};
