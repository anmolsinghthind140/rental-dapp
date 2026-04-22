const Property = require("../models/Property");
const Agreement = require("../models/Agreement");
const RoomRequest = require("../models/RoomRequest");

const addProperty = async (req, res, next) => {
  try {
    const property = new Property({
      ...req.body,
      landlordAddress: req.body.landlordAddress.toLowerCase()
    });
    await property.save();
    res.status(201).json({ success: true, property });
  } catch (error) {
    next(error);
  }
};

const getAllProperties = async (req, res, next) => {
  try {
    const { city, roomType } = req.query;
    let filter = {};

    if (city) {
      filter.$or = [
        { city: { $regex: city, $options: "i" } },
        { area: { $regex: city, $options: "i" } },
        { address: { $regex: city, $options: "i" } }
      ];
    }
    if (roomType) filter["rooms.roomType"] = roomType;

    const properties = await Property.find(filter);
    res.status(200).json({ success: true, properties });
  } catch (error) {
    next(error);
  }
};

const getLandlordProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({
      landlordAddress: req.params.walletAddress.toLowerCase()
    });
    res.status(200).json({ success: true, properties });
  } catch (error) {
    next(error);
  }
};

const getPropertyById = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }
    res.status(200).json({ success: true, property });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }
    next(error);
  }
};

const updateProperty = async (req, res, next) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }
    res.status(200).json({ success: true, property });
  } catch (error) {
    next(error);
  }
};

const deleteProperty = async (req, res, next) => {
  try {
    // Check if Agreement model loaded correctly
    console.log("Checking active agreements for property:", req.params.id);

    const activeAgreement = await Agreement.findOne({
      propertyId: req.params.id,
      status: { $in: ["active", "sent"] }
    });

    if (activeAgreement) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete property with active or sent agreements"
      });
    }

    // Delete related requests
    await RoomRequest.deleteMany({ propertyId: req.params.id });

    const deleted = await Property.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    res.status(200).json({ success: true, message: "Property deleted successfully" });
  } catch (error) {
    console.error("deleteProperty error:", error.message);
    next(error);
  }
};

module.exports = {
  addProperty,
  getAllProperties,
  getLandlordProperties,
  getPropertyById,
  updateProperty,
  deleteProperty
};