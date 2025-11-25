const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, unique: true },
    course: String,
    startTime: Date,
    endTime: Date
});

module.exports = mongoose.model("Session", sessionSchema);
