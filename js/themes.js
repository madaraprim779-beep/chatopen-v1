import {
doc,
getDoc,
setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db, auth } from "./firebase.js";

/*
Thèmes disponibles dans ChatOpen.
Chaque utilisateur peut choisir son thème
pour une conversation.
*/

export const CHAT_THEMES = {

default: {
name: "Classique",
background: "",
bubbleMine: "",
bubbleOther: ""
},

ocean: {
name: "Océan",
background:
"linear-gradient(135deg, #dff6ff, #b8e8ff)",
bubbleMine: "",
bubbleOther: ""
},

sunset: {
name: "Coucher de soleil",
background:
"linear-gradient(135deg, #ffe0c3, #ffd1dc)",
bubbleMine: "",
bubbleOther: ""
},

lavender: {
name: "Lavande",
background:
"linear-gradient(135deg, #eee5ff, #dcd1ff)",
bubbleMine: "",
bubbleOther: ""
},

forest: {
name: "Forêt",
background:
"linear-gradient(135deg, #dff5e3, #c4e8ce)",
bubbleMine: "",
bubbleOther: ""
},

dark: {
name: "Sombre",
background:
"linear-gradient(135deg, #202124, #111214)",
bubbleMine: "",
bubbleOther: ""
}

};

/*
Crée un identifiant unique pour une conversation.

Le même identifiant sera obtenu par les deux utilisateurs.
*/

export function getConversationId(userA, userB) {

return [userA, userB]
.sort()
.join("_");

}

/*
Récupère le thème d'une conversation.
*/

export async function getConversationTheme(
userA,
userB
) {

const conversationId =
getConversationId(userA, userB);

const themeRef = doc(
db,
"conversations",
conversationId,
"settings",
"theme"
);

const snapshot = await getDoc(themeRef);

if (!snapshot.exists()) {
return "default";
}

return snapshot.data().theme || "default";

}

/*
Enregistre le thème choisi.
*/

export async function saveConversationTheme(
userA,
userB,
themeName
) {

if (!auth.currentUser) {
throw new Error("Utilisateur non connecté.");
}

if (!CHAT_THEMES[themeName]) {
throw new Error("Thème invalide.");
}

const conversationId =
getConversationId(userA, userB);

const themeRef = doc(
db,
"conversations",
conversationId,
"settings",
"theme"
);

await setDoc(
themeRef,
{
theme: themeName,
updatedAt: new Date()
},
{
merge: true
}
);

}

/*
Applique le thème à la zone de discussion.
*/

export function applyConversationTheme(
container,
themeName
) {

if (!container) return;

const theme =
CHAT_THEMES[themeName] ||
CHAT_THEMES.default;

container.style.background =
theme.background || "";

container.dataset.theme =
themeName;

}

/*
Affiche les thèmes disponibles.
*/

export function renderThemeList(
container,
currentTheme,
onSelect
) {

if (!container) return;

container.innerHTML = "";

Object.entries(CHAT_THEMES).forEach(
([key, theme]) => {

  const button =
    document.createElement("button");

  button.type = "button";

  button.className =
    "theme-option";

  if (key === currentTheme) {
    button.classList.add("active");
  }

  button.innerHTML = `
    <span
      class="theme-preview"
      style="background:${theme.background || "var(--chat-bg, #f5f5f5)"}"
    ></span>

    <span>${theme.name}</span>
  `;

  button.addEventListener(
    "click",
    () => onSelect(key)
  );

  container.appendChild(button);

}

);

}