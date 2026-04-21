const User = require("../models/User");

const registerUser = async (req, res) => {
  try {
    const { walletAddress, nickname, role } = req.body;
    const existingUser = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (existingUser) return res.status(400).json({ message: "User already exists" });
    const user = await User.create({ walletAddress: walletAddress.toLowerCase(), nickname, role });
    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findOne({ walletAddress: req.params.walletAddress.toLowerCase() });
    if (!user) return res.status(404).json({ exists: false });
    res.status(200).json({ exists: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateNickname = async (req, res) => {
  try {
    const { nickname } = req.body;
    const user = await User.findOneAndUpdate(
      { walletAddress: req.params.walletAddress.toLowerCase() },
      { nickname },
      { new: true }
    );
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, getUser, updateNickname };