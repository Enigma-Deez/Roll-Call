const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    matric: { type: String, unique: true },
    name: String,
    secretToken: String, // randomly generated for signing
});

module.exports = mongoose.model("Student", studentSchema);
