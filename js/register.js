// js/register.js

import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  auth,
  db
} from "./firebase.js";


// ================================
// ÉLÉMENTS DE LA PAGE
// ================================

const form = document.getElementById("registerForm");
const error = document.getElementById("error");


// ================================
// NETTOYER LE NOM
// ================================

function nettoyerNom(nom) {
  return nom
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 24);
}


// ================================
// GÉNÉRER LE NUMÉRO CHATOPEN
// ================================

function genererIdentifiant() {
  const code = crypto.randomUUID()
    .replaceAll("-", "")
    .substring(0, 10)
    .toUpperCase();

  return "CO-" + code;
}


// ================================
// CRÉATION DU COMPTE
// ================================

form.addEventListener("submit", async (event) => {

  event.preventDefault();

  error.textContent = "";

  const usernameInput =
    document.getElementById("username").value;

  const password =
    document.getElementById("password").value;

  const confirm =
    document.getElementById("confirm").value;


  // ================================
  // NETTOYAGE DU NOM
  // ================================

  const username =
    nettoyerNom(usernameInput);


  // ================================
  // VALIDATIONS
  // ================================

  if (username.length < 3) {
    error.textContent =
      "Le nom doit contenir au moins 3 caractères.";
    return;
  }

  if (password.length < 6) {
    error.textContent =
      "Le mot de passe doit contenir au moins 6 caractères.";
    return;
  }

  if (password !== confirm) {
    error.textContent =
      "Les mots de passe ne correspondent pas.";
    return;
  }


  try {

    // ================================
    // VÉRIFIER SI LE NOM EXISTE
    // ================================

    const recherche = query(
      collection(db, "users"),
      where("username", "==", username)
    );

    const resultat =
      await getDocs(recherche);

    if (!resultat.empty) {

      error.textContent =
        "Ce nom d'utilisateur est déjà utilisé.";

      return;
    }


    // ================================
    // EMAIL TECHNIQUE
    // ================================

    const email =
      username + "@chatopen.local";


    // ================================
    // CRÉER LE COMPTE FIREBASE
    // ================================

    const compte =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


    // ================================
    // GÉNÉRER L'IDENTIFIANT CHATOPEN
    // ================================

    const chatId =
      genererIdentifiant();


    // ================================
    // CRÉER LE PROFIL FIRESTORE
    // ================================

    await setDoc(
      doc(db, "users", compte.user.uid),
      {
        uid: compte.user.uid,

        username: username,

        chatId: chatId,

        photo: "",

        bio: "",

        createdAt: serverTimestamp(),

        online: true
      }
    );


    // ================================
    // REDIRECTION
    // ================================

    window.location.replace("chat.html");


  } catch (err) {

    // ================================
    // AFFICHER L'ERREUR
    // ================================

    console.error(
      "ERREUR CHATOPEN :",
      err.code,
      err.message
    );


    if (err.code === "auth/operation-not-allowed") {

      error.textContent =
        "Email/Password n'est pas activé dans Firebase Authentication.";

    } else if (err.code === "auth/email-already-in-use") {

      error.textContent =
        "Ce nom d'utilisateur est déjà utilisé.";

    } else if (err.code === "auth/invalid-email") {

      error.textContent =
        "Firebase refuse l'adresse utilisée pour le compte.";

    } else if (err.code === "auth/weak-password") {

      error.textContent =
        "Le mot de passe est trop faible.";

    } else if (err.code === "permission-denied") {

      error.textContent =
        "Firestore bloque l'enregistrement du profil. Les règles doivent être configurées.";

    } else {

      error.textContent =
        "Erreur : " +
        (err.message || "Impossible de créer le compte.");
    }

  }

});