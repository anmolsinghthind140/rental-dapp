const express = require("express");
const router = express.Router();
const { createRequest, getTenantRequests, getLandlordRequests, updateRequestStatus } = require("../controllers/requestController");

router.post("/", createRequest);
router.get("/tenant/:walletAddress", getTenantRequests);
router.get("/landlord/:walletAddress", getLandlordRequests);
router.put("/:id", updateRequestStatus);

module.exports = router;