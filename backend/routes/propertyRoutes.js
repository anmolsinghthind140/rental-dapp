const express = require("express");
const router = express.Router();
const {
  addProperty,
  getAllProperties,
  getLandlordProperties,
  getPropertyById,
  updateProperty,
  deleteProperty
} = require("../controllers/propertyController");

router.post("/", addProperty);
router.get("/", getAllProperties);
router.get("/landlord/:walletAddress", getLandlordProperties); 
router.get("/:id", getPropertyById);                          
router.put("/:id", updateProperty);
router.delete("/:id", deleteProperty);

module.exports = router;