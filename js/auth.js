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
doc,
setDoc,
getDoc,
collection,
query,
where,
getDocs,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================================
GÉNÉRER UN ID CHATOPEN
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
  collection(db, "users");

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
  await getDocs(idQuery);

exists = !result.empty;

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

const credential =
  await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

const user =
  credential.user;


/* Génération de l'ID unique */

const chatOpenId =
  await generateChatOpenId();


/* Nom affiché Firebase */

await updateProfile(
  user,
  {
    displayName: name
  }
);


/* Enregistrement Firestore */

await setDoc(
  doc(
    db,
    "users",
    user.uid
  ),
  {

    uid: user.uid,

    name: name,

    nameLower:
      name.toLowerCase(),

    email: email,

    chatOpenId:
      chatOpenId,

    photoURL: "",

    status: "En ligne",

    createdAt:
      serverTimestamp()

  }
);


return {
  success: true,
  chatOpenId: chatOpenId
};

} catch (error) {

console.error(
  "Erreur création compte :",
  error
);

return {
  success: false,
  error: error
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

const credential =
  await signInWithEmailAndPassword(
    auth,
    email,
    password
  );


return {
  success: true,
  user: credential.user
};

} catch (error) {

console.error(
  "Erreur connexion :",
  error
);

return {
  success: false,
  error: error
};

}

}