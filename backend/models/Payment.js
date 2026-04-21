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
  paymentDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Payment", paymentSchema);