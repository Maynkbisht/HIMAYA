/**
 * HIMAYA - Internationalization (i18n) Service
 */

const TRANSLATIONS = {
  en: {
    app: {
      title: "HIMAYA - Uttarakhand Government Scheme Assistant",
      tagline: "Apka Uttarakhandi Sahayak",
      loading: "Loading...",
      close: "Close"
    },
    nav: {
      switchLanguage: "Switch language"
    },
    hero: {
      title: "Find Government Schemes Using Your Voice",
      subtitle: "Say \"What schemes are available?\" or tap the microphone",
      tapToSpeak: "Tap to speak",
      listening: "Listening...",
      processing: "Processing..."
    },
    actions: {
      title: "Quick Actions",
      browseSchemes: "Browse Schemes",
      checkEligibility: "Check Eligibility",
      categories: "Categories",
      help: "Help"
    },
    common: {
      select: "Select...",
      loading: "Loading..."
    },
    schemes: {
      title: "Government Schemes",
      searchPlaceholder: "Search schemes...",
      noResults: "No schemes found",
      benefit: "Benefit"
    },
    categories: {
      title: "Scheme Categories",
      schemeCount: "schemes"
    },
    eligibility: {
      title: "Check Your Eligibility",
      age: "Age",
      income: "Annual Income (₹)",
      occupation: "Occupation",
      gender: "Gender",
      bpl: "BPL Card Holder",
      land: "Own Agricultural Land",
      submit: "Check Eligibility",
      resultsTitle: "Eligibility Results",
      matchFound: "You're eligible for {count} scheme{plural}!",
      noMatch: "No matching schemes found",
      tryAgain: "Try adjusting your profile or browse all schemes."
    },
    detail: {
      description: "Description",
      eligibility: "Eligibility",
      howToApply: "How to Apply",
      documents: "Documents Required",
      noDocuments: "No specific documents listed",
      visitWebsite: "Visit Official Website"
    },
    errors: {
      generic: "Error",
      network: "Please check your connection and try again.",
      offline: "You're offline. Some features may be limited.",
      loadSchemes: "Failed to load schemes",
      checkEligibility: "Error checking eligibility"
    },
    help: {
      voiceInstruction: "You can use the microphone button to find schemes. Say \"schemes\" or \"check my eligibility\"."
    }
  },
  hi: {
    app: {
      title: "हिमाया - उत्तराखंड सरकारी योजना सहायक",
      tagline: "आपका उत्तराखंडी सहायक",
      loading: "लोड हो रहा है...",
      close: "बंद करें"
    },
    nav: {
      switchLanguage: "भाषा बदलें"
    },
    hero: {
      title: "अपनी आवाज़ से सरकारी योजनाएं खोजें",
      subtitle: "\"क्या योजनाएं उपलब्ध हैं?\" कहें या माइक्रोफ़ोन टैप करें",
      tapToSpeak: "बोलने के लिए दबाएं",
      listening: "सुन रहा हूँ...",
      processing: "प्रोसेस हो रहा है..."
    },
    actions: {
      title: "त्वरित कार्य",
      browseSchemes: "योजनाएं देखें",
      checkEligibility: "पात्रता जांचें",
      categories: "श्रेणियाँ",
      help: "मदद"
    },
    common: {
      select: "चुनें...",
      loading: "लोड हो रहा है..."
    },
    schemes: {
      title: "सरकारी योजनाएं",
      searchPlaceholder: "योजनाएं खोजें...",
      noResults: "कोई योजना नहीं मिली",
      benefit: "लाभ"
    },
    categories: {
      title: "योजना श्रेणियाँ",
      schemeCount: "योजनाएं"
    },
    eligibility: {
      title: "अपनी पात्रता जांचें",
      age: "उम्र",
      income: "वार्षिक आय (₹)",
      occupation: "पेशा",
      gender: "लिंग",
      bpl: "BPL कार्ड धारक",
      land: "कृषि भूमि है",
      submit: "पात्रता जांचें",
      resultsTitle: "पात्रता परिणाम",
      matchFound: "आप {count} योजना{plural} के लिए पात्र हैं!",
      noMatch: "कोई मिलती-जुलती योजना नहीं मिली",
      tryAgain: "अपनी प्रोफाइल बदलें या सभी योजनाएं देखें।"
    },
    detail: {
      description: "विवरण",
      eligibility: "पात्रता",
      howToApply: "आवेदन कैसे करें",
      documents: "आवश्यक दस्तावेज",
      noDocuments: "कोई विशिष्ट दस्तावेज सूचीबद्ध नहीं हैं",
      visitWebsite: "आधिकारिक वेबसाइट"
    },
    errors: {
      generic: "त्रुटि",
      network: "कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।",
      offline: "आप ऑफलाइन हैं। कुछ सुविधाएं सीमित हो सकती हैं।",
      loadSchemes: "योजनाएं लोड करने में विफल",
      checkEligibility: "पात्रता जांचने में त्रुटि"
    },
    help: {
      voiceInstruction: "आप योजनाएं खोजने के लिए माइक्रोफोन बटन का उपयोग कर सकते हैं। \"योजनाएं\" या \"पात्रता जांचें\" बोलें।"
    }
  }
};

class I18nService {
  constructor() {
    this.currentLanguage = localStorage.getItem('himaya_language') || this.detectLanguage();
    this.translations = TRANSLATIONS;
  }

  detectLanguage() {
    // Check browser language
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('hi')) {
      return 'hi';
    }
    return 'en';
  }

  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLanguage = lang;
      localStorage.setItem('himaya_language', lang);
      document.body.dataset.lang = lang; // Update CSS hook
      this.updatePageContent();
      return true;
    }
    return false;
  }

  get(key, params = {}) {
    const keys = key.split('.');
    let value = this.translations[this.currentLanguage];
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return key; // Fallback to key if not found
      }
    }

    // Interpolate params
    if (typeof value === 'string') {
      return value.replace(/{(\w+)}/g, (_, k) => params[k] !== undefined ? params[k] : `{${k}}`);
    }

    return value;
  }

  // Helper to translate element text content by data-i18n attribute
  updatePageContent() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const translated = this.get(key);
      if (translated !== key) {
        if (el.tagName === 'INPUT' && el.placeholder) {
            el.placeholder = translated;
        } else {
            el.textContent = translated;
        }
      }
    });

    // Also dispatch event for other components
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: this.currentLanguage } }));
  }
}

// Global instance
window.i18n = new I18nService();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { I18nService, TRANSLATIONS };
}
