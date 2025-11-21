const Student = require("../models/Student");
const Session = require("../models/Session");
const QrToken = require("../models/QrToken");
const Attendance = require("../models/Attendance");
const { generateNonce, generateSignature } = require("../utils/crypto");

// Generate QR for student
async function generateQr(req, res) {
    const { matric, sessionId } = req.body;
    if (!matric || !sessionId) return res.status(400).json({ error: "Missing fields" });

    const student = await Student.findOne({ matric });
    const session = await Session.findOne({ sessionId });

    if (!student || !session) return res.status(404).json({ error: "Student or session not found" });

    const nonce = generateNonce();
    const sig = generateSignature(student.matric, sessionId, nonce, student.secretToken);
    const expiresAt = new Date(Date.now() + 20 * 1000); // 20 seconds expiry

    const qrToken = new QrToken({ token: nonce, studentId: student._id, sessionId, expiresAt });
    await qrToken.save();

    res.json({
        qrData: { matric: student.matric, sessionId, nonce, sig, expiresAt }
    });
}

// Verify QR (scanner side)
exports.verifyQR = async (req, res) => {
  try {
    const { studentId, sessionId, nonce, sig } = req.body;
    const student = await Student.findById(studentId);
    const session = await Session.findById(sessionId);

    // Prepare failure log function
    const logFailedAttempt = async (reason) => {
      await Attendance.create({
        studentId,
        sessionId,
        scanTime: new Date(),
        status: 'failed',
        scanMethod: 'QR',
        notes: reason
      });
    };

    if (!student) {
      await logFailedAttempt('Student not found');
      return res.status(404).json({ error: 'Student not found' });
    }

    if (!session) {
      await logFailedAttempt('Session not found');
      return res.status(404).json({ error: 'Session not found' });
    }

    const qrToken = await QrToken.findOne({ token: nonce, studentId, sessionId });

    if (!qrToken) {
      await logFailedAttempt('Invalid or used QR');
      return res.status(400).json({ error: 'Invalid or used QR' });
    }

    // Grace period: allow 1 minute after expiry
    const now = new Date();
    const graceTime = new Date(qrToken.expiresAt.getTime() + 60 * 1000); // 60 seconds grace

    if (qrToken.used) {
      await logFailedAttempt('QR already used');
      return res.status(400).json({ error: 'QR already used' });
    }

    if (now > graceTime) {
      await logFailedAttempt('QR expired beyond grace period');
      return res.status(400).json({ error: 'QR expired' });
    }

    const expectedSig = createHash(student._id + session._id + nonce + student.secretToken);
    if (expectedSig !== sig) {
      await logFailedAttempt('Invalid signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // If QR within normal expiry mark as on-time, within grace mark as late
    const status = now <= qrToken.expiresAt ? 'on-time' : 'late';

    // Mark QR as used
    qrToken.used = true;
    await qrToken.save();

    // Log successful attendance
    await Attendance.create({
      studentId,
      sessionId,
      scanTime: now,
      status,
      scanMethod: 'QR',
      notes: now > qrToken.expiresAt ? 'Late scan within grace period' : ''
    });

    res.json({ success: true, message: `Attendance recorded (${status})` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { generateQr, verifyQr };
