const RoomRequest = require("../models/RoomRequest");
const Agreement = require("../models/Agreement");
const Property = require("../models/Property");

const createRequest = async (req, res) => {
  try {
    const { tenantAddress, landlordAddress, propertyId, roomId, roomType, moveInDate, message } = req.body;
    const request = await RoomRequest.create({ tenantAddress: tenantAddress.toLowerCase(), landlordAddress: landlordAddress.toLowerCase(), propertyId, roomId, roomType, moveInDate, message });
    res.status(201).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTenantRequests = async (req, res) => {
  try {
    const requests = await RoomRequest.find({ tenantAddress: req.params.walletAddress.toLowerCase() }).populate("propertyId");
    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLandlordRequests = async (req, res) => {
  try {
    const requests = await RoomRequest.find({ landlordAddress: req.params.walletAddress.toLowerCase() }).populate("propertyId");
    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await RoomRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (status === "approved") {
      const property = await Property.findById(request.propertyId);
      const room = property.rooms.id(request.roomId);
      const rentAmount = room ? room.rentPerPerson : 0;

      await Agreement.create({
        landlordAddress: request.landlordAddress,
        tenantAddress: request.tenantAddress,
        propertyId: request.propertyId,
        roomId: request.roomId,
        rentAmount: rentAmount,
        depositAmount: rentAmount * 2,
        status: "draft"
      });

      await Property.findOneAndUpdate(
        { _id: request.propertyId, "rooms._id": request.roomId },
        { $set: { "rooms.$.isOccupied": true } }
      );
    }

    res.status(200).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createRequest, getTenantRequests, getLandlordRequests, updateRequestStatus };