const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomNumber: String,
  roomType: {
    type: String,
    enum: ["single", "double", "triple", "quad"]
  },
  rentPerPerson: Number,
  maxPersons: Number,
  isOccupied: {
    type: Boolean,
    default: false
  }
});

const propertySchema = new mongoose.Schema({
  landlordAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  city: { type: String, required: true },
  area: { type: String },
  address: { type: String, required: true },
  houseNumber: { type: String },
  rooms: [roomSchema],
  status: {
    type: String,
    enum: ["vacant", "occupied"],
    default: "vacant"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Property", propertySchema);z