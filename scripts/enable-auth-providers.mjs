import { GoogleAuth } from 'google-auth-library';
import { readFileSync } from 'fs';

const keyPath = process.argv[2] || process.env.GOOGLE_APPLICATION_CREDENTIALS;
const keyFile = JSON.parse(readFileSync(keyPath, 'utf8'));
const projectId = keyFile.project_id;

const auth = new GoogleAuth({
  credentials: keyFile,
  scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase'],
});
const client = await auth.getClient();

console.log(`Fetching current Identity Platform config for: ${projectId}`);
try {
  const getRes = await client.request({
    url: `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`,
  });
  console.log('Current signIn config:', JSON.stringify(getRes.data.signIn, null, 2));
} catch (err) {
  console.error('Failed to read config:', err.response?.data || err.message);
}

console.log('\nEnabling Email/Password and Phone providers...');
try {
  const patchRes = await client.request({
    url: `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config?updateMask=signIn.email.enabled,signIn.phoneNumber.enabled`,
    method: 'PATCH',
    data: {
      signIn: {
        email: { enabled: true },
        phoneNumber: { enabled: true },
      },
    },
  });
  console.log('Updated signIn config:', JSON.stringify(patchRes.data.signIn, null, 2));
} catch (err) {
  console.error('Failed to update config:', err.response?.data || err.message);
  process.exit(1);
}
