import {
createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
doc,
setDoc,
getDocs,
collection,
query,
where,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { auth, db } from "./firebase.js";

const form = document.getElementById("registerForm");
const message = document.getElementById("registerMessage");

/* Génère un identifiant ChatOpen */
function generateChatOpenNumber() {
const number = Math.floor(100000 + Math.random() * 900000);
return "CO-${number}";
}

/* Vérifie que l'identifiant n'existe pas déjà */
async function generateUniqueNumber() {
let chatOpenNumber;
let exists = true;

while (exists) {
chatOpenNumber = generateChatOpenNumber();

const q = query(
  collection(db, "users"),
  where("chatOpenNumber", "==", chatOpenNumber)
);

const result = await getDocs(q);
exists = !result.empty;

}

return chatOpenNumber;
}

function showMessage(text, type = "error") {
message.textContent = text;
message.className = "form-message ${type}";
}

form.addEventListener("submit", async (event) => {
event.preventDefault();

const name = document.getElementById("name").value.trim();
const password = document.getElementById("password").value;
const confirmPassword =
document.getElementById("confirmPassword").value;

if (!name) {
showMessage("Veuillez entrer votre nom.");
return;
}

if (password.length < 6) {
showMessage("Le mot de passe doit contenir au moins 6 caractères.");
return;
}

if (password !== confirmPassword) {
showMessage("Les mots de passe ne correspondent pas.");
return;
}

try {

showMessage("Création de votre compte...", "loading");


/*
  Firebase Authentication nécessite un email.
  On utilise un email interne basé sur l'identifiant Firebase.
  L'utilisateur n'a pas besoin de saisir un email.
*/

const temporaryEmail =
  `${Date.now()}-${Math.random().toString(36).slice(2)}@chatopen.local`;


const userCredential =
  await createUserWithEmailAndPassword(
    auth,
    temporaryEmail,
    password
  );


const user = userCredential.user;


const chatOpenNumber =
  await generateUniqueNumber();


await setDoc(doc(db, "users", user.uid), {

  uid: user.uid,

  name: name,

  chatOpenNumber: chatOpenNumber,

  photoURL: "",

  bio: "",

  createdAt: serverTimestamp(),

  online: true,

  lastSeen: serverTimestamp(),

  theme: {
    mode: "light",
    background: "default"
  }

});


showMessage(
  `Compte créé ! Votre identifiant est ${chatOpenNumber}`,
  "success"
);


setTimeout(() => {
  window.location.href = "chat.html";
}, 1500);

} catch (error) {

console.error(error);

let errorMessage =
  "Impossible de créer le compte.";

if (error.code === "auth/weak-password") {
  errorMessage =
    "Le mot de passe est trop faible.";
}

if (error.code === "auth/email-already-in-use") {
  errorMessage =
    "Une erreur est survenue. Veuillez réessayer.";
}

showMessage(errorMessage);

}

});