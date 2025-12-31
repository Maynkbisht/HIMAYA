/**
 * HIMAYA - Voice Interface Module
 * Handles Speech-to-Text and Text-to-Speech using Web Speech API
 */

class VoiceInterface {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.currentLanguage = 'en-IN';
        this.voiceButton = null;
        this.statusElement = null;
        this.responseElement = null;

        this.init();
    }

    /**
     * Initialize the voice interface
     */
    init() {
        // Check for browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            this.showNotSupportedMessage();
            return;
        }

        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        this.setupRecognitionEvents();
        this.setupElements();
    }

    /**
     * Set up DOM elements
     */
    setupElements() {
        this.voiceButton = document.getElementById('voice-button');
        this.statusElement = document.getElementById('voice-status');
        this.responseElement = document.getElementById('voice-response');

        if (this.voiceButton) {
            this.voiceButton.addEventListener('click', () => this.toggleListening());
        }
    }

    /**
     * Set up speech recognition event handlers
     */
    setupRecognitionEvents() {
        if (!this.recognition) return;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateUI('listening');
            console.log('Voice recognition started');
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            // Show interim results
            if (interimTranscript) {
                this.updateStatus(`"${interimTranscript}"...`);
            }

            // Process final result
            if (finalTranscript) {
                this.processTranscript(finalTranscript);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;

            let errorMessage = 'Error occurred. Please try again.';

            switch (event.error) {
                case 'no-speech':
                    errorMessage = 'No speech detected. Please try again.';
                    break;
                case 'audio-capture':
                    errorMessage = 'No microphone found. Please check your device.';
                    break;
                case 'not-allowed':
                    errorMessage = 'Microphone access denied. Please allow access.';
                    break;
                case 'network':
                    errorMessage = 'Network error. Please check your connection.';
                    break;
            }

            this.updateUI('error', errorMessage);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            if (this.voiceButton) {
                this.voiceButton.classList.remove('listening');
            }
            console.log('Voice recognition ended');
        };
    }

    /**
     * Toggle listening state
     */
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    /**
     * Start listening for voice input
     */
    startListening() {
        if (!this.recognition) {
            alert('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
            return;
        }

        try {
            this.recognition.lang = this.currentLanguage;
            this.recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
            // Recognition might already be running
            this.recognition.stop();
            setTimeout(() => this.recognition.start(), 100);
        }
    }

    /**
     * Stop listening
     */
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    /**
     * Process the transcribed text
     */
    async processTranscript(transcript) {
        console.log('Processing transcript:', transcript);
        this.updateStatus(`Processing: "${transcript}"`);

        try {
            // Send to backend for NLU processing
            const language = this.currentLanguage.startsWith('hi') ? 'hi' : 'en';
            const response = await HIMAYA_API.processVoiceInput(transcript, language);

            if (response.success) {
                const responseText = response.response.text;

                // Show response
                this.showResponse(responseText);

                // Speak the response
                await this.speak(responseText, language);

                // Handle actions if any
                if (response.response.data) {
                    this.handleResponseData(response.response);
                }
            }
        } catch (error) {
            console.error('Error processing voice input:', error);
            this.showResponse('Sorry, I encountered an error. Please try again.');
            this.speak('Sorry, I encountered an error. Please try again.', 'en');
        }

        this.updateUI('ready');
    }

    /**
     * Handle response data (e.g., show schemes list)
     */
    handleResponseData(response) {
        if (response.data && Array.isArray(response.data)) {
            // Dispatch custom event for the app to handle
            window.dispatchEvent(new CustomEvent('voiceResponse', {
                detail: {
                    intent: response.intent,
                    data: response.data
                }
            }));
        }
    }

    /**
     * Speak text using Text-to-Speech
     */
    speak(text, language = 'en') {
        return new Promise((resolve) => {
            if (!this.synthesis) {
                console.warn('Speech synthesis not supported');
                resolve();
                return;
            }

            // Cancel any ongoing speech
            this.synthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
            utterance.rate = 0.9;
            utterance.pitch = 1;

            // Try to find an Indian voice
            const voices = this.synthesis.getVoices();
            const preferredVoice = voices.find(v =>
                v.lang.includes(language === 'hi' ? 'hi' : 'en') &&
                v.lang.includes('IN')
            );

            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }

            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();

            this.synthesis.speak(utterance);
        });
    }

    /**
     * Stop speaking
     */
    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
        }
    }

    /**
     * Update UI based on state
     */
    updateUI(state, message = '') {
        if (!this.voiceButton || !this.statusElement) return;

        switch (state) {
            case 'listening':
                this.voiceButton.classList.add('listening');
                this.updateStatus(this.currentLanguage.startsWith('hi')
                    ? 'सुन रहा हूं...'
                    : 'Listening...');
                break;

            case 'error':
                this.voiceButton.classList.remove('listening');
                this.updateStatus(message);
                break;

            case 'ready':
            default:
                this.voiceButton.classList.remove('listening');
                this.updateStatus(this.currentLanguage.startsWith('hi')
                    ? 'बोलने के लिए दबाएं'
                    : 'Tap to speak');
                break;
        }
    }

    /**
     * Update status text
     */
    updateStatus(text) {
        if (this.statusElement) {
            // Remove language spans and set text directly
            this.statusElement.innerHTML = text;
        }
    }

    /**
     * Show response text
     */
    showResponse(text) {
        if (this.responseElement) {
            this.responseElement.hidden = false;
            const textElement = this.responseElement.querySelector('.response-text');
            if (textElement) {
                textElement.textContent = text;
            }
        }
    }

    /**
     * Hide response
     */
    hideResponse() {
        if (this.responseElement) {
            this.responseElement.hidden = true;
        }
    }

    /**
     * Set language
     */
    setLanguage(language) {
        this.currentLanguage = language === 'hi' ? 'hi-IN' : 'en-IN';
        this.updateUI('ready');
    }

    /**
     * Show not supported message
     */
    showNotSupportedMessage() {
        if (this.voiceButton) {
            this.voiceButton.disabled = true;
            this.voiceButton.title = 'Voice input not supported in this browser';
        }
        if (this.statusElement) {
            this.statusElement.textContent = 'Voice not supported. Use text input or try Chrome.';
        }
    }
}

// Initialize voice interface
window.voiceInterface = new VoiceInterface();

// Load voices when available
if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
        console.log('Voices loaded:', window.speechSynthesis.getVoices().length);
    };
}
