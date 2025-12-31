const express = require("express");
const cors = require("cors");
const path = require("path");

// Import routes
const schemeRoutes = require("./routes/schemes");
const userRoutes = require("./routes/users");
const voiceRoutes = require("./routes/voice");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, "../../frontend")));

// API Routes
app.use("/api/schemes", schemeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/voice", voiceRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: "HIMAYA API",
  });
});

// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "HIMAYA API",
    version: "1.0.0",
    description:
      "HIMAYA - Human-centred Inclusive Mobile Assistance for Yojana Access (Munsyari, Uttarakhand)",
    endpoints: {
      schemes: {
        "GET /api/schemes": "List all schemes",
        "GET /api/schemes/:id": "Get scheme details",
        "GET /api/schemes/category/:category": "Get schemes by category",
        "POST /api/schemes/check-eligibility": "Check eligibility for schemes",
      },
      users: {
        "POST /api/users/register": "Register new user",
        "GET /api/users/:phone": "Get user profile",
        "GET /api/users/:phone/eligible-schemes":
          "Get eligible schemes for user",
      },
      voice: {
        "POST /api/voice/process": "Process voice input and get response",
        "POST /api/voice/tts": "Convert text to speech data",
        "GET /api/voice/languages": "Get supported languages",
      },
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal server error",
      status: err.status || 500,
    },
  });
});

// Serve frontend for all non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/index.html"));
});

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`
+------------------------------------------------------------+
|                                                            |
|   🏔️ HIMAYA Server Started Successfully!                    |
|                                                            |
|   Local:   http://localhost:${PORT}                           |
|   API:     http://localhost:${PORT}/api                       |
|   Health:  http://localhost:${PORT}/api/health                |
|                                                            |
|   Apka Uttarakhandi Sahayak                                |
|                                                            |
+------------------------------------------------------------+
  `);
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Start with a different port, e.g. \`PORT=3001 npm start\`.`
    );
    process.exit(1);
  }
  console.error("Server error:", err);
});

module.exports = app;
