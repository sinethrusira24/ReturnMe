// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Copy this file to js/firebase-config.js and fill in your Firebase project values.
// This file is excluded from source control by .gitignore.

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBUEq8FmMABEMpRK7sqItcvJtYuEXc76r0",
  authDomain: "returnme-e03b0.firebaseapp.com",
  projectId: "returnme-e03b0",
  storageBucket: "returnme-e03b0.firebasestorage.app",
  messagingSenderId: "1025459059409",
  appId: "1:1025459059409:web:bc63d182374328032fa3f0",
  measurementId: "G-CJLSW77X0K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
