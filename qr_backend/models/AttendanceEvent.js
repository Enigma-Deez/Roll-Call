const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    studentId: mongoose.Schema.Types.ObjectId,
    sessionId: String,
    scanTime: Date,
    status: String, // on-time, late, absent
    scanMethod: String, // QR, manual override
    notes: String
});

module.exports = mongoose.model("Attendance", attendanceSchema);
