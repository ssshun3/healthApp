// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDX0zxBE7HkLts59B9A3Z2Kp7Et5Sw4dVQ",
  authDomain: "health-expo-d665c.firebaseapp.com",
  projectId: "health-expo-d665c",
  storageBucket: "health-expo-d665c.appspot.com",
  messagingSenderId: "623613410623",
  appId: "1:623613410623:web:fc90370dd070bab5e3a78a",
  measurementId: "G-31J1FNRXK7",
};
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]; // Get the already initialized Firebase app
}

// Get the Firebase auth instance
const auth = getAuth(app);

export { auth };
// Initialize Firebase
// const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const database = getDatabase(app);
const analytics = getAnalytics(app);
