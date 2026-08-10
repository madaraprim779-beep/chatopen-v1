import {
collection,
query,
where,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db, auth } from "./firebase.js";

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

function showMessage(text) {
searchResults.innerHTML = "<div class="search-message"> ${text} </div>";
}

searchForm?.addEventListener("submit", async (event) => {

event.preventDefault();

const number = searchInput.value.trim().toUpperCase();

if (!number) {
showMessage("Entrez un numéro ChatOpen.");
return;
}

if (!number.startsWith("CO-")) {
showMessage("Le numéro doit commencer par CO-");
return;
}

try {

showMessage("Recherche en cours...");

const usersRef = collection(db, "users");

const q = query(
  usersRef,
  where("chatOpenNumber", "==", number)
);

const snapshot = await getDocs(q);

if (snapshot.empty) {
  showMessage("Aucun utilisateur trouvé.");
  return;
}

let foundUser = null;

snapshot.forEach((doc) => {
  foundUser = {
    id: doc.id,
    ...doc.data()
  };
});


if (auth.currentUser && foundUser.id === auth.currentUser.uid) {

  showMessage("C'est votre propre identifiant.");

  return;
}


searchResults.innerHTML = `
  <div class="user-result">

    <div class="user-avatar">
      ${
        foundUser.photoURL
          ? `<img src="${foundUser.photoURL}" alt="Photo">`
          : `<span>${foundUser.name?.charAt(0).toUpperCase() || "?"}</span>`
      }
    </div>

    <div class="user-info">

      <h3>${escapeHTML(foundUser.name || "Utilisateur")}</h3>

      <p>${escapeHTML(foundUser.chatOpenNumber)}</p>

    </div>

    <button
      class="message-user-btn"
      data-user-id="${foundUser.id}"
    >
      Message
    </button>

  </div>
`;


const button =
  searchResults.querySelector(".message-user-btn");


button?.addEventListener("click", () => {

  const userId = button.dataset.userId;

  window.location.href =
    `chat.html?user=${encodeURIComponent(userId)}`;

});

} catch (error) {

console.error("Erreur recherche :", error);

showMessage(
  "Une erreur est survenue pendant la recherche."
);

}

});

function escapeHTML(value) {

return String(value)
.replaceAll("&", "&")
.replaceAll("<", "<")
.replaceAll(">", ">")
.replaceAll('"', """)
.replaceAll("'", "'");

}