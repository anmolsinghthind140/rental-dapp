const mongoose = require("mongoose");

const roomRequestSchema = new mongoose.Schema({
  tenantAddress: { type: String, required: true, lowercase: true },
  landlordAddress: { type: String, required: true, lowercase: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
  roomId: { type: String },
  roomType: { type: String },
  moveInDate: { type: Date },
  message: { type: String },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("RoomRequest", roomRequestSchema);