import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";

const usersList = document.getElementById("usersList");
const searchUser = document.getElementById("searchUser");
const messages = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

let users = [];
let currentUser = null;
let selectedUser = null;


// ===============================
// VÉRIFICATION DE LA CONNEXION
// ===============================

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  await loadUsers();
});


// ===============================
// CHARGER LES UTILISATEURS
// ===============================

async function loadUsers() {

  usersList.innerHTML =
    '<p class="muted">Chargement...</p>';

  try {

    const usersQuery = query(
      collection(db, "users"),
      orderBy("username")
    );

    const snapshot = await getDocs(usersQuery);

    users = [];

    snapshot.forEach((document) => {

      const data = document.data();

      if (document.id !== currentUser.uid) {

        users.push({
          id: document.id,
          username: data.username || "Utilisateur"
        });

      }

    });

    displayUsers(users);

  } catch (error) {

    console.error(error);

    usersList.innerHTML =
      '<p class="error">Impossible de charger les utilisateurs.</p>';
  }
}


// ===============================
// AFFICHER LES UTILISATEURS
// ===============================

function displayUsers(list) {

  if (list.length === 0) {

    usersList.innerHTML =
      '<p class="muted">Aucun autre utilisateur.</p>';

    return;
  }

  usersList.innerHTML = "";

  list.forEach((user) => {

    const button = document.createElement("button");

    button.className = "user-item";

    button.innerHTML = `
      <div class="avatar">
        ${user.username.charAt(0).toUpperCase()}
      </div>

      <div class="user-info">
        <strong>${escapeHTML(user.username)}</strong>
        <small>ChatOpen</small>
      </div>
    `;

    button.addEventListener("click", () => {
      openChat(user);
    });

    usersList.appendChild(button);
  });
}


// ===============================
// OUVRIR UNE DISCUSSION
// ===============================

function openChat(user) {

  selectedUser = user;

  document.getElementById("chatTitle").textContent =
    user.username;

  document.getElementById("chatStatus").textContent =
    "Discussion ChatOpen";

  messages.innerHTML = `
    <div class="empty-chat">
      <div class="logo">C</div>

      <h2>${escapeHTML(user.username)}</h2>

      <p class="muted">
        Commence une nouvelle discussion.
      </p>
    </div>
  `;

  messageInput.disabled = false;
  sendButton.disabled = false;

  messageInput.focus();
}


// ===============================
// RECHERCHE
// ===============================

searchUser.addEventListener("input", () => {

  const search = searchUser.value
    .trim()
    .toLowerCase();

  const filtered = users.filter((user) =>
    user.username.toLowerCase().includes(search)
  );

  displayUsers(filtered);
});


// ===============================
// ENVOYER UN MESSAGE
// ===============================

messageForm.addEventListener("submit", (event) => {

  event.preventDefault();

  if (!selectedUser) {
    return;
  }

  const text = messageInput.value.trim();

  if (!text) {
    return;
  }

  addMessage(text);

  messageInput.value = "";
  messageInput.focus();
});


// ===============================
// AFFICHER UN MESSAGE
// ===============================

function addMessage(text) {

  const message = document.createElement("div");

  message.className = "message mine";

  message.innerHTML = `
    <div class="message-bubble">
      ${escapeHTML(text)}
    </div>
  `;

  messages.appendChild(message);

  messages.scrollTop = messages.scrollHeight;
}


// ===============================
// SÉCURITÉ HTML
// ===============================

function escapeHTML(text) {

  const div = document.createElement("div");

  div.textContent = text;

  return div.innerHTML;
}