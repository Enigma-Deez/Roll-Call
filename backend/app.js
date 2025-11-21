const express = require("express");
const mongoose = require("mongoose");
const qrRoutes = require("./routes/qr");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect("mongodb://localhost:27017/qrBackup", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error(err));

app.use("/api/qr", qrRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
