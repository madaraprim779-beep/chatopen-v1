import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "TON_API_KEY",
  authDomain: "chatopen-af39a.firebaseapp.com",
  projectId: "chatopen-af39a",
  storageBucket: "chatopen-af39a.firebasestorage.app",
  messagingSenderId: "378168580119",
  appId: "1:378168580119:web:867eb1b9df244e09ec6452"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);