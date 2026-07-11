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

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

console.log(`Creating web app in project: ${projectId}`);

const createRes = await client.request({
  url: `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`,
  method: 'POST',
  data: { displayName: 'IGO Worker Network' },
});

let op = createRes.data;
console.log('Operation started:', op.name);

while (!op.done) {
  await sleep(2000);
  const pollRes = await client.request({ url: `https://firebase.googleapis.com/v1beta1/${op.name}` });
  op = pollRes.data;
}

if (op.error) {
  console.error('Failed to create web app:', JSON.stringify(op.error, null, 2));
  process.exit(1);
}

const app = op.response;
console.log(`\nCreated web app: ${app.displayName} (${app.appId})`);

const configRes = await client.request({ url: `https://firebase.googleapis.com/v1beta1/${app.name}/config` });
console.log('\nWeb App Config:');
console.log(JSON.stringify(configRes.data, null, 2));
