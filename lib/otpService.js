import { FieldValue } from 'firebase-admin/firestore';
import { db, auth } from './firebaseAdmin.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

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

export async function sendSupervisorOtp(rawPhone) {
  const phone = cleanPhone(rawPhone);
  if (phone.length !== 10) {
    throw new HttpError(400, 'A valid 10-digit mobile number is required.');
  }

  const supervisor = await findSupervisorByPhone(phone);
  if (!supervisor) {
    throw new HttpError(403, 'This mobile number is not registered as an Area Supervisor. Please contact HR/Admin to be added.');
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
    throw new HttpError(502, 'Could not send OTP SMS right now. Please try again shortly.');
  }
  console.log('apitxt.com sendOTP response:', bodyText);

  return { success: true };
}

export async function verifySupervisorOtp({ phone: rawPhone, otp: rawOtp, name: rawName }) {
  const phone = cleanPhone(rawPhone);
  const otp = String(rawOtp || '').trim();
  const name = String(rawName || '').trim();

  if (phone.length !== 10 || !otp) {
    throw new HttpError(400, 'Phone number and OTP are required.');
  }

  const otpRef = db.collection('otpRequests').doc(phone);
  const otpSnap = await otpRef.get();
  if (!otpSnap.exists) {
    throw new HttpError(400, 'No OTP request found for this number. Please request a new code.');
  }

  const data = otpSnap.data();
  if (Date.now() > data.expiresAt) {
    await otpRef.delete();
    throw new HttpError(400, 'This OTP has expired. Please request a new code.');
  }
  if (data.attempts >= MAX_ATTEMPTS) {
    await otpRef.delete();
    throw new HttpError(429, 'Too many incorrect attempts. Please request a new code.');
  }
  if (data.otp !== otp) {
    await otpRef.update({ attempts: FieldValue.increment(1) });
    throw new HttpError(400, 'Incorrect OTP code.');
  }

  await otpRef.delete();

  const supervisor = await findSupervisorByPhone(phone);
  if (!supervisor) {
    throw new HttpError(403, 'This mobile number is not registered as an Area Supervisor. Please contact HR/Admin to be added.');
  }

  const customToken = await auth.createCustomToken(supervisor.id);

  return {
    customToken,
    name: name || supervisor.name,
    assignedState: supervisor.assignedState,
    assignedDistrict: supervisor.assignedDistrict,
  };
}
