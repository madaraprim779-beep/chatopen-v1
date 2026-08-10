// ==========================================
// CHATOPEN - CREATION DE COMPTE
// ==========================================

import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import { auth, db } from "./firebase.js";


// ==========================================
// ELEMENTS
// ==========================================

const form = document.getElementById("registerForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirm");
const error = document.getElementById("error");
const button = document.getElementById("registerButton");


// ==========================================
// CREATION DU COMPTE
// ==========================================

form.addEventListener("submit", async (event) => {

  event.preventDefault();

  error.textContent = "";

  const username =
    usernameInput.value.trim().toLowerCase();

  const password =
    passwordInput.value;

  const confirm =
    confirmInput.value;


  // Vérification des champs
  if (!username || !password || !confirm) {

    error.textContent =
      "Remplis tous les champs.";

    return;
  }


  // Vérification du nom
  if (username.length < 3) {

    error.textContent =
      "Le nom doit contenir au moins 3 caractères.";

    return;
  }


  // Caractères autorisés
  if (!/^[a-z0-9._-]+$/.test(username)) {

    error.textContent =
      "Utilise seulement des lettres, chiffres, point, tiret ou underscore.";

    return;
  }


  // Vérification du mot de passe
  if (password.length < 6) {

    error.textContent =
      "Le mot de passe doit contenir au moins 6 caractères.";

    return;
  }


  // Confirmation
  if (password !== confirm) {

    error.textContent =
      "Les mots de passe ne correspondent pas.";

    return;
  }


  // Adresse interne ChatOpen
  const email =
    `${username}@chatopen.app`;


  button.disabled = true;
  button.textContent = "Création...";


  try {

    // Création Firebase Authentication
    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


    // Création du profil Firestore
    await setDoc(
      doc(db, "users", result.user.uid),
      {
        username: username,
        email: email,
        createdAt: serverTimestamp()
      }
    );


    // Compte créé
    window.location.href =
      "chat.html";


  } catch (err) {

    console.error(
      "ERREUR FIREBASE :",
      err
    );

    console.error(
      "CODE :",
      err.code
    );

    console.error(
      "MESSAGE :",
      err.message
    );


    if (err.code === "auth/email-already-in-use") {

      error.textContent =
        "Ce nom d'utilisateur existe déjà.";

    }

    else if (err.code === "auth/invalid-email") {

      error.textContent =
        "Nom d'utilisateur invalide.";

    }

    else if (err.code === "auth/weak-password") {

      error.textContent =
        "Le mot de passe est trop faible.";

    }

    else if (err.code === "auth/operation-not-allowed") {

      error.textContent =
        "Email/mot de passe n'est pas activé dans Firebase.";

    }

    else if (err.code === "auth/network-request-failed") {

      error.textContent =
        "Problème de connexion Internet.";

    }

    else if (err.code === "auth/api-key-not-valid") {

      error.textContent =
        "La clé API Firebase est incorrecte.";

    }

    else if (err.code === "permission-denied") {

      error.textContent =
        "Firebase refuse l'accès à Firestore.";

    }

    else {

      error.textContent =
        "Erreur Firebase : " +
        (err.code || err.message);

    }


    button.disabled = false;
    button.textContent =
      "Créer mon compte";

  }

});