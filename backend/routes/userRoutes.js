const express = require("express");
const router = express.Router();
const { registerUser, getUser, updateNickname } = require("../controllers/userController");

router.post("/register", registerUser);
router.get("/:walletAddress", getUser);
router.put("/:walletAddress", updateNickname);

module.exports = router;