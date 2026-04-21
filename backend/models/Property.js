const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  roomNumber: { type: String },
  roomType: {
    type: String,
    enum: ["single", "double", "triple", "quad"],
    required: true
  },
  maxPersons: { type: Number, required: true },
  rentPerPerson: { type: Number, required: true },
  isOccupied: { type: Boolean, default: false }
});

const PropertySchema = new mongoose.Schema({
  landlordAddress: { type: String, required: true, lowercase: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  area: { type: String },
  houseNumber: { type: String },
  status: {
    type: String,
    enum: ["vacant", "occupied", "partial"],
    default: "vacant"
  },
  rooms: [RoomSchema]
}, { timestamps: true });

// Auto-update status based on rooms
PropertySchema.pre("save", function () {
  if (this.rooms && this.rooms.length > 0) {
    const occupied = this.rooms.filter(r => r.isOccupied).length;
    if (occupied === 0) this.status = "vacant";
    else if (occupied === this.rooms.length) this.status = "occupied";
    else this.status = "partial";
  }
  // next();
});

module.exports = mongoose.model("Property", PropertySchema);