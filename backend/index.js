const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// CORS
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// Routes
app.use("/api/users",       require("./routes/userRoutes"));
app.use("/api/properties",  require("./routes/propertyRoutes"));
app.use("/api/requests",    require("./routes/requestRoutes"));
app.use("/api/agreements",  require("./routes/agreementRoutes"));
app.use("/api/payments",    require("./routes/paymentRoutes"));

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Rental DApp API Running" });
});

// ✅ 404 — Unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
});

// ✅ Global Error Handler — MUST be 4 params, MUST be last
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected!");
    app.listen(process.env.PORT || 5000, () => {
      console.log(`✅ Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => console.error("❌ MongoDB Error:", err));