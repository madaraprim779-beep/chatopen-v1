// ==========================================
// CHATOPEN - FIREBASE
// ==========================================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ==========================================
// CONFIGURATION FIREBASE
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyB3dUnrB7RathmCi4qCkbzeA9fKOKSBCoc",
  authDomain: "chatopen-af39a.firebaseapp.com",
  projectId: "chatopen-af39a",
  storageBucket: "chatopen-af39a.firebasestorage.app",
  messagingSenderId: "378168580119",
  appId: "1:378168580119:web:867eb1b9df244e09ec6452"
};


// ==========================================
// INITIALISATION
// ==========================================

const app = initializeApp(firebaseConfig);


// ==========================================
// AUTHENTIFICATION
// ==========================================

export const auth = getAuth(app);


// ==========================================
// FIRESTORE
// ==========================================

export const db = getFirestore(app);