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
// ELEMENTS
// ==========================================

const form = document.getElementById("registerForm");
const errorBox = document.getElementById("error");
const button = document.getElementById("registerButton");


// Vérification
if (!form) {
  console.error("registerForm introuvable.");
}

if (!button) {
  console.error("registerButton introuvable.");
}


// ==========================================
// GENERER L'ID CHATOPEN
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
// CREATION DU COMPTE
// ==========================================

form.addEventListener("submit", async (event) => {

  event.preventDefault();

  errorBox.textContent = "";

  button.disabled = true;
  button.textContent = "Création...";


  // ========================================
  // INFORMATIONS
  // ========================================

  const username = nettoyerNom(
    document.getElementById("username").value
  );

  const password =
    document.getElementById("password").value;

  const confirm =
    document.getElementById("confirm").value;


  // ========================================
  // VALIDATION NOM
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
  // CONFIRMATION
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
    // EMAIL TECHNIQUE FIREBASE
    // ======================================

    const email =
      username + "@chatopen.com";


    // ======================================
    // CREATION FIREBASE AUTH
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
    // PROFIL FIRESTORE
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
    // SUCCES
    // ======================================

    console.log(
      "Compte ChatOpen créé avec succès.",
      chatId
    );


    // ======================================
    // REDIRECTION
    // ======================================

    window.location.href = "chat.html";


  } catch (err) {

    console.error(
      "CHATOPEN ERROR:",
      err.code,
      err.message
    );


    // ======================================
    // ERREURS FIREBASE
    // ======================================

    switch (err.code) {

      case "auth/operation-not-allowed":

        errorBox.textContent =
          "Active Email/Password dans Firebase Authentication.";

        break;


      case "auth/email-already-in-use":

        errorBox.textContent =
          "Ce nom d'utilisateur est déjà utilisé.";

        break;


      case "auth/invalid-email":

        errorBox.textContent =
          "Firebase refuse l'adresse du compte.";

        break;


      case "auth/weak-password":

        errorBox.textContent =
          "Le mot de passe doit contenir au moins 6 caractères.";

        break;


      case "permission-denied":

      case "firestore/permission-denied":

        errorBox.textContent =
          "Firestore bloque l'enregistrement du profil.";

        break;


      default:

        errorBox.textContent =
          err.code + " : " + err.message;

    }


    button.disabled = false;
    button.textContent = "Créer mon compte";

  }

});