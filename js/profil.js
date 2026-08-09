import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";

const profileAvatar = document.getElementById("profileAvatar");
const profileUsername = document.getElementById("profileUsername");
const profileEmail = document.getElementById("profileEmail");
const profileName = document.getElementById("profileName");
const profileId = document.getElementById("profileId");
const logoutButton = document.getElementById("logoutButton");


onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {

    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    let username = "Utilisateur";

    if (userSnapshot.exists()) {
      const data = userSnapshot.data();
      username = data.username || "Utilisateur";
    }

    profileUsername.textContent = username;
    profileName.textContent = username;
    profileEmail.textContent = user.email || "Aucun email";

    profileId.textContent = user.uid;

    profileAvatar.textContent =
      username.charAt(0).toUpperCase();

  } catch (error) {

    console.error(error);

    profileUsername.textContent = "Erreur";
    profileEmail.textContent =
      "Impossible de charger le profil.";
  }
});


logoutButton.addEventListener("click", async () => {

  try {

    await signOut(auth);

    window.location.href = "login.html";

  } catch (error) {

    console.error(error);

    alert("Impossible de se déconnecter.");
  }
});