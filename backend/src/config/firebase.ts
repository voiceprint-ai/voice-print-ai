/**
 * Firebase Admin bootstrap.
 *
 * On Vercel, Firebase Admin uses explicit service-account credentials supplied
 * through environment variables.
 *
 * In local development or Google Cloud environments, it can fall back to
 * Application Default Credentials when explicit credentials are not supplied.
 *
 * The Admin SDK runs with elevated privileges and bypasses Firestore security
 * rules. Every backend data-access operation must therefore perform its own
 * authorization and ownership checks.
 *
 * @author Saamarth Attray
 * @modified Timothy Nguyen — added Vercel environment-based Firebase credentials
 */

import admin from 'firebase-admin';
import { env } from './env';

if (admin.apps.length === 0) {
  const hasExplicitCredentials =
    Boolean(env.FIREBASE_CLIENT_EMAIL) &&
    Boolean(env.FIREBASE_PRIVATE_KEY);

  if (hasExplicitCredentials) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      projectId: env.FIREBASE_PROJECT_ID,
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: env.FIREBASE_PROJECT_ID,
    });
  }
}

export const firestore = admin.firestore();

firestore.settings({
  ignoreUndefinedProperties: true,
});

export const auth = admin.auth();
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;

export { admin };