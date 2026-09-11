import { auth, db } from "./firebase.js";

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import { normalizePhone } from "./utils.js";

let confirmationResult = null;

/**
 * Normalise le numéro pour avoir la même valeur
 * dans Firebase et Firestore.
 */
function cleanPhone(phone) {
  return normalizePhone(phone);
}

/**
 * Crée le reCAPTCHA invisible une seule fois.
 */
export function setupRecaptcha(containerId = "recaptcha-container") {
  if (window.chatOpenRecaptcha) {
    return window.chatOpenRecaptcha;
  }

  if (!document.getElementById(containerId)) {
    throw new Error(
      `Le conteneur reCAPTCHA "${containerId}" est introuvable.`
    );
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible"
  });

  window.chatOpenRecaptcha = verifier;

  return verifier;
}

/**
 * Envoie le code SMS.
 */
export async function sendPhoneCode(
  phone,
  containerId = "recaptcha-container"
) {
  const normalizedPhone = cleanPhone(phone);

  if (!normalizedPhone) {
    throw new Error("Entre un numéro de téléphone.");
  }

  const verifier = setupRecaptcha(containerId);

  try {
    confirmationResult = await signInWithPhoneNumber(
      auth,
      normalizedPhone,
      verifier
    );

    return true;
  } catch (error) {
    console.error("Erreur envoi SMS :", error);

    try {
      await verifier.clear();
    } catch (_) {}

    window.chatOpenRecaptcha = null;

    throw error;
  }
}

/**
 * Vérifie le code SMS et crée/met à jour le profil.
 */
export async function verifyPhoneCode(code, profile = {}) {
  if (!confirmationResult) {
    throw new Error("Demande d'abord un code SMS.");
  }

  const verificationCode = String(code || "").trim();

  if (!verificationCode) {
    throw new Error("Entre le code SMS reçu.");
  }

  const credential = await confirmationResult.confirm(
    verificationCode
  );

  const user = credential.user;

  if (!user?.uid) {
    throw new Error("Utilisateur Firebase introuvable.");
  }

  const userRef = doc(db, "users", user.uid);
  const existing = await getDoc(userRef);

  const old = existing.exists() ? existing.data() : {};

  const phone =
    user.phoneNumber ||
    old.phone ||
    profile.phone ||
    "";

  const normalizedPhone = cleanPhone(phone);

  const name =
    String(
      profile.name ||
      old.name ||
      "Utilisateur"
    ).trim();

  const profileData = {
    uid: user.uid,

    // Numéro Firebase vérifié
    phone: phone,

    // Numéro normalisé pour la recherche ChatOpen
    phoneNormalized: normalizedPhone,

    name: name,

    nameLower: name.toLowerCase(),

    photoURL:
      old.photoURL ||
      profile.photoURL ||
      "",

    status: "online",

    lastSeen: serverTimestamp(),

    createdAt:
      old.createdAt ||
      serverTimestamp(),

    privacy: {
      lastSeen:
        old.privacy?.lastSeen ?? "everyone",

      profilePhoto:
        old.privacy?.profilePhoto ?? "everyone",

      readReceipts:
        old.privacy?.readReceipts ?? true
    }
  };

  await setDoc(
    userRef,
    profileData,
    { merge: true }
  );

  confirmationResult = null;

  return user;
}

/**
 * Récupère le profil de l'utilisateur connecté.
 */
export async function getCurrentProfile(
  uid = auth.currentUser?.uid
) {
  if (!uid) {
    return null;
  }

  const snapshot = await getDoc(
    doc(db, "users", uid)
  );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data()
  };
}

/**
 * Déconnexion.
 */
export async function logout() {
  const user = auth.currentUser;

  if (user) {
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          status: "offline",
          lastSeen: serverTimestamp()
        },
        { merge: true }
      );
    } catch (error) {
      console.warn(
        "Impossible de mettre à jour le statut :",
        error
      );
    }
  }

  await signOut(auth);
}

export { onAuthStateChanged };