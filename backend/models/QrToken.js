const mongoose = require("mongoose");

const qrTokenSchema = new mongoose.Schema({
    token: String,
    studentId: mongoose.Schema.Types.ObjectId,
    sessionId: String,
    expiresAt: Date,
    used: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("QrToken", qrTokenSchema);
