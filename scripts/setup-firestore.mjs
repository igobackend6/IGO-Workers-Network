import { GoogleAuth } from 'google-auth-library';
import { readFileSync } from 'fs';

const keyPath = process.argv[2] || process.env.GOOGLE_APPLICATION_CREDENTIALS;
const keyFile = JSON.parse(readFileSync(keyPath, 'utf8'));
const projectId = keyFile.project_id;

const auth = new GoogleAuth({
  credentials: keyFile,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});
const client = await auth.getClient();

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

console.log(`Enabling Cloud Firestore API for project: ${projectId}`);
try {
  const enableRes = await client.request({
    url: `https://serviceusage.googleapis.com/v1/projects/${projectId}/services/firestore.googleapis.com:enable`,
    method: 'POST',
    data: {},
  });
  console.log('Enable API response:', JSON.stringify(enableRes.data, null, 2));
} catch (err) {
  console.error('Failed to enable Firestore API:', err.response?.data || err.message);
  process.exit(1);
}

console.log('\nWaiting 15s for API enablement to propagate...');
await sleep(15000);

console.log(`\nCreating default Firestore database (Native mode) for project: ${projectId}`);
try {
  const createRes = await client.request({
    url: `https://firestore.googleapis.com/v1/projects/${projectId}/databases?databaseId=(default)`,
    method: 'POST',
    data: {
      type: 'FIRESTORE_NATIVE',
      locationId: 'nam5',
    },
  });
  let op = createRes.data;
  console.log('Operation started:', op.name);
  while (!op.done) {
    await sleep(3000);
    const pollRes = await client.request({ url: `https://firestore.googleapis.com/v1/${op.name}` });
    op = pollRes.data;
  }
  if (op.error) {
    console.error('Database creation failed:', JSON.stringify(op.error, null, 2));
    process.exit(1);
  }
  console.log('\nDatabase created:', JSON.stringify(op.response, null, 2));
} catch (err) {
  const data = err.response?.data;
  if (data?.error?.status === 'ALREADY_EXISTS' || String(data?.error?.message || '').includes('already exists')) {
    console.log('Default database already exists, continuing.');
  } else {
    console.error('Failed to create Firestore database:', data || err.message);
    process.exit(1);
  }
}
