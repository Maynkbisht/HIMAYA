const router = require("express").Router();
const voiceService = require("../services/voiceService");
const languageService = require("../services/languageService");

// Get supported languages
router.get("/languages", (req, res) => {
  res.json({
    success: true,
    data: languageService.getSupportedLanguages(),
  });
});

// Process voice input (text from STT)
router.post("/process", (req, res) => {
  try {
    const { text, language = "en", sessionId, context = {} } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "Text input required",
        hint: "Send transcribed text from speech-to-text",
      });
    }

    const response = voiceService.processInput(text, language, context);

    res.json({
      success: true,
      input: text,
      language,
      sessionId,
      response: {
        intent: response.intent,
        text: response.text,
        data: response.data,
        followUp: response.followUp,
        actions: response.actions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get TTS-ready response
router.post("/tts", (req, res) => {
  try {
    const { text, language = "en" } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: "Text required" });
    }

    // For browser TTS, we just return the text and language
    // In production, this would call a TTS API and return audio
    res.json({
      success: true,
      tts: {
        text: text,
        language: language,
        voice: languageService.getVoiceForLanguage(language),
        rate: 0.9,
        pitch: 1.0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// IVR webhook simulation
router.post("/ivr/callback", (req, res) => {
  try {
    const { callId, event, digits, speechResult, language = "en" } = req.body;

    let input = "";
    if (speechResult) {
      input = speechResult;
    } else if (digits) {
      input = voiceService.dtmfToIntent(digits);
    }

    const response = voiceService.processInput(input, language, {
      callId,
      event,
    });

    // Format for IVR system (Twilio-like response)
    res.json({
      success: true,
      callId,
      response: {
        say: {
          text: response.text,
          language: language === "hi" ? "hi-IN" : "en-IN",
          voice: language === "hi" ? "Polly.Aditi" : "Polly.Raveena",
        },
        gather: response.followUp
          ? {
              input: ["speech", "dtmf"],
              timeout: 5,
              speechTimeout: "auto",
              action: "/api/voice/ivr/callback",
            }
          : null,
        hangup: !response.followUp,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get conversation prompts for a given context
router.get("/prompts/:context", (req, res) => {
  try {
    const { context } = req.params;
    const { lang = "en" } = req.query;

    const prompts = languageService.getPromptsForContext(context, lang);

    res.json({
      success: true,
      context,
      language: lang,
      prompts,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
