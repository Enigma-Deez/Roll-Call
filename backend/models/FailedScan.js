const mongoose = require("mongoose");

const failedScanSchema = new mongoose.Schema({
    matric: String, // may be unknown if signature invalid
    sessionId: String,
    nonce: String,
    reason: String,
    scanner: String, // optional
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("FailedScan", failedScanSchema);
