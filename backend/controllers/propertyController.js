const Property = require("../models/Property");

const addProperty = async (req, res) => {
  try {
    const property = new Property({
      ...req.body,
      landlordAddress: req.body.landlordAddress.toLowerCase()
    });
    await property.save();
    res.status(201).json({ success: true, property });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllProperties = async (req, res) => {
  try {
    const { city, roomType } = req.query;
    let filter = {};

    // Filter by city (case insensitive)
    if (city) {
      filter.$or = [
        { city: { $regex: city, $options: "i" } },
        { area: { $regex: city, $options: "i" } },
        { address: { $regex: city, $options: "i" } }
      ];
    }

    // Filter by room type
    if (roomType) {
      filter["rooms.roomType"] = roomType;
    }

    const properties = await Property.find(filter);
    res.status(200).json({ success: true, properties });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLandlordProperties = async (req, res) => {
  try {
    const properties = await Property.find({
      landlordAddress: req.params.walletAddress.toLowerCase()
    });
    res.status(200).json({ success: true, properties });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPropertyById = async (req, res) => {
  try {
    console.log("Looking for property ID:", req.params.id);
    const property = await Property.findById(req.params.id);
    console.log("Found:", property ? "YES" : "NO");

    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }
    return res.status(200).json({ success: true, property });
  } catch (error) {
    console.error("getPropertyById error:", error.message);
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }
    return res.status(500).json({ message: error.message });
  }
};

const updateProperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }
    res.status(200).json({ success: true, property });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProperty = async (req, res) => {
  try {
    await Property.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Property deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
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