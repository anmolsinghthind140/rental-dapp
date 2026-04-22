const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  agreementId: { type: mongoose.Schema.Types.ObjectId, ref: "Agreement" },
  tenantAddress: { type: String, required: true, lowercase: true },
  landlordAddress: { type: String, required: true, lowercase: true },
  amount: { type: Number, required: true },
  txHash: { type: String, required: true },
  type: {
    type: String,
    enum: ["deposit", "rent"],
    required: true
  },
  status: {
    type: String,
    enum: ["paid", "pending", "failed"],
    default: "paid"
  },
  // ✅ Add these 2 fields
  rentMonth: { type: Number, min: 1, max: 12, default: null }, 
  rentYear:  { type: Number, default: null },                  
  paymentDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Payment", paymentSchema);