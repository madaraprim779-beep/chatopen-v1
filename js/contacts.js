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

/* =========================================
ÉLÉMENTS
========================================= */

const searchInput =
document.getElementById("userSearch");

const results =
document.getElementById("results");

const backButton =
document.getElementById("backButton");

let currentUser = null;

/* =========================================
AUTHENTIFICATION
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

window.location.href = "chat.html";

}
);

/* =========================================
RECHERCHE
========================================= */

let searchTimeout = null;

searchInput?.addEventListener(
"input",
() => {

clearTimeout(searchTimeout);

const value =
  searchInput.value.trim();

if (!value) {

  showStartMessage();

  return;
}

searchTimeout = setTimeout(
  () => searchUsers(value),
  350
);

}
);

/* =========================================
RECHERCHER LES UTILISATEURS
========================================= */

async function searchUsers(value) {

if (!currentUser) return;

results.innerHTML = "<div class="no-results"> Recherche en cours... </div>";

const searchValue =
value.toLowerCase();

const usersRef =
collection(db, "users");

try {

/*
  On cherche d'abord par identifiant.

  Exemple :
  @madara4827

  Dans Firestore :
  usernameLower: "madara4827"
*/

const usernameValue =
  searchValue
    .replace("@", "")
    .trim();


const usernameQuery =
  query(
    usersRef,
    where(
      "usernameLower",
      "==",
      usernameValue
    ),
    limit(10)
  );


const usernameSnapshot =
  await getDocs(usernameQuery);


const foundUsers = [];


usernameSnapshot.forEach(
  (userDoc) => {

    if (
      userDoc.id !==
      currentUser.uid
    ) {

      foundUsers.push({
        id: userDoc.id,
        ...userDoc.data()
      });

    }

  }
);


/*
  Si aucun résultat par identifiant,
  on essaie le nom.
*/

if (foundUsers.length === 0) {

  const nameQuery =
    query(
      usersRef,
      where(
        "nameLower",
        "==",
        searchValue
      ),
      limit(10)
    );


  const nameSnapshot =
    await getDocs(nameQuery);


  nameSnapshot.forEach(
    (userDoc) => {

      if (
        userDoc.id !==
        currentUser.uid
      ) {

        foundUsers.push({
          id: userDoc.id,
          ...userDoc.data()
        });

      }

    }
  );

}


displayResults(foundUsers);

} catch (error) {

console.error(
  "Erreur de recherche :",
  error
);


results.innerHTML = `
  <div class="no-results">
    <strong>Erreur</strong>
    Impossible de rechercher les utilisateurs.
  </div>
`;

}

}

/* =========================================
AFFICHER LES RÉSULTATS
========================================= */

function displayResults(users) {

results.innerHTML = "";

if (users.length === 0) {

results.innerHTML = `
  <div class="no-results">

    <strong>Aucun utilisateur trouvé</strong>

    Vérifie le nom ou l'identifiant
    ChatOpen.

  </div>
`;

return;

}

users.forEach((user) => {

const name =
  user.name ||
  "Utilisateur";


const username =
  user.username ||
  "";


const initial =
  name
    .charAt(0)
    .toUpperCase();


const element =
  document.createElement("div");


element.className =
  "user-result";


element.innerHTML = `

  <div class="result-avatar">
    ${escapeHTML(initial)}
  </div>

  <div class="result-info">

    <div class="result-name">
      ${escapeHTML(name)}
    </div>

    <div class="result-username">
      @${escapeHTML(
        username.replace("@", "")
      )}
    </div>

  </div>

  <button
    class="add-user"
    data-user-id="${escapeHTML(user.id)}"
    data-user-name="${escapeHTML(name)}"
  >
    Ajouter
  </button>

`;


const addButton =
  element.querySelector(
    ".add-user"
  );


addButton.addEventListener(
  "click",
  () => {

    addContact(
      user.id,
      name,
      username
    );

  }
);


results.appendChild(element);

});

}

/* =========================================
AJOUTER UN CONTACT
========================================= */

async function addContact(
userId,
name,
username
) {

if (!currentUser) return;

if (userId === currentUser.uid) {

return;

}

try {

/*
  Création d'un contact dans :

  users/{monUID}/contacts/{UIDDeLaPersonne}
*/

const contactRef =
  doc(
    db,
    "users",
    currentUser.uid,
    "contacts",
    userId
  );


await setDoc(
  contactRef,
  {
    uid: userId,
    name: name,
    username: username,
    addedAt: serverTimestamp()
  },
  {
    merge: true
  }
);


/*
  On crée aussi la conversation.
  Le document sera utilisé par
  conversation.js plus tard.
*/

const conversationId =
  createConversationId(
    currentUser.uid,
    userId
  );


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
      userId
    ],

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
  Aller directement à la discussion.
*/

window.location.href =
  `conversation.html?id=${encodeURIComponent(
    conversationId
  )}`;

} catch (error) {

console.error(
  "Erreur ajout contact :",
  error
);


alert(
  "Impossible d'ajouter cette personne."
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

return [uid1, uid2]
.sort()
.join("_");

}

/* =========================================
MESSAGE INITIAL
========================================= */

function showStartMessage() {

results.innerHTML = `

<div class="no-results">

  <strong>Retrouver quelqu'un</strong>

  Recherche son nom ou son identifiant
  ChatOpen pour commencer une discussion.

</div>

`;

}

/* =========================================
SÉCURITÉ HTML
========================================= */

function escapeHTML(value) {

return String(value)
.replaceAll("&", "&")
.replaceAll("<", "<")
.replaceAll(">", ">")
.replaceAll('"', """)
.replaceAll("'", "'");

}