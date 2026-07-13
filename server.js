import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { sendSupervisorOtp, verifySupervisorOtp, HttpError } from './lib/otpService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

app.post('/api/supervisor/send-otp', async (req, res) => {
  try {
    const result = await sendSupervisorOtp(req.body?.phone);
    res.json(result);
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error('send-otp error:', err);
    res.status(500).json({ error: 'Unexpected error sending OTP.' });
  }
});

app.post('/api/supervisor/verify-otp', async (req, res) => {
  try {
    const result = await verifySupervisorOtp(req.body || {});
    res.json(result);
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error('verify-otp error:', err);
    res.status(500).json({ error: 'Unexpected error verifying OTP.' });
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
