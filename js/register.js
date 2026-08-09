import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";

const form = document.getElementById("registerForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirm");
const error = document.getElementById("error");
const button = document.getElementById("registerButton");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  error.textContent = "";

  const username = usernameInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  const confirm = confirmInput.value;

  if (!username || !password || !confirm) {
    error.textContent = "Remplis tous les champs.";
    return;
  }

  if (username.length < 3) {
    error.textContent = "Le nom doit contenir au moins 3 caractères.";
    return;
  }

  if (password.length < 6) {
    error.textContent =
      "Le mot de passe doit contenir au moins 6 caractères.";
    return;
  }

  if (password !== confirm) {
    error.textContent = "Les mots de passe ne correspondent pas.";
    return;
  }

  const email = `${username}@chatopen.app`;

  button.disabled = true;
  button.textContent = "Création...";

  try {
    const result = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await setDoc(doc(db, "users", result.user.uid), {
      username: username,
      email: email,
      createdAt: new Date().toISOString()
    });

    window.location.href = "chat.html";

  } catch (err) {
    console.error(err);

    if (err.code === "auth/email-already-in-use") {
      error.textContent = "Ce nom d'utilisateur existe déjà.";
    } else if (err.code === "auth/invalid-email") {
      error.textContent = "Nom d'utilisateur invalide.";
    } else if (err.code === "auth/weak-password") {
      error.textContent = "Le mot de passe est trop faible.";
    } else {
      error.textContent =
        "Erreur lors de la création du compte.";
    }

    button.disabled = false;
    button.textContent = "Créer mon compte";
  }
});