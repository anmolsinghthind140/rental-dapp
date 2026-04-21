const mongoose = require("mongoose");

const agreementSchema = new mongoose.Schema({
  landlordAddress: { type: String, required: true, lowercase: true },
  tenantAddress: { type: String, required: true, lowercase: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
  roomId: { type: String },
  contractAddress: { type: String, default: null },
  rentAmount: { type: Number, required: true },
  depositAmount: { type: Number, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  terms: { type: String },
  txHash: { type: String, default: null },
  status: {
    type: String,
    enum: ["draft", "pending", "active", "expired", "terminated", "rejected"],
    default: "draft"
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Agreement", agreementSchema);