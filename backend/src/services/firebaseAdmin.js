const { applicationDefault, cert, getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

function getCredential() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    return applicationDefault();
  }

  try {
    return cert(JSON.parse(serviceAccountJson));
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
}

function getFirebaseApp() {
  if (getApps().length > 0) return getApps()[0];

  return initializeApp({
    credential: getCredential(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

async function verifyFirebaseIdToken(idToken) {
  if (typeof idToken !== "string" || !idToken.trim()) {
    throw new Error("Firebase ID token is required");
  }

  return getAuth(getFirebaseApp()).verifyIdToken(idToken, true);
}

module.exports = { verifyFirebaseIdToken };
