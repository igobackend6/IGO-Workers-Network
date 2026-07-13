import { verifySupervisorOtp, HttpError } from '../../lib/otpService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    const result = await verifySupervisorOtp(req.body || {});
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error('verify-otp error:', err);
    return res.status(500).json({ error: 'Unexpected error verifying OTP.' });
  }
}
