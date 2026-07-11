import { GoogleAuth } from 'google-auth-library';
import { readFileSync } from 'fs';

const keyPath = process.argv[2] || process.env.GOOGLE_APPLICATION_CREDENTIALS;
const keyFile = JSON.parse(readFileSync(keyPath, 'utf8'));
const projectId = keyFile.project_id;

const auth = new GoogleAuth({
  credentials: keyFile,
  scopes: ['https://www.googleapis.com/auth/firebase', 'https://www.googleapis.com/auth/cloud-platform'],
});
const client = await auth.getClient();

async function get(url) {
  const res = await client.request({ url });
  return res.data;
}

console.log(`Project: ${projectId}`);

try {
  const apps = await get(`https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`);
  if (!apps.apps || apps.apps.length === 0) {
    console.log('No web apps registered yet in this Firebase project.');
    process.exit(0);
  }
  for (const app of apps.apps) {
    console.log(`\nWeb App: ${app.displayName || app.appId}`);
    const config = await get(`https://firebase.googleapis.com/v1beta1/${app.name}/config`);
    console.log(JSON.stringify(config, null, 2));
  }
} catch (err) {
  console.error('Failed to fetch web app config:', err.response?.data || err.message);
  process.exit(1);
}
