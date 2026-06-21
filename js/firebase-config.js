// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Copy this file to js/firebase-config.js and fill in your Firebase project values.
// This file is excluded from source control by .gitignore.

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC1O8C_INyLDa59Sb6i_mEqPIexCoSgE_E",
  authDomain: "returnme-85202.firebaseapp.com",
  projectId: "returnme-85202",
  storageBucket: "returnme-85202.firebasestorage.app",
  messagingSenderId: "120852761029",
  appId: "1:120852761029:web:cf2c2c2f1a37d5cc7a23ac",
  measurementId: "G-RZSN6J4VVP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
