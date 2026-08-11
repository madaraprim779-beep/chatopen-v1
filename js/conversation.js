import {
auth,
db
} from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
collection,
doc,
addDoc,
setDoc,
query,
orderBy,
onSnapshot,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================================
ÉLÉMENTS
========================================= */

const messagesContainer =
document.getElementById("messagesContainer");

const messages =
document.getElementById("messages");

const messageInput =
document.getElementById("messageInput");

const sendButton =
document.getElementById("sendButton");

const backButton =
document.getElementById("backButton");

const personName =
document.getElementById("personName");

const personAvatar =
document.getElementById("personAvatar");

const personStatus =
document.getElementById("personStatus");

const voiceCallButton =
document.getElementById("voiceCallButton");

const videoCallButton =
document.getElementById("videoCallButton");

/* =========================================
ID CONVERSATION
========================================= */

const params =
new URLSearchParams(
window.location.search
);

const conversationId =
params.get("id");

let currentUser = null;

let unsubscribeMessages = null;

/* =========================================
VÉRIFICATION
========================================= */

if (!conversationId) {

window.location.href =
"chat.html";

}

/* =========================================
AUTHENTIFICATION
========================================= */

onAuthStateChanged(
auth,
async (user) => {

if (!user) {

  window.location.href =
    "index.html";

  return;

}

currentUser = user;

await loadConversation();

listenToMessages();

}
);

/* =========================================
CHARGER LA CONVERSATION
========================================= */

async function loadConversation() {

try {

const conversationRef =
  doc(
    db,
    "conversations",
    conversationId
  );


/*
  On écoute également le document
  de conversation pour récupérer
  le nom de l'autre personne.
*/

onSnapshot(
  conversationRef,
  (snapshot) => {

    if (!snapshot.exists()) {

      window.location.href =
        "chat.html";

      return;

    }


    const data =
      snapshot.data();


    const participants =
      data.participants || [];


    const otherUid =
      participants.find(
        uid =>
          uid !== currentUser.uid
      );


    if (
      data.otherUserId ===
      otherUid
    ) {

      updatePerson(
        data.otherUserName
      );

    } else {

      updatePerson(
        data.otherUserName
      );

    }

  }
);

} catch (error) {

console.error(
  "Erreur conversation :",
  error
);

}

}

/* =========================================
AFFICHER LE CONTACT
========================================= */

function updatePerson(name) {

const finalName =
name ||
"Utilisateur";

personName.textContent =
finalName;

personAvatar.textContent =
finalName
.charAt(0)
.toUpperCase();

personStatus.textContent =
"Conversation";

}

/* =========================================
ÉCOUTER LES MESSAGES
========================================= */

function listenToMessages() {

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
orderBy(
"createdAt",
"asc"
)
);

unsubscribeMessages =
onSnapshot(
messagesQuery,
(snapshot) => {

    messages.innerHTML = "";


    snapshot.forEach(
      (messageDoc) => {

        renderMessage(
          messageDoc.id,
          messageDoc.data()
        );

      }
    );


    scrollToBottom();

  },

  (error) => {

    console.error(
      "Erreur messages :",
      error
    );

  }
);

}

/* =========================================
AFFICHER UN MESSAGE
========================================= */

function renderMessage(
messageId,
data
) {

const isMine =
data.senderId ===
currentUser.uid;

const row =
document.createElement("div");

row.className =
"message-row ${ isMine ? "sent" : "received" }";

const bubble =
document.createElement("div");

bubble.className =
"message-bubble";

const text =
document.createElement("span");

text.className =
"message-text";

text.textContent =
data.text || "";

const meta =
document.createElement("span");

meta.className =
"message-meta";

const time =
formatTime(
data.createdAt
);

meta.innerHTML = `

<span>${time}</span>

${
  isMine
    ? `<span class="message-check">✓✓</span>`
    : ""
}

`;

bubble.appendChild(
text
);

bubble.appendChild(
meta
);

row.appendChild(
bubble
);

/*
Un clic droit / appui long
pourra être utilisé plus tard
pour répondre, copier ou supprimer.
*/

row.dataset.messageId =
messageId;

messages.appendChild(
row
);

}

/* =========================================
ENVOYER UN MESSAGE
========================================= */

async function sendMessage() {

if (!currentUser) return;

const text =
messageInput.value.trim();

if (!text) return;

if (text.length > 4000) {

return;

}

/*
Désactive temporairement
le bouton pour éviter
les doubles clics.
*/

sendButton.disabled =
true;

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

    text:
      text,

    type:
      "text",

    createdAt:
      serverTimestamp()

  }
);


/*
  Mettre à jour le dernier message
  de la conversation.
*/

await setDoc(
  doc(
    db,
    "conversations",
    conversationId
  ),
  {

    lastMessage:
      text,

    lastMessageAt:
      serverTimestamp(),

    lastSenderId:
      currentUser.uid

  },
  {
    merge: true
  }
);


messageInput.value = "";

messageInput.focus();

} catch (error) {

console.error(
  "Erreur envoi message :",
  error
);


alert(
  "Impossible d'envoyer le message."
);

} finally {

sendButton.disabled =
  false;

}

}

/* =========================================
BOUTON ENVOYER
========================================= */

sendButton?.addEventListener(
"click",
sendMessage
);

/* =========================================
ENTRÉE CLAVIER
========================================= */

messageInput?.addEventListener(
"keydown",
(event) => {

if (
  event.key === "Enter" &&
  !event.shiftKey
) {

  event.preventDefault();

  sendMessage();

}

}
);

/* =========================================
RETOUR
========================================= */

backButton?.addEventListener(
"click",
() => {

window.location.href =
  "chat.html";

}
);

/* =========================================
SCROLL
========================================= */

function scrollToBottom() {

requestAnimationFrame(
() => {

  messagesContainer.scrollTop =
    messagesContainer.scrollHeight;

}

);

}

/* =========================================
HEURE
========================================= */

function formatTime(timestamp) {

if (!timestamp) {

return "";

}

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

/* =========================================
APPEL VOCAL
========================================= */

voiceCallButton?.addEventListener(
"click",
() => {

alert(
  "Les appels vocaux seront ajoutés dans la prochaine étape."
);

}
);

/* =========================================
APPEL VIDÉO
========================================= */

videoCallButton?.addEventListener(
"click",
() => {

alert(
  "Les appels vidéo seront ajoutés dans la prochaine étape."
);

}
);