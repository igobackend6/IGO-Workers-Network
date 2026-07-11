import { GoogleAuth } from 'google-auth-library';
import { readFileSync } from 'fs';

const keyPath = process.argv[2] || process.env.GOOGLE_APPLICATION_CREDENTIALS;
const keyFile = JSON.parse(readFileSync(keyPath, 'utf8'));
const projectId = keyFile.project_id;
const rulesContent = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

const auth = new GoogleAuth({
  credentials: keyFile,
  scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase'],
});
const client = await auth.getClient();

console.log(`Creating ruleset for project: ${projectId}`);
const rulesetRes = await client.request({
  url: `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
  method: 'POST',
  data: {
    source: {
      files: [{ name: 'firestore.rules', content: rulesContent }],
    },
  },
});
const rulesetName = rulesetRes.data.name;
console.log(`Created ruleset: ${rulesetName}`);

const releaseName = `projects/${projectId}/releases/cloud.firestore`;
console.log(`\nUpdating release: ${releaseName}`);

try {
  await client.request({
    url: `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`,
    method: 'PATCH',
    data: {
      release: { name: releaseName, rulesetName },
    },
  });
  console.log('Release updated successfully.');
} catch (err) {
  if (err.response?.status === 404) {
    console.log('Release does not exist yet, creating it...');
    await client.request({
      url: `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`,
      method: 'POST',
      data: { name: releaseName, rulesetName },
    });
    console.log('Release created successfully.');
  } else {
    console.error('Failed to update release:', err.response?.data || err.message);
    process.exit(1);
  }
}

console.log('\nFirestore rules deployed.');
