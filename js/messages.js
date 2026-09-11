import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import { db } from "./firebase.js";

/**
 * Référence aux messages d'une conversation.
 */
function messagesCollection(chatId) {
  if (!chatId) {
    throw new Error(
      "Identifiant de conversation manquant."
    );
  }

  return collection(
    db,
    "conversations",
    chatId,
    "messages"
  );
}

/**
 * Envoyer un message texte.
 */
export async function sendMessage(
  chatId,
  userId,
  text
) {
  const cleanText =
    String(text || "").trim();

  if (!chatId) {
    throw new Error(
      "Conversation introuvable."
    );
  }

  if (!userId) {
    throw new Error(
      "Utilisateur non connecté."
    );
  }

  if (!cleanText) {
    throw new Error(
      "Le message est vide."
    );
  }

  return await addDoc(
    messagesCollection(chatId),
    {
      senderId: userId,

      text: cleanText,

      type: "text",

      createdAt: serverTimestamp(),

      readBy: [userId]
    }
  );
}

/**
 * Envoyer un média ou fichier.
 */
export async function sendMediaMessage(
  chatId,
  userId,
  type,
  url,
  fileName = "",
  mimeType = "",
  size = 0
) {
  if (!chatId || !userId || !url) {
    throw new Error(
      "Informations du fichier incomplètes."
    );
  }

  return await addDoc(
    messagesCollection(chatId),
    {
      senderId: userId,

      text: "",

      type,

      url,

      fileName,

      mimeType,

      size,

      createdAt: serverTimestamp(),

      readBy: [userId]
    }
  );
}

/**
 * Écoute les messages en temps réel.
 */
export function listenMessages(
  chatId,
  callback,
  onError = null
) {
  if (!chatId) {
    return null;
  }

  const messagesRef =
    messagesCollection(chatId);

  const messagesQuery = query(
    messagesRef,
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages =
        snapshot.docs.map((message) => ({
          id: message.id,
          ...message.data()
        }));

      callback(messages);
    },
    (error) => {
      console.error(
        "Erreur écoute messages :",
        error
      );

      if (onError) {
        onError(error);
      }
    }
  );
}

/**
 * Marque un message comme lu.
 */
export async function markMessageAsRead(
  chatId,
  messageId,
  userId
) {
  if (!chatId || !messageId || !userId) {
    return;
  }

  await updateDoc(
    doc(
      db,
      "conversations",
      chatId,
      "messages",
      messageId
    ),
    {
      readBy: arrayUnion(userId)
    }
  );
}