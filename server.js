import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const credential = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  ? cert(JSON.parse(readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8')))
  : applicationDefault();

initializeApp({ credential });
const db = getFirestore();
const auth = getAuth();

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function cleanPhone(raw) {
  return String(raw || '').replace(/\D/g, '').slice(-10);
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function findSupervisorByPhone(phone) {
  const snap = await db.collection('supervisors').where('phone', '==', phone).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

const app = express();
app.use(express.json());

app.post('/api/supervisor/send-otp', async (req, res) => {
  try {
    const phone = cleanPhone(req.body?.phone);
    if (phone.length !== 10) {
      return res.status(400).json({ error: 'A valid 10-digit mobile number is required.' });
    }

    const supervisor = await findSupervisorByPhone(phone);
    if (!supervisor) {
      return res.status(403).json({
        error: 'This mobile number is not registered as an Area Supervisor. Please contact HR/Admin to be added.',
      });
    }

    const otp = generateOtp();
    await db.collection('otpRequests').doc(phone).set({
      otp,
      attempts: 0,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Date.now() + OTP_TTL_MS,
    });

    const apitxtRes = await fetch('https://apitxt.com/api/sendOTP', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        authkey: process.env.APITXT_API_KEY,
        mobile: `91${phone}`,
        otp,
        message: `Your IGO Worker Network verification code is ${otp}. Valid for 5 minutes.`,
      }).toString(),
    });

    const bodyText = await apitxtRes.text();
    if (!apitxtRes.ok) {
      console.error('apitxt.com sendOTP failed:', apitxtRes.status, bodyText);
      return res.status(502).json({ error: 'Could not send OTP SMS right now. Please try again shortly.' });
    }
    console.log('apitxt.com sendOTP response:', bodyText);

    return res.json({ success: true });
  } catch (err) {
    console.error('send-otp error:', err);
    return res.status(500).json({ error: 'Unexpected error sending OTP.' });
  }
});

app.post('/api/supervisor/verify-otp', async (req, res) => {
  try {
    const phone = cleanPhone(req.body?.phone);
    const otp = String(req.body?.otp || '').trim();
    const name = String(req.body?.name || '').trim();

    if (phone.length !== 10 || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required.' });
    }

    const otpRef = db.collection('otpRequests').doc(phone);
    const otpSnap = await otpRef.get();
    if (!otpSnap.exists) {
      return res.status(400).json({ error: 'No OTP request found for this number. Please request a new code.' });
    }

    const data = otpSnap.data();
    if (Date.now() > data.expiresAt) {
      await otpRef.delete();
      return res.status(400).json({ error: 'This OTP has expired. Please request a new code.' });
    }
    if (data.attempts >= MAX_ATTEMPTS) {
      await otpRef.delete();
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
    }
    if (data.otp !== otp) {
      await otpRef.update({ attempts: FieldValue.increment(1) });
      return res.status(400).json({ error: 'Incorrect OTP code.' });
    }

    await otpRef.delete();

    const supervisor = await findSupervisorByPhone(phone);
    if (!supervisor) {
      return res.status(403).json({
        error: 'This mobile number is not registered as an Area Supervisor. Please contact HR/Admin to be added.',
      });
    }

    const customToken = await auth.createCustomToken(supervisor.id);

    return res.json({
      customToken,
      name: name || supervisor.name,
      assignedState: supervisor.assignedState,
      assignedDistrict: supervisor.assignedDistrict,
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    return res.status(500).json({ error: 'Unexpected error verifying OTP.' });
  }
});

const distPath = path.join(__dirname, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
