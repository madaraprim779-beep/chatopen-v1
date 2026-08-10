/*

* ChatOpen — Système d'emojis personnalisés
* 
* Les emojis sont des images appartenant au pack visuel ChatOpen.
* Pour ajouter un nouvel emoji, ajoute simplement une entrée
* dans CHATOPEN_EMOJIS.
  */

export const CHATOPEN_EMOJIS = [

// ───────────── VISAGES ─────────────

{
id: "joy",
name: "Joie",
category: "visages",
file: "assets/emojis/joy.png"
},

{
id: "laugh",
name: "Rire",
category: "visages",
file: "assets/emojis/laugh.png"
},

{
id: "love",
name: "Amour",
category: "visages",
file: "assets/emojis/love.png"
},

{
id: "cool",
name: "Cool",
category: "visages",
file: "assets/emojis/cool.png"
},

{
id: "sad",
name: "Triste",
category: "visages",
file: "assets/emojis/sad.png"
},

{
id: "angry",
name: "Colère",
category: "visages",
file: "assets/emojis/angry.png"
},

// ───────────── AMOUR ─────────────

{
id: "heart",
name: "Cœur",
category: "amour",
file: "assets/emojis/heart.png"
},

{
id: "heart_fire",
name: "Cœur en feu",
category: "amour",
file: "assets/emojis/heart-fire.png"
},

// ───────────── GESTES ─────────────

{
id: "like",
name: "J'aime",
category: "gestes",
file: "assets/emojis/like.png"
},

{
id: "clap",
name: "Applaudir",
category: "gestes",
file: "assets/emojis/clap.png"
},

{
id: "pray",
name: "Prière",
category: "gestes",
file: "assets/emojis/pray.png"
},

// ───────────── FEU / RÉACTIONS ─────────────

{
id: "fire",
name: "Feu",
category: "reactions",
file: "assets/emojis/fire.png"
},

{
id: "star",
name: "Étoile",
category: "reactions",
file: "assets/emojis/star.png"
},

{
id: "boom",
name: "Explosion",
category: "reactions",
file: "assets/emojis/boom.png"
}

];

/*

* Catégories affichées dans le sélecteur.
  */

export const CHATOPEN_EMOJI_CATEGORIES = [

{
id: "visages",
name: "Visages",
icon: "assets/emojis/icons/faces.png"
},

{
id: "amour",
name: "Amour",
icon: "assets/emojis/icons/love.png"
},

{
id: "gestes",
name: "Gestes",
icon: "assets/emojis/icons/hands.png"
},

{
id: "reactions",
name: "Réactions",
icon: "assets/emojis/icons/reactions.png"
}

];

/*

* Retourne les emojis d'une catégorie.
  */

export function getEmojisByCategory(category) {

return CHATOPEN_EMOJIS.filter(
emoji => emoji.category === category
);

}

/*

* Crée l'image d'un emoji.
  */

export function createEmojiElement(emoji) {

const img = document.createElement("img");

img.src = emoji.file;

img.alt = emoji.name;

img.title = emoji.name;

img.className = "chatopen-emoji";

img.dataset.emojiId = emoji.id;

return img;

}

/*

* Ajoute un emoji au champ de message.
  */

export function insertEmoji(input, emoji) {

if (!input || !emoji) return;

const start = input.selectionStart ?? input.value.length;

const end = input.selectionEnd ?? input.value.length;

const value = input.value;

const emojiCode = ":co:${emoji.id}:";

input.value =
value.slice(0, start) +
emojiCode +
value.slice(end);

const newPosition =
start + emojiCode.length;

input.focus();

input.setSelectionRange(
newPosition,
newPosition
);

}

/*

* Transforme les codes ChatOpen en images
* lorsqu'un message est affiché.
  */

export function renderChatOpenEmojis(container) {

if (!container) return;

let html = container.innerHTML;

CHATOPEN_EMOJIS.forEach(emoji => {

const code =
  `:co:${emoji.id}:`;

const image = `
  <img
    src="${emoji.file}"
    alt="${emoji.name}"
    class="message-emoji"
  >
`;

html = html.split(code).join(image);

});

container.innerHTML = html;

}