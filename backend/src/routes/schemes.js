const express = require("express");
const router = require("express").Router();
const schemeService = require("../services/schemeService");

// Get all schemes
router.get("/", (req, res) => {
  try {
    const { lang = "en", category } = req.query;
    let schemes = schemeService.getAllSchemes(lang);

    if (category) {
      schemes = schemes.filter((s) => s.category === category);
    }

    res.json({
      success: true,
      count: schemes.length,
      data: schemes,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get scheme categories
router.get("/categories", (req, res) => {
  try {
    const categories = schemeService.getCategories();
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get schemes by category
router.get("/category/:category", (req, res) => {
  try {
    const { category } = req.params;
    const { lang = "en" } = req.query;
    const schemes = schemeService.getSchemesByCategory(category, lang);

    res.json({
      success: true,
      count: schemes.length,
      category: category,
      data: schemes,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search schemes
router.get("/search", (req, res) => {
  try {
    const { q, lang = "en" } = req.query;
    if (!q) {
      return res
        .status(400)
        .json({ success: false, error: "Search query required" });
    }

    const schemes = schemeService.searchSchemes(q, lang);
    res.json({
      success: true,
      query: q,
      count: schemes.length,
      data: schemes,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get scheme by ID
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { lang = "en" } = req.query;
    const scheme = schemeService.getSchemeById(id, lang);

    if (!scheme) {
      return res
        .status(404)
        .json({ success: false, error: "Scheme not found" });
    }

    res.json({
      success: true,
      data: scheme,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check eligibility for all schemes
router.post("/check-eligibility", (req, res) => {
  try {
    const userProfile = req.body;
    const { lang = "en" } = req.query;

    if (!userProfile || Object.keys(userProfile).length === 0) {
      return res.status(400).json({
        success: false,
        error: "User profile required",
        requiredFields: [
          "age",
          "income",
          "occupation",
          "gender",
          "bpl",
          "hasLand",
        ],
      });
    }

    const eligibleSchemes = schemeService.checkEligibility(userProfile, lang);

    res.json({
      success: true,
      profile: userProfile,
      eligibleCount: eligibleSchemes.length,
      data: eligibleSchemes,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
