/**
 * Firebase Admin bootstrap.
 *
 * Uses the service-account file referenced by GOOGLE_APPLICATION_CREDENTIALS when
 * present (local dev), otherwise falls back to Application Default Credentials
 * (Cloud Run / GCP). The Admin SDK runs with elevated privileges and BYPASSES
 * Firestore security rules — therefore every data access in this service performs
 * its own explicit ownership check (see domain/*.repo.ts). The shipped
 * firestore.rules file is defense-in-depth for any direct client access.
 *
 * @author Saamarth Attray
 */
import admin from 'firebase-admin';
import { env } from './env';

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: env.FIREBASE_PROJECT_ID,
  });
}

export const firestore = admin.firestore();
firestore.settings({ ignoreUndefinedProperties: true });

export const auth = admin.auth();
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;
export { admin };