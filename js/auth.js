import {
auth,
db
} from "./firebase.js";

import {
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
collection,
query,
where,
getDocs,
doc,
setDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================================
GÉNÉRER UN ID CHATOPEN UNIQUE
========================================= */

async function generateChatOpenId() {

let chatOpenId;
let exists = true;

while (exists) {

chatOpenId =
  Math.floor(
    10000000 +
    Math.random() * 90000000
  ).toString();


const usersRef =
  collection(
    db,
    "users"
  );


const idQuery =
  query(
    usersRef,
    where(
      "chatOpenId",
      "==",
      chatOpenId
    )
  );


const result =
  await getDocs(
    idQuery
  );


exists =
  !result.empty;

}

return chatOpenId;

}

/* =========================================
CRÉER UN COMPTE
========================================= */

export async function registerUser(
name,
email,
password
) {

try {

/* Vérifications */

name =
  String(name || "").trim();

email =
  String(email || "").trim();

password =
  String(password || "");


if (!name) {

  throw new Error(
    "Le nom est obligatoire."
  );

}


if (!email) {

  throw new Error(
    "L'adresse e-mail est obligatoire."
  );

}


if (password.length < 6) {

  throw new Error(
    "Le mot de passe doit contenir au moins 6 caractères."
  );

}


/* ==============================
   CRÉATION FIREBASE AUTH
   ============================== */

const credential =
  await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );


const user =
  credential.user;


/* ==============================
   GÉNÉRATION ID CHATOPEN
   ============================== */

const chatOpenId =
  await generateChatOpenId();


/* ==============================
   NOM FIREBASE
   ============================== */

await updateProfile(
  user,
  {
    displayName: name
  }
);


/* ==============================
   DOCUMENT UTILISATEUR
   ============================== */

await setDoc(
  doc(
    db,
    "users",
    user.uid
  ),
  {

    uid:
      user.uid,

    name:
      name,

    nameLower:
      name.toLowerCase(),

    email:
      email,

    chatOpenId:
      chatOpenId,

    photoURL:
      "",

    status:
      "En ligne",

    createdAt:
      serverTimestamp()

  }
);


console.log(
  "Compte créé avec succès."
);

console.log(
  "ID ChatOpen :",
  chatOpenId
);


return {

  success: true,

  user:
    user,

  chatOpenId:
    chatOpenId

};

} catch (error) {

/* ==============================
   AFFICHER L'ERREUR EXACTE
   ============================== */

console.error(
  "ERREUR CRÉATION COMPTE",
  error
);


let message =
  error?.message ||
  "Erreur inconnue";


if (error?.code) {

  message =
    error.code +
    "\n\n" +
    message;

}


alert(
  "Erreur Firebase :\n\n" +
  message
);


return {

  success: false,

  error:
    error

};

}

}

/* =========================================
CONNEXION
========================================= */

export async function loginUser(
email,
password
) {

try {

email =
  String(email || "").trim();


password =
  String(password || "");


const credential =
  await signInWithEmailAndPassword(
    auth,
    email,
    password
  );


return {

  success: true,

  user:
    credential.user

};

} catch (error) {

console.error(
  "ERREUR CONNEXION",
  error
);


let message =
  error?.message ||
  "Erreur inconnue";


if (error?.code) {

  message =
    error.code +
    "\n\n" +
    message;

}


alert(
  "Erreur Firebase :\n\n" +
  message
);


return {

  success: false,

  error:
    error

};

}

}