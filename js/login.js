import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { auth } from "./firebase.js";

const form = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const error = document.getElementById("error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  error.textContent = "";

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    error.textContent = "Remplis tous les champs.";
    return;
  }

  /*
    Pour l'instant, on utilise le nom d'utilisateur
    comme identifiant Firebase.

    Le format utilisé est :
    nomutilisateur@chatopen.app
  */

  const email = username.toLowerCase() + "@chatopen.app";

  try {
    await signInWithEmailAndPassword(auth, email, password);

    // Connexion réussie
    window.location.href = "chat.html";

  } catch (err) {
    console.error(err);

    error.textContent = "Nom d'utilisateur ou mot de passe incorrect.";
  }
});