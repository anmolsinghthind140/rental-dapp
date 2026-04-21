const Payment = require("../models/Payment");

const createPayment = async (req, res) => {
  try {
    const { agreementId, tenantAddress, landlordAddress, amount, txHash, type } = req.body;
    const payment = await Payment.create({ agreementId, tenantAddress: tenantAddress.toLowerCase(), landlordAddress: landlordAddress.toLowerCase(), amount, txHash, type });
    res.status(201).json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAgreementPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ agreementId: req.params.agreementId }).sort({ paymentDate: -1 });
    res.status(200).json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTenantPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ tenantAddress: req.params.walletAddress.toLowerCase() }).sort({ paymentDate: -1 });
    res.status(200).json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLandlordPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ landlordAddress: req.params.walletAddress.toLowerCase() }).sort({ paymentDate: -1 });
    res.status(200).json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPayment, getAgreementPayments, getTenantPayments, getLandlordPayments };