// js/messages.js

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase-config.js";

/**
 * Envoyer un message dans une conversation
 */
export async function sendMessage(chatId, userId, text) {
  if (!chatId || !userId || !text.trim()) {
    throw new Error("Informations du message incomplètes.");
  }

  return await addDoc(
    collection(db, "chats", chatId, "messages"),
    {
      senderId: userId,
      text: text.trim(),
      createdAt: serverTimestamp()
    }
  );
}

/**
 * Écouter les messages en temps réel
 */
export function listenMessages(chatId, callback) {
  if (!chatId) return null;

  const messagesRef = collection(db, "chats", chatId, "messages");

  const messagesQuery = query(
    messagesRef,
    orderBy("createdAt", "asc")
  );

  return onSnapshot(messagesQuery, (snapshot) => {
    const messages = [];

    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });

    callback(messages);
  });
}