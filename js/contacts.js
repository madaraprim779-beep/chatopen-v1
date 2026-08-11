import {
auth,
db
} from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
collection,
query,
where,
limit,
getDocs,
doc,
setDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentUser = null;

const searchInput =
document.getElementById("userSearch");

const results =
document.getElementById("results");

const backButton =
document.getElementById("backButton");

/* =========================================
UTILISATEUR CONNECTÉ
========================================= */

onAuthStateChanged(auth, (user) => {

if (!user) {

window.location.href = "index.html";
return;

}

currentUser = user;

});

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
RECHERCHE
========================================= */

let searchTimer;

searchInput?.addEventListener(
"input",
() => {

clearTimeout(searchTimer);

const value =
  searchInput.value.trim();


if (!value) {

  showStartMessage();
  return;

}


/*
  Petit délai pour éviter
  une recherche à chaque touche.
*/

searchTimer = setTimeout(
  () => searchUser(value),
  400
);

}
);

/* =========================================
RECHERCHER PAR ID
========================================= */

async function searchUser(value) {

if (!currentUser) return;

/*
L'ID ChatOpen doit être
exactement 8 chiffres.
*/

const chatOpenId =
value.replace(/\D/g, "");

if (chatOpenId.length !== 8) {

results.innerHTML = `

  <div class="no-results">

    <strong>ID incorrect</strong>

    Entre un identifiant ChatOpen
    de 8 chiffres.

  </div>

`;

return;

}

results.innerHTML = `

<div class="no-results">
  Recherche...
</div>

`;

try {

const usersRef =
  collection(
    db,
    "users"
  );


const userQuery =
  query(
    usersRef,
    where(
      "chatOpenId",
      "==",
      chatOpenId
    ),
    limit(1)
  );


const snapshot =
  await getDocs(
    userQuery
  );


if (snapshot.empty) {

  showNoUser();
  return;

}


const userDoc =
  snapshot.docs[0];


/*
  Empêche de rechercher
  son propre compte.
*/

if (
  userDoc.id ===
  currentUser.uid
) {

  results.innerHTML = `

    <div class="no-results">

      <strong>C'est ton compte</strong>

      Tu ne peux pas démarrer
      une conversation avec toi-même.

    </div>

  `;

  return;

}


displayUser(
  userDoc.id,
  userDoc.data()
);

} catch (error) {

console.error(
  "Erreur recherche :",
  error
);


results.innerHTML = `

  <div class="no-results">

    <strong>Erreur</strong>

    Impossible de rechercher
    cet utilisateur.

  </div>

`;

}

}

/* =========================================
AFFICHER L'UTILISATEUR
========================================= */

function displayUser(
uid,
user
) {

const name =
user.name ||
"Utilisateur";

const initial =
name
.charAt(0)
.toUpperCase();

results.innerHTML = `

<div class="search-result-title">
  Utilisateur trouvé
</div>


<div class="user-result">

  <div class="result-avatar">
    ${escapeHTML(initial)}
  </div>


  <div class="result-info">

    <div class="result-name">
      ${escapeHTML(name)}
    </div>

    <div class="result-username">
      ID ${escapeHTML(
        user.chatOpenId
      )}
    </div>

  </div>


  <button
    class="add-user"
    id="startChatButton"
  >
    Message
  </button>

</div>

`;

document
.getElementById(
"startChatButton"
)
.addEventListener(
"click",
() => {

    startConversation(
      uid,
      user
    );

  }
);

}

/* =========================================
CRÉER / OUVRIR UNE CONVERSATION
========================================= */

async function startConversation(
otherUid,
otherUser
) {

if (!currentUser) return;

const conversationId =
createConversationId(
currentUser.uid,
otherUid
);

try {

const conversationRef =
  doc(
    db,
    "conversations",
    conversationId
  );


await setDoc(
  conversationRef,
  {

    participants: [
      currentUser.uid,
      otherUid
    ],

    /*
      Ces informations permettent
      à l'écran des discussions
      d'afficher directement
      la personne.
    */

    otherUserName:
      otherUser.name ||
      "Utilisateur",

    otherUserId:
      otherUid,

    lastMessage: "",

    lastMessageAt:
      serverTimestamp(),

    createdAt:
      serverTimestamp()

  },
  {
    merge: true
  }
);


/*
  Ouvrir la discussion.
*/

window.location.href =
  `conversation.html?id=${encodeURIComponent(
    conversationId
  )}`;

} catch (error) {

console.error(
  "Erreur création conversation :",
  error
);


alert(
  "Impossible d'ouvrir la conversation."
);

}

}

/* =========================================
ID DE CONVERSATION
========================================= */

function createConversationId(
uid1,
uid2
) {

return [
uid1,
uid2
]
.sort()
.join("_");

}

/* =========================================
ÉCRAN DE DÉPART
========================================= */

function showStartMessage() {

results.innerHTML = `

<div class="no-results">

  <strong>Retrouver quelqu'un</strong>

  Entre son ID ChatOpen à 8 chiffres.

</div>

`;

}

/* =========================================
AUCUN UTILISATEUR
========================================= */

function showNoUser() {

results.innerHTML = `

<div class="no-results">

  <strong>Aucun compte trouvé</strong>

  Vérifie les 8 chiffres
  de l'ID ChatOpen.

</div>

`;

}

/* =========================================
PROTECTION HTML
========================================= */

function escapeHTML(value) {

return String(value)
.replaceAll("&", "&")
.replaceAll("<", "<")
.replaceAll(">", ">")
.replaceAll('"', """)
.replaceAll("'", "'");

}