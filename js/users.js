// js/users.js

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase-config.js";

// Créer ou enregistrer le profil utilisateur
export async function createUserProfile(userId, data = {}) {
  if (!userId) {
    throw new Error("ID utilisateur manquant.");
  }

  const userRef = doc(db, "users", userId);

  await setDoc(
    userRef,
    {
      ...data,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

// Récupérer un profil utilisateur
export async function getUserProfile(userId) {
  if (!userId) return null;

  const userRef = doc(db, "users", userId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data()
  };
}

// Modifier un profil utilisateur
export async function updateUserProfile(userId, data) {
  if (!userId) {
    throw new Error("ID utilisateur manquant.");
  }

  const userRef = doc(db, "users", userId);

  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}