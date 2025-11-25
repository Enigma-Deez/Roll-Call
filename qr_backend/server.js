const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const attendanceRoutes = require("./routes/attendance");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/attendance", attendanceRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(process.env.PORT, () => console.log("Server running on port", process.env.PORT));
  })
  .catch(err => console.log(err));
