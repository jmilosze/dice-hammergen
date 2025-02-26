import { initializeApp } from "firebase/app";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import { getAnalytics, isSupported } from "firebase/analytics";

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const isDevelopment = import.meta.env.MODE === "development";

export const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${projectId}.firebaseapp.com`,
  databaseURL: `https://${projectId}.firebaseio.com`,
  projectId: projectId,
  storageBucket: `${projectId}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
});

const db = getDatabase(firebaseApp);
// Connect to emulator in development mode
if (isDevelopment) {
  // Default port for Firebase Realtime Database emulator is 9000
  connectDatabaseEmulator(db, "localhost", 9000);
  console.log("Using Firebase Database emulator");
}

// Only initialize analytics in production
let analytics = null;
if (!isDevelopment) {
  // Check if analytics is supported before initializing
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(firebaseApp);
    }
  });
}

export { db, analytics };
