import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import { getAuth } from
"https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import { getFirestore } from
"https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "TON_API_KEY",
  authDomain: "TON_PROJECT_ID.firebaseapp.com",
  projectId: "TON_PROJECT_ID",
  storageBucket: "TON_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "TON_SENDER_ID",
  appId: "TON_APP_ID"
};


const app = initializeApp(firebaseConfig);


/* Firebase Authentication */
const auth = getAuth(app);


/* Cloud Firestore */
const db = getFirestore(app);


export {
  app,
  auth,
  db
};