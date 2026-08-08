import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";

const form = document.getElementById("registerForm");
const error = document.getElementById("error");

function nettoyerNom(nom) {
  return nom
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 24);
}

function genererIdentifiant() {
  const code = crypto.randomUUID()
    .replaceAll("-", "")
    .substring(0, 10)
    .toUpperCase();

  return "CO-" + code;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  error.textContent = "";

  const username = nettoyerNom(
    document.getElementById("username").value
  );

  const password =
    document.getElementById("password").value;

  const confirm =
    document.getElementById("confirm").value;

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

    // Vérifier si le nom existe déjà
    const recherche = query(
      collection(db, "users"),
      where("username", "==", username)
    );

    const resultat = await getDocs(recherche);

    if (!resultat.empty) {
      error.textContent =
        "Ce nom d'utilisateur est déjà utilisé.";
      return;
    }

    // Création du compte Firebase
    const email =
      username + "@chatopen.local";

    const compte =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    // Génération de l'identifiant ChatOpen
    const chatId = genererIdentifiant();

    // Enregistrer l'utilisateur dans Firestore
    await setDoc(
      doc(db, "users", compte.user.uid),
      {
        uid: compte.user.uid,
        username: username,
        chatId: chatId,
        createdAt: serverTimestamp()
      }
    );

    // Aller vers l'application
    window.location.href = "chat.html";

  } catch (err) {

    console.error(err);

    error.textContent =
      "Impossible de créer le compte. Vérifie ta configuration Firebase.";
  }
});