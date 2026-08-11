import {
auth,
db
} from "./firebase.js";

import {
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
collection,
query,
where,
orderBy,
onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================================
ÉLÉMENTS
========================================= */

const myInitial = document.getElementById("myInitial");
const myAvatar = document.getElementById("myAvatar");
const myStatus = document.getElementById("myStatus");

const menuButton = document.getElementById("menuButton");
const menuOverlay = document.getElementById("menuOverlay");
const closeMenu = document.getElementById("closeMenu");

const searchButton = document.getElementById("searchButton");
const chatSearch = document.getElementById("chatSearch");
const searchInput = document.getElementById("searchInput");
const closeSearch = document.getElementById("closeSearch");

const conversationList =
document.getElementById("conversationList");

const emptyChat =
document.getElementById("emptyChat");

const logoutButton =
document.getElementById("logoutButton");

const newChatButton =
document.getElementById("newChatButton");

const contactsButton =
document.getElementById("contactsButton");

const profileButton =
document.getElementById("profileButton");

const settingsButton =
document.getElementById("settingsButton");

/* =========================================
UTILISATEUR CONNECTÉ
========================================= */

let currentUser = null;

let unsubscribeConversations = null;

/* =========================================
AUTHENTIFICATION
========================================= */

onAuthStateChanged(auth, (user) => {

if (!user) {

window.location.href = "index.html";

return;

}

currentUser = user;

loadUserInformation();

loadConversations();

});

/* =========================================
INFORMATIONS UTILISATEUR
========================================= */

function loadUserInformation() {

if (!currentUser) return;

const name =
currentUser.displayName ||
currentUser.email?.split("@")[0] ||
"Utilisateur";

const initial =
name.charAt(0).toUpperCase();

myInitial.textContent = initial;

myStatus.textContent = "En ligne";

}

/* =========================================
CHARGER LES CONVERSATIONS
========================================= */

function loadConversations() {

if (!currentUser) return;

if (unsubscribeConversations) {
unsubscribeConversations();
}

/*
Structure attendue dans Firestore :

conversations
  └── document
      ├── participants: [uid1, uid2]
      ├── lastMessage
      ├── lastMessageAt
      └── ...

*/

const conversationsRef =
collection(db, "conversations");

const conversationsQuery = query(
conversationsRef,
where(
"participants",
"array-contains",
currentUser.uid
),
orderBy("lastMessageAt", "desc")
);

unsubscribeConversations =
onSnapshot(
conversationsQuery,
(snapshot) => {

    conversationList.innerHTML = "";

    if (snapshot.empty) {

      conversationList.appendChild(
        emptyChat
      );

      return;
    }

    snapshot.forEach((doc) => {

      const conversation =
        doc.data();

      createConversationElement(
        doc.id,
        conversation
      );

    });

  },

  (error) => {

    console.error(
      "Erreur conversations :",
      error
    );

    showEmptyMessage(
      "Impossible de charger les discussions."
    );

  }
);

}

/* =========================================
CRÉER UNE CONVERSATION À L'ÉCRAN
========================================= */

function createConversationElement(
conversationId,
conversation
) {

const element =
document.createElement("div");

element.className =
"conversation";

const otherUser =
getOtherParticipant(conversation);

const name =
conversation.otherUserName ||
conversation.name ||
"Utilisateur";

const initial =
name
.charAt(0)
.toUpperCase();

const lastMessage =
conversation.lastMessage ||
"Nouvelle conversation";

const time =
formatTime(
conversation.lastMessageAt
);

element.innerHTML = `

<div class="conversation-avatar">
  ${initial}
</div>

<div class="conversation-info">

  <div class="conversation-line">

    <span class="conversation-name">
      ${escapeHTML(name)}
    </span>

    <span class="conversation-time">
      ${time}
    </span>

  </div>

  <div class="conversation-message">
    ${escapeHTML(lastMessage)}
  </div>

</div>

`;

element.addEventListener(
"click",
() => {

  window.location.href =
    `conversation.html?id=${encodeURIComponent(conversationId)}`;

}

);

conversationList.appendChild(
element
);

}

/* =========================================
AUTRE PARTICIPANT
========================================= */

function getOtherParticipant(
conversation
) {

if (
!conversation.participants ||
!currentUser
) {
return null;
}

return conversation.participants.find(
uid => uid !== currentUser.uid
);

}

/* =========================================
RECHERCHE
========================================= */

searchButton?.addEventListener(
"click",
() => {

chatSearch.classList.add("active");

searchInput.focus();

}
);

closeSearch?.addEventListener(
"click",
() => {

chatSearch.classList.remove(
  "active"
);

searchInput.value = "";

filterConversations("");

}
);

searchInput?.addEventListener(
"input",
(event) => {

filterConversations(
  event.target.value
);

}
);

function filterConversations(value) {

const search =
value
.trim()
.toLowerCase();

const conversations =
document.querySelectorAll(
".conversation"
);

conversations.forEach(
conversation => {

  const name =
    conversation
      .querySelector(
        ".conversation-name"
      )
      ?.textContent
      .toLowerCase() || "";


  const message =
    conversation
      .querySelector(
        ".conversation-message"
      )
      ?.textContent
      .toLowerCase() || "";


  const visible =
    name.includes(search) ||
    message.includes(search);


  conversation.style.display =
    visible ? "flex" : "none";

}

);

}

/* =========================================
MENU
========================================= */

menuButton?.addEventListener(
"click",
() => {

menuOverlay.classList.add(
  "active"
);

}
);

closeMenu?.addEventListener(
"click",
() => {

menuOverlay.classList.remove(
  "active"
);

}
);

menuOverlay?.addEventListener(
"click",
(event) => {

if (
  event.target === menuOverlay
) {

  menuOverlay.classList.remove(
    "active"
  );

}

}
);

/* =========================================
NOUVELLE DISCUSSION
========================================= */

newChatButton?.addEventListener(
"click",
() => {

window.location.href =
  "contacts.html";

}
);

/* =========================================
NAVIGATION
========================================= */

contactsButton?.addEventListener(
"click",
() => {

window.location.href =
  "contacts.html";

}
);

profileButton?.addEventListener(
"click",
() => {

window.location.href =
  "profile.html";

}
);

settingsButton?.addEventListener(
"click",
() => {

window.location.href =
  "settings.html";

}
);

/* =========================================
DÉCONNEXION
========================================= */

logoutButton?.addEventListener(
"click",
async () => {

try {

  await signOut(auth);

  window.location.href =
    "index.html";

} catch (error) {

  console.error(
    "Erreur déconnexion :",
    error
  );

  alert(
    "Impossible de se déconnecter."
  );

}

}
);

/* =========================================
UTILITAIRES
========================================= */

function formatTime(timestamp) {

if (!timestamp) return "";

try {

const date =
  timestamp.toDate
    ? timestamp.toDate()
    : new Date(timestamp);

return date.toLocaleTimeString(
  "fr-FR",
  {
    hour: "2-digit",
    minute: "2-digit"
  }
);

} catch {

return "";

}

}

function escapeHTML(value) {

return String(value)
.replaceAll("&", "&")
.replaceAll("<", "<")
.replaceAll(">", ">")
.replaceAll('"', """)
.replaceAll("'", "'");

}

function showEmptyMessage(message) {

conversationList.innerHTML = `

<div class="empty-chat">

  <div class="empty-chat-icon">
    ⚠️
  </div>

  <h3>${escapeHTML(message)}</h3>

</div>

`;

}