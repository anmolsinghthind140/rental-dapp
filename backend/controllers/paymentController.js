const Payment = require("../models/Payment");

const createPayment = async (req, res, next) => {
  try {
    const {
      agreementId, tenantAddress, landlordAddress,
      amount, txHash, type, rentMonth, rentYear
    } = req.body;

    // Block duplicate rent for same month
    if (type === "rent") {
      const existing = await Payment.findOne({
        agreementId, type: "rent", rentMonth, rentYear, status: "paid"
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Rent for this month already paid`
        });
      }
    }

    const payment = await Payment.create({
      agreementId,
      tenantAddress: tenantAddress.toLowerCase(),
      landlordAddress: landlordAddress.toLowerCase(),
      amount,
      txHash,
      type,
      rentMonth: type === "rent" ? rentMonth : null,
      rentYear:  type === "rent" ? rentYear  : null
    });

    res.status(201).json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};

const getAgreementPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({
      agreementId: req.params.agreementId
    }).sort({ paymentDate: -1 });
    res.status(200).json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};

const getTenantPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({
      tenantAddress: req.params.walletAddress.toLowerCase()
    }).sort({ paymentDate: -1 });
    res.status(200).json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};

const getLandlordPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({
      landlordAddress: req.params.walletAddress.toLowerCase()
    }).sort({ paymentDate: -1 });
    res.status(200).json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  getAgreementPayments,
  getTenantPayments,
  getLandlordPayments
};