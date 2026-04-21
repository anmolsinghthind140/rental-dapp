const express = require("express");
const router = express.Router();

// Routes coming soon
router.get("/", (req, res) => {
  res.json({ message: "Route working!" });
});

module.exports = router;