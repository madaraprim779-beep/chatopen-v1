import { auth, db } from "./firebase.js";

import {
  collection,
  query,
  where,
  getDocs,
  limit,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import { normalizePhone, escapeHTML } from "./utils.js";

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

function showMessage(text) {
  if (!searchResults) return;

  searchResults.innerHTML = `
    <div class="search-message">
      ${escapeHTML(text)}
    </div>
  `;
}

/**
 * Crée toujours le même ID pour une conversation
 * entre deux utilisateurs.
 */
function makeConversationId(uid1, uid2) {
  return [uid1, uid2]
    .sort()
    .join("_");
}

/**
 * Recherche un utilisateur avec son numéro.
 */
async function findUserByPhone(phone) {
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) {
    return [];
  }

  const usersRef = collection(db, "users");

  // Nouvelle méthode recommandée
  let snapshot = await getDocs(
    query(
      usersRef,
      where("phoneNormalized", "==", normalizedPhone),
      limit(10)
    )
  );

  // Compatibilité avec les anciens profils
  if (snapshot.empty) {
    snapshot = await getDocs(
      query(
        usersRef,
        where("phone", "==", normalizedPhone),
        limit(10)
      )
    );
  }

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
}

/**
 * Crée ou récupère une conversation privée.
 */
async function openConversation(otherUser) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  if (!otherUser?.id) {
    throw new Error("Utilisateur invalide.");
  }

  if (otherUser.id === currentUser.uid) {
    throw new Error(
      "Tu ne peux pas démarrer une conversation avec toi-même."
    );
  }

  const conversationId = makeConversationId(
    currentUser.uid,
    otherUser.id
  );

  const conversationRef = doc(
    db,
    "conversations",
    conversationId
  );

  const existing = await getDoc(
    conversationRef
  );

  if (!existing.exists()) {
    await setDoc(conversationRef, {
      type: "private",

      participants: [
        currentUser.uid,
        otherUser.id
      ],

      createdAt: serverTimestamp(),

      lastMessage: "",

      lastMessageAt: serverTimestamp(),

      lastSenderId: "",

      unread: {
        [currentUser.uid]: 0,
        [otherUser.id]: 0
      },

      lastRead: {
        [currentUser.uid]: serverTimestamp(),
        [otherUser.id]: null
      }
    });
  }

  window.location.href =
    `conversation.html?id=${encodeURIComponent(conversationId)}`;
}

async function displayResults(users) {
  if (!searchResults) return;

  if (!users.length) {
    showMessage("Aucun utilisateur ChatOpen trouvé.");
    return;
  }

  searchResults.innerHTML = users
    .map((user) => {
      const name =
        user.name || "Utilisateur";

      const initial =
        name.charAt(0).toUpperCase();

      const photo =
        user.photoURL || "";

      const avatar = photo
        ? `
          <img
            src="${escapeHTML(photo)}"
            alt=""
            class="user-avatar-image"
          >
        `
        : `
          <div class="user-avatar">
            ${escapeHTML(initial)}
          </div>
        `;

      return `
        <div class="user-result">

          ${avatar}

          <div class="user-info">
            <h3>
              ${escapeHTML(name)}
            </h3>

            <p>
              ${escapeHTML(
                user.phone || ""
              )}
            </p>
          </div>

          <button
            type="button"
            class="message-user-btn"
            data-user-id="${escapeHTML(user.id)}"
          >
            Message
          </button>

        </div>
      `;
    })
    .join("");

  searchResults
    .querySelectorAll(".message-user-btn")
    .forEach((button) => {
      button.addEventListener(
        "click",
        async () => {
          try {
            button.disabled = true;
            button.textContent = "Ouverture…";

            const userId =
              button.dataset.userId;

            const userSnapshot =
              await getDoc(
                doc(db, "users", userId)
              );

            if (!userSnapshot.exists()) {
              throw new Error(
                "Cet utilisateur n'existe plus."
              );
            }

            await openConversation({
              id: userSnapshot.id,
              ...userSnapshot.data()
            });

          } catch (error) {
            console.error(
              "Erreur ouverture conversation :",
              error
            );

            alert(
              error.message ||
              "Impossible d'ouvrir la conversation."
            );

            button.disabled = false;
            button.textContent = "Message";
          }
        }
      );
    });
}

searchForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    if (!auth.currentUser) {
      window.location.href = "login.html";
      return;
    }

    const phone =
      searchInput?.value?.trim() || "";

    if (!phone) {
      showMessage(
        "Entre un numéro de téléphone."
      );
      return;
    }

    try {
      showMessage(
        "Recherche en cours…"
      );

      const users =
        await findUserByPhone(phone);

      const filtered =
        users.filter(
          (user) =>
            user.id !==
            auth.currentUser.uid
        );

      await displayResults(filtered);

    } catch (error) {
      console.error(
        "Erreur recherche :",
        error
      );

      showMessage(
        "Impossible de faire la recherche. Vérifie Firebase et les règles Firestore."
      );
    }
  }
);