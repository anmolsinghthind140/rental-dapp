const express = require("express");
const router = express.Router();
const {
  createAgreement,
  getAgreementById,
  getLandlordAgreements,
  getTenantAgreements,
  updateAgreement
} = require("../controllers/agreementController");

router.post("/", createAgreement);
router.get("/landlord/:walletAddress", getLandlordAgreements);
router.get("/tenant/:walletAddress", getTenantAgreements);
router.get("/:id", getAgreementById);
router.put("/:id", updateAgreement);

module.exports = router;