/**
 * get-test-token.ts
 *
 * Mints a REAL Firebase ID token for a test user, so you can exercise the API
 * with curl/Postman/REST Client before the frontend has sign-in wired up.
 *
 * How it works (same flow the client SDK uses under the hood):
 *   1. firebase-admin creates a short-lived CUSTOM token for a test uid.
 *   2. That custom token is exchanged for a real ID token via the public
 *      Firebase Auth REST API (signInWithCustomToken).
 *   3. The ID token is printed — copy it into the .http file's @token variable.
 *
 * Requires one extra value beyond your normal .env: FIREBASE_WEB_API_KEY.
 * Find it in Firebase Console -> Project settings -> General -> Web API Key.
 *
 * Usage:
 *   npm run test:token
 *   npm run test:token -- some-other-uid
 *
 * @author Saamarth Attray
 */
import 'dotenv/config';
import { admin, auth } from '../src/config/firebase';

const TEST_UID = process.argv[2] ?? 'test-user-1';
const WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY;

async function main(): Promise<void> {
  if (!WEB_API_KEY) {
    console.error(
      '\nMissing FIREBASE_WEB_API_KEY.\n' +
        'Add it to your .env — find it in Firebase Console > Project settings > General > Web API Key.\n',
    );
    process.exit(1);
  }

  const customToken = await auth.createCustomToken(TEST_UID, { source: 'get-test-token-script' });

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${WEB_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  );

  const data = (await res.json()) as { idToken?: string; error?: { message?: string } };
  if (!res.ok || !data.idToken) {
    console.error('\nFailed to exchange custom token for ID token:', data.error?.message ?? data);
    process.exit(1);
  }

  console.log(`\nTest UID: ${TEST_UID}`);
  console.log('\nID token (valid ~1 hour):\n');
  console.log(data.idToken);
  console.log('\nPaste this into test-flow.http as the @token value.\n');

  await admin.app().delete().catch(() => undefined);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});