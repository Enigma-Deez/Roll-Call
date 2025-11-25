const crypto = require("crypto");

// generate random nonce
function generateNonce(length = 16) {
    return crypto.randomBytes(length).toString("hex");
}

// generate signature for QR token
function generateSignature(studentMatric, sessionId, nonce, secretToken) {
    const data = `${studentMatric}|${sessionId}|${nonce}|${secretToken}`;
    return crypto.createHash("sha256").update(data).digest("hex");
}

module.exports = { generateNonce, generateSignature };
