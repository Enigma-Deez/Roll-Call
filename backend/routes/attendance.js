const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  studentId: String,
  name: String,
  method: { type: String, enum: ["QR", "FACE"], default: "QR" },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Attendance", attendanceSchema);
