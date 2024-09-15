import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

export const firebaseApp = initializeApp({
  apiKey: "AIzaSyCeP45XubdwtjY1s_E8GyDuYtNqfBHc32s",
  authDomain: "dice-roller-c518a.firebaseapp.com",
  databaseURL: "https://dice-roller-c518a.firebaseio.com",
  projectId: "dice-roller-c518a",
  storageBucket: "dice-roller-c518a.appspot.com",
  messagingSenderId: "156397029967",
  appId: "1:156397029967:web:c78eda7d63664da4b7b83a",
  measurementId: "G-2PCZVSC01Z",
});

const db = getDatabase(firebaseApp);
const analytics = getAnalytics(firebaseApp);

export { db, analytics };
