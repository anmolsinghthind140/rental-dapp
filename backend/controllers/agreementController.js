const Agreement = require("../models/Agreement");

const createAgreement = async (req, res) => {
  try {
    const {
      propertyId,
      landlordAddress,
      tenantAddress,
      rentAmount,
      depositAmount,
      roomType
    } = req.body;

    const agreement = new Agreement({
      propertyId,
      landlordAddress: landlordAddress.toLowerCase(),
      tenantAddress: tenantAddress.toLowerCase(),
      rentAmount,
      depositAmount,
      roomType,
      status: "draft"
    });

    await agreement.save();
    res.status(201).json({ success: true, agreement });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAgreementById = async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.id).populate("propertyId");
    if (!agreement) return res.status(404).json({ message: "Agreement not found" });
    res.status(200).json({ success: true, agreement });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLandlordAgreements = async (req, res) => {
  try {
    const agreements = await Agreement.find({
      landlordAddress: req.params.walletAddress.toLowerCase()
    }).populate("propertyId");
    res.status(200).json({ success: true, agreements });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTenantAgreements = async (req, res) => {
  try {
    const agreements = await Agreement.find({
      tenantAddress: req.params.walletAddress.toLowerCase()
    }).populate("propertyId");
    res.status(200).json({ success: true, agreements });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAgreement = async (req, res) => {
  try {
    const agreement = await Agreement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!agreement) return res.status(404).json({ message: "Agreement not found" });
    res.status(200).json({ success: true, agreement });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAgreement,
  getAgreementById,
  getLandlordAgreements,
  getTenantAgreements,
  updateAgreement
};