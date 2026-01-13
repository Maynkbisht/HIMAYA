require('./setup');
const { I18nService, TRANSLATIONS } = require('../frontend/js/i18n');

describe('I18nService', () => {
    let service;

    beforeEach(() => {
        localStorage.clear();
        service = new I18nService();
    });

    test('should initialize with default language', () => {
        expect(service.currentLanguage).toBe('en');
        expect(service.get('app.title')).toBe(TRANSLATIONS.en.app.title);
    });

    test('should detect hindi language', () => {
        global.navigator.language = 'hi-IN';
        service = new I18nService();
        expect(service.currentLanguage).toBe('hi');
        global.navigator.language = 'en-US'; // Reset
    });

    test('should switch language', () => {
        service.setLanguage('hi');
        expect(service.currentLanguage).toBe('hi');
        expect(localStorage.getItem('himaya_language')).toBe('hi');
        expect(document.body.dataset.lang).toBe('hi');
    });

    test('should return key if translation missing', () => {
        expect(service.get('missing.key')).toBe('missing.key');
    });

    test('should interpolate parameters', () => {
        const key = 'eligibility.matchFound'; // "You're eligible for {count} scheme{plural}!"
        // Add to translations for test safety if structure changes, but for now rely on real one or mock it
        // Actually best to mock translations to be unit test
        service.translations = {
            en: {
                test: {
                    hello: "Hello {name}"
                }
            }
        };
        service.currentLanguage = 'en';
        
        expect(service.get('test.hello', { name: 'World' })).toBe('Hello World');
    });
});
