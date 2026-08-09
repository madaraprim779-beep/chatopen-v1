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
const error = document.getElementById("error");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  error.textContent = "";

  const username = usernameInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  if (!username || !password) {
    error.textContent = "Remplis tous les champs.";
    return;
  }

  if (username.length < 3) {
    error.textContent = "Le nom doit contenir au moins 3 caractères.";
    return;
  }

  if (password.length < 6) {
    error.textContent = "Le mot de passe doit contenir au moins 6 caractères.";
    return;
  }

  const email = `${username}@chatopen.app`;

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
    } else {
      error.textContent = "Impossible de créer le compte.";
    }
  }
});