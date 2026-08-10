import {
collection,
doc,
addDoc,
query,
orderBy,
onSnapshot,
getDoc,
setDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
auth,
db
} from "./firebase.js";

import {
getConversationTheme,
saveConversationTheme,
applyConversationTheme,
renderThemeList
} from "./themes.js";

import {
CHATOPEN_EMOJIS,
CHATOPEN_EMOJI_CATEGORIES,
getEmojisByCategory,
createEmojiElement,
insertEmoji,
renderChatOpenEmojis
} from "./emoji.js";

/* =========================================================
ÉLÉMENTS HTML
========================================================= */

const messagesContainer =
document.getElementById("messagesContainer");

const messageForm =
document.getElementById("messageForm");

const messageInput =
document.getElementById("messageInput");

const chatUserName =
document.getElementById("chatUserName");

const chatUserNumber =
document.getElementById("chatUserNumber");

const chatUserAvatar =
document.getElementById("chatUserAvatar");

const emptyChat =
document.getElementById("emptyChat");

const backButton =
document.getElementById("backButton");

const themeButton =
document.getElementById("themeButton");

const themeModal =
document.getElementById("themeModal");

const closeThemeButton =
document.getElementById("closeThemeButton");

const themeList =
document.getElementById("themeList");

const emojiButton =
document.getElementById("emojiButton");

/* =========================================================
VARIABLES
========================================================= */

let currentUser = null;
let otherUser = null;
let conversationId = null;

let unsubscribeMessages = null;

let currentTheme = "default";

/* =========================================================
UTILITAIRES
========================================================= */

