const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const schemeService = require("../services/schemeService");

// In-memory user store (would be a database in production)
const users = new Map();

// Register new user
router.post("/register", (req, res) => {
  try {
    const {
      phone,
      name,
      language = "en",
      age,
      gender,
      state,
      district,
      income,
      occupation,
      bpl = false,
      hasLand = false,
      landAcres = 0,
    } = req.body;

    if (!phone) {
      return res
        .status(400)
        .json({ success: false, error: "Phone number required" });
    }

    // Check if user exists
    if (users.has(phone)) {
      return res.status(409).json({
        success: false,
        error: "User already registered",
        user: users.get(phone),
      });
    }

    const user = {
      id: uuidv4(),
      phone,
      name: name || null,
      language,
      age: age || null,
      gender: gender || null,
      state: state || null,
      district: district || null,
      income: income || null,
      occupation: occupation || null,
      bpl,
      hasLand,
      landAcres,
      createdAt: new Date().toISOString(),
    };

    users.set(phone, user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user by phone
router.get("/:phone", (req, res) => {
  try {
    const { phone } = req.params;
    const user = users.get(phone);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user profile
router.patch("/:phone", (req, res) => {
  try {
    const { phone } = req.params;
    const updates = req.body;

    if (!users.has(phone)) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const user = users.get(phone);
    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    users.set(phone, updatedUser);

    res.json({
      success: true,
      message: "Profile updated",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get eligible schemes for user
router.get("/:phone/eligible-schemes", (req, res) => {
  try {
    const { phone } = req.params;
    const { lang } = req.query;
    const user = users.get(phone);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const userProfile = {
      age: user.age,
      income: user.income,
      occupation: user.occupation,
      gender: user.gender,
      bpl: user.bpl,
      hasLand: user.hasLand,
      landAcres: user.landAcres,
    };

    const language = lang || user.language || "en";
    const eligibleSchemes = schemeService.checkEligibility(
      userProfile,
      language
    );

    res.json({
      success: true,
      user: {
        phone: user.phone,
        name: user.name,
      },
      eligibleCount: eligibleSchemes.length,
      data: eligibleSchemes,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
