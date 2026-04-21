const express = require("express");
const router = express.Router();
const { createPayment, getAgreementPayments, getTenantPayments, getLandlordPayments } = require("../controllers/paymentController");

router.post("/", createPayment);
router.get("/agreement/:agreementId", getAgreementPayments);
router.get("/tenant/:walletAddress", getTenantPayments);
router.get("/landlord/:walletAddress", getLandlordPayments);

module.exports = router;