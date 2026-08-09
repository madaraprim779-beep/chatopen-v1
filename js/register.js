// ==========================================
// CHATOPEN - CREATION DE COMPTE
// ==========================================

import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  auth,
  db
} from "./firebase.js";


// ==========================================
// ELEMENTS HTML
// ==========================================

const form = document.getElementById("registerForm");
const errorBox = document.getElementById("error");
const button = document.getElementById("registerButton");


// ==========================================
// GENERER UN NUMERO CHATOPEN
// ==========================================

function genererChatOpenID() {

  const code = crypto.randomUUID()
    .replaceAll("-", "")
    .substring(0, 10)
    .toUpperCase();

  return "CO-" + code;
}


// ==========================================
// NETTOYER LE NOM
// ==========================================

function nettoyerNom(nom) {

  return nom
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .substring(0, 24);

}


// ==========================================
// FORMULAIRE
// ==========================================

form.addEventListener("submit", async (event) => {

  event.preventDefault();

  errorBox.textContent = "";

  button.disabled = true;
  button.textContent = "Création...";


  // ========================================
  // RECUPERATION DES INFORMATIONS
  // ========================================

  const username = nettoyerNom(
    document.getElementById("username").value
  );

  const password =
    document.getElementById("password").value;

  const confirm =
    document.getElementById("confirm").value;


  // ========================================
  // VALIDATION DU NOM
  // ========================================

  if (username.length < 3) {

    errorBox.textContent =
      "Le nom doit contenir au moins 3 caractères.";

    button.disabled = false;
    button.textContent = "Créer mon compte";

    return;
  }


  // ========================================
  // VALIDATION MOT DE PASSE
  // ========================================

  if (password.length < 6) {

    errorBox.textContent =
      "Le mot de passe doit contenir au moins 6 caractères.";

    button.disabled = false;
    button.textContent = "Créer mon compte";

    return;
  }


  // ========================================
  // CONFIRMATION MOT DE PASSE
  // ========================================

  if (password !== confirm) {

    errorBox.textContent =
      "Les mots de passe ne correspondent pas.";

    button.disabled = false;
    button.textContent = "Créer mon compte";

    return;
  }


  try {

    // ======================================
    // EMAIL TECHNIQUE POUR FIREBASE
    // ======================================

    const email =
      username + "@chatopen.com";


    // ======================================
    // CREATION FIREBASE AUTHENTICATION
    // ======================================

    const credential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


    const user = credential.user;


    // ======================================
    // GENERATION NUMERO CHATOPEN
    // ======================================

    const chatId =
      genererChatOpenID();


    // ======================================
    // CREATION PROFIL FIRESTORE
    // ======================================

    await setDoc(
      doc(db, "users", user.uid),
      {

        uid: user.uid,

        username: username,

        chatId: chatId,

        photo: "",

        bio: "",

        online: true,

        createdAt: serverTimestamp()

      }
    );


    // ======================================
    // COMPTE CREE
    // ======================================

    console.log(
      "Compte ChatOpen créé :",
      chatId
    );


    // ======================================
    // REDIRECTION
    // ======================================

    window.location.replace("chat.html");


  } catch (error) {

    console.error(
      "ERREUR CHATOPEN :",
      error.code,
      error.message
    );


    // ======================================
    // MESSAGES D'ERREUR
    // ======================================

    if (error.code === "auth/email-already-in-use") {

      errorBox.textContent =
        "Ce nom est déjà utilisé.";

    }

    else if (
      error.code === "auth/operation-not-allowed"
    ) {

      errorBox.textContent =
        "Email/Password n'est pas activé dans Firebase.";

    }

    else if (
      error.code === "auth/invalid-email"
    ) {

      errorBox.textContent =
        "Firebase refuse cette adresse.";

    }

    else if (
      error.code === "auth/weak-password"
    ) {

      errorBox.textContent =
        "Le mot de passe est trop faible.";

    }

    else if (
      error.code === "permission-denied"
    ) {

      errorBox.textContent =
        "Firestore refuse l'accès. Vérifie les règles.";

    }

    else {

      errorBox.textContent =
        error.code + " : " + error.message;

    }


    // ======================================
    // REACTIVER LE BOUTON
    // ======================================

    button.disabled = false;

    button.textContent =
      "Créer mon compte";

  }

});