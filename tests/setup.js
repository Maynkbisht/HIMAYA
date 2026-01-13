// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    clear: function() {
      store = {};
    },
    removeItem: function(key) {
      delete store[key];
    }
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock window and document
global.window = {
  dispatchEvent: jest.fn(),
  localStorage: localStorageMock
};

global.document = {
  body: {
    dataset: {},
    setAttribute: jest.fn(),
    getAttribute: jest.fn()
  },
  querySelectorAll: jest.fn(() => []),
  getElementById: jest.fn()
};

global.CustomEvent = class CustomEvent {
  constructor(event, params) {
    this.event = event;
    this.params = params;
  }
};


global.navigator = {
  language: 'en-US'
};
