const express = require("express");
const router = express.Router();
const { generateQr, verifyQr } = require("../controllers/qrController");

router.post("/generate-qr", generateQr);
router.post("/verify-qr", verifyQr);

module.exports = router;