function escapeHTML(value) {

return String(value ?? "")
.replaceAll("&", "&")
.replaceAll("<", "<")
.replaceAll(">", ">")
.replaceAll('"', """)
.replaceAll("'", "'");

}

function getOtherUserId() {

const params =
new URLSearchParams(window.location.search);

return params.get("user");

}

/* =========================================================
INITIALISATION
========================================================= */

auth.onAuthStateChanged(async (user) => {

if (!user) {

window.location.href = "index.html";

return;

}

currentUser = user;

const otherUserId =
getOtherUserId();

if (!otherUserId) {

showEmptyConversation();

return;

}

await loadOtherUser(otherUserId);

conversationId =
[currentUser.uid, otherUser.uid]
.sort()
.join("_");

await loadConversationTheme();

listenToMessages();

});

/* =========================================================
UTILISATEUR DESTINATAIRE
========================================================= */

async function loadOtherUser(userId) {

const userRef =
doc(db, "users", userId);

const snapshot =
await getDoc(userRef);

if (!snapshot.exists()) {

alert("Utilisateur introuvable.");

window.location.href =
  "search.html";

return;

}

otherUser = {
id: snapshot.id,
...snapshot.data()
};

updateChatHeader();

}

function updateChatHeader() {

chatUserName.textContent =
otherUser.name || "Utilisateur";

chatUserNumber.textContent =
otherUser.chatOpenNumber || "";

if (otherUser.photoURL) {

chatUserAvatar.innerHTML = `
  <img
    src="${escapeHTML(otherUser.photoURL)}"
    alt="Photo de profil"
  >
`;

} else {

chatUserAvatar.textContent =
  (otherUser.name || "?")
    .charAt(0)
    .toUpperCase();

}

}

/* =========================================================
MESSAGES EN TEMPS RÉEL
========================================================= */

function listenToMessages() {

if (!conversationId) return;

if (unsubscribeMessages) {

unsubscribeMessages();

}

const messagesRef =
collection(
db,
"conversations",
conversationId,
"messages"
);

const messagesQuery =
query(
messagesRef,
orderBy("createdAt", "asc")
);

/*
onSnapshot permet de recevoir automatiquement
les nouveaux messages sans actualiser la page.
*/

unsubscribeMessages =
onSnapshot(
messagesQuery,
(snapshot) => {

    messagesContainer.innerHTML = "";

    if (snapshot.empty) {

      showEmptyConversation();

      return;
    }

    snapshot.forEach((messageDoc) => {

      const message =
        messageDoc.data();

      renderMessage(
        messageDoc.id,
        message
      );

    });

    scrollToBottom();

  },
  (error) => {

    console.error(
      "Erreur temps réel :",
      error
    );

    messagesContainer.innerHTML = `
      <div class="chat-error">
        Impossible de charger les messages.
      </div>
    `;

  }
);

}

/* =========================================================
AFFICHER UN MESSAGE
========================================================= */

function renderMessage(id, message) {

const isMine =
message.senderId === currentUser.uid;

const messageElement =
document.createElement("div");

messageElement.className =
"message-row ${isMine ? "mine" : "other"}";

const bubble =
document.createElement("div");

bubble.className =
"message-bubble ${isMine ? "mine" : "other"}";

const content =
document.createElement("div");

content.className =
"message-content";

/*
Pour l'instant les messages texte sont échappés.
Les codes :co:xxx: sont ensuite remplacés
par les emojis ChatOpen.
*/

content.textContent =
message.text || "";

bubble.appendChild(content);

const time =
document.createElement("div");

time.className =
"message-time";

if (message.createdAt?.toDate) {

time.textContent =
  formatTime(
    message.createdAt.toDate()
  );

}

bubble.appendChild(time);

messageElement.appendChild(bubble);

messagesContainer.appendChild(messageElement);

/*
Transforme les codes ChatOpen
en images personnalisées.
*/

renderChatOpenEmojis(content);

}

function formatTime(date) {

return date.toLocaleTimeString(
"fr-FR",
{
hour: "2-digit",
minute: "2-digit"
}
);

}

/* =========================================================
ENVOYER UN MESSAGE
========================================================= */

messageForm?.addEventListener(
"submit",
async (event) => {

event.preventDefault();

if (!currentUser || !otherUser) {
  return;
}

const text =
  messageInput.value.trim();

if (!text) return;

messageInput.disabled = true;

try {

  const messagesRef =
    collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );


  await addDoc(
    messagesRef,
    {
      senderId:
        currentUser.uid,

      receiverId:
        otherUser.id,

      text: text,

      createdAt:
        serverTimestamp()
    }
  );


  /*
    Met à jour les informations générales
    de la conversation.
  */

  await setDoc(
    doc(
      db,
      "conversations",
      conversationId
    ),
    {
      participants: [
        currentUser.uid,
        otherUser.id
      ],

      lastMessage: text,

      lastMessageSender:
        currentUser.uid,

      updatedAt:
        serverTimestamp()
    },
    {
      merge: true
    }
  );


  messageInput.value = "";


} catch (error) {

  console.error(
    "Erreur envoi message :",
    error
  );

  alert(
    "Impossible d'envoyer le message."
  );

} finally {

  messageInput.disabled = false;

  messageInput.focus();

}

}
);

/* =========================================================
THÈMES
========================================================= */

async function loadConversationTheme() {

try {

currentTheme =
  await getConversationTheme(
    currentUser.uid,
    otherUser.id
  );

applyConversationTheme(
  messagesContainer,
  currentTheme
);

} catch (error) {

console.error(
  "Erreur thème :",
  error
);

}

}

themeButton?.addEventListener(
"click",
async () => {

if (!themeModal || !themeList) {
  return;
}

themeModal.classList.remove("hidden");

renderThemeList(
  themeList,
  currentTheme,
  async (themeName) => {

    try {

      await saveConversationTheme(
        currentUser.uid,
        otherUser.id,
        themeName
      );

      currentTheme =
        themeName;

      applyConversationTheme(
        messagesContainer,
        currentTheme
      );

      renderThemeList(
        themeList,
        currentTheme,
        arguments
      );

    } catch (error) {

      console.error(
        "Erreur changement thème :",
        error
      );

    }

  }
);

}
);

closeThemeButton?.addEventListener(
"click",
() => {

themeModal?.classList.add("hidden");

}
);

themeModal?.addEventListener(
"click",
(event) => {

if (event.target === themeModal) {

  themeModal.classList.add("hidden");

}

}
);

/* =========================================================
EMOJIS CHATOPEN
========================================================= */

let emojiPanel = null;

emojiButton?.addEventListener(
"click",
() => {

if (emojiPanel) {

  emojiPanel.remove();

  emojiPanel = null;

  return;

}

createEmojiPanel();

}
);

function createEmojiPanel() {

emojiPanel =
document.createElement("div");

emojiPanel.className =
"chatopen-emoji-panel";

const categories =
document.createElement("div");

categories.className =
"emoji-categories";

const grid =
document.createElement("div");

grid.className =
"emoji-grid";

emojiPanel.appendChild(categories);

emojiPanel.appendChild(grid);

CHATOPEN_EMOJI_CATEGORIES
.forEach((category, index) => {

  const button =
    document.createElement("button");

  button.type = "button";

  button.className =
    "emoji-category-button";

  button.textContent =
    category.name;

  button.addEventListener(
    "click",
    () => {

      renderEmojiCategory(
        category.id,
        grid
      );

    }
  );

  categories.appendChild(button);

  if (index === 0) {

    renderEmojiCategory(
      category.id,
      grid
    );

  }

});

messageForm.parentElement
.appendChild(emojiPanel);

}

function renderEmojiCategory(
categoryId,
container
) {

container.innerHTML = "";

const emojis =
getEmojisByCategory(categoryId);

emojis.forEach((emoji) => {

const button =
  document.createElement("button");

button.type = "button";

button.className =
  "emoji-item";

const image =
  createEmojiElement(emoji);

button.appendChild(image);


button.addEventListener(
  "click",
  () => {

    insertEmoji(
      messageInput,
      emoji
    );

    messageInput.focus();

  }
);


container.appendChild(button);

});

}

/* =========================================================
RETOUR
========================================================= */

backButton?.addEventListener(
"click",
() => {

window.location.href =
  "search.html";

}
);

/* =========================================================
UTILITAIRES D'AFFICHAGE
========================================================= */

function scrollToBottom() {

requestAnimationFrame(() => {

messagesContainer.scrollTop =
  messagesContainer.scrollHeight;

});

}

function showEmptyConversation() {

messagesContainer.innerHTML = "<div class="empty-chat"> <div class="empty-chat-icon">💬</div> <h3>Nouvelle conversation</h3> <p>Envoyez votre premier message.</p> </div>";

}

/* =========================================================
NETTOYAGE
========================================================= */

window.addEventListener(
"beforeunload",
() => {

if (unsubscribeMessages) {

  unsubscribeMessages();

}

}
);