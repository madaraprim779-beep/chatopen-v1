import {
  auth,
  db,
  storage
} from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js";

import {
  escapeHTML,
  formatTime
} from "./utils.js";

const params =
  new URLSearchParams(location.search);

const conversationId =
  params.get("id");

if (!conversationId) {
  window.location.href = "chat.html";
}

const messages =
  document.querySelector("#messages");

const input =
  document.querySelector("#messageInput");

const sendButton =
  document.querySelector("#send");

const typing =
  document.querySelector("#typing");

const backButton =
  document.querySelector("#back");

const attachButton =
  document.querySelector("#attach");

const fileInput =
  document.querySelector("#fileInput");

const recordButton =
  document.querySelector("#record");

const personName =
  document.querySelector("#personName");

const personAvatar =
  document.querySelector("#personAvatar");

const personStatus =
  document.querySelector("#personStatus");

let me = null;
let conversation = null;
let otherUser = null;
let typingTimer = null;
let mediaRecorder = null;
let voiceChunks = [];
let unsubscribeMessages = null;
let unsubscribeTyping = null;
let unsubscribeOtherUser = null;

/**
 * Initialisation de la conversation.
 */
onAuthStateChanged(
  auth,
  async (user) => {
    if (!user) {
      window.location.href =
        "login.html";
      return;
    }

    me = user;

    try {
      await initializeConversation();
    } catch (error) {
      console.error(
        "Erreur initialisation conversation :",
        error
      );

      alert(
        "Impossible d'ouvrir cette conversation."
      );

      window.location.href =
        "chat.html";
    }
  }
);

/**
 * Charge la conversation et le profil
 * de l'autre utilisateur.
 */
async function initializeConversation() {
  const conversationRef =
    doc(
      db,
      "conversations",
      conversationId
    );

  const conversationSnapshot =
    await getDoc(conversationRef);

  if (!conversationSnapshot.exists()) {
    throw new Error(
      "Conversation introuvable."
    );
  }

  conversation =
    conversationSnapshot.data();

  const participants =
    conversation.participants || [];

  if (
    !participants.includes(me.uid)
  ) {
    throw new Error(
      "Tu n'es pas membre de cette conversation."
    );
  }

  if (
    conversation.type &&
    conversation.type !== "private"
  ) {
    throw new Error(
      "Cette page est réservée aux conversations privées."
    );
  }

  otherUser =
    participants.find(
      (uid) => uid !== me.uid
    );

  if (!otherUser) {
    throw new Error(
      "Destinataire introuvable."
    );
  }

  await loadOtherUser();

  listenMessages();

  listenTyping();

  listenOtherUser();

  await markConversationAsRead();
}

/**
 * Charge le profil du destinataire.
 */
async function loadOtherUser() {
  const profileSnapshot =
    await getDoc(
      doc(
        db,
        "users",
        otherUser
      )
    );

  const profile =
    profileSnapshot.exists()
      ? profileSnapshot.data()
      : {};

  updatePersonHeader(profile);
}

/**
 * Affiche nom, photo et statut.
 */
function updatePersonHeader(profile) {
  const name =
    profile.name ||
    "Utilisateur";

  if (personName) {
    personName.textContent =
      name;
  }

  if (personAvatar) {
    if (profile.photoURL) {
      personAvatar.innerHTML = `
        <img
          src="${escapeHTML(
            profile.photoURL
          )}"
          alt=""
          style="
            width:100%;
            height:100%;
            object-fit:cover;
            border-radius:50%;
          "
        >
      `;
    } else {
      personAvatar.textContent =
        name.charAt(0).toUpperCase();
    }
  }

  updateStatus(
    profile.status
  );
}

/**
 * Affiche le statut en ligne.
 */
function updateStatus(status) {
  if (!personStatus) return;

  personStatus.textContent =
    status === "online"
      ? "en ligne"
      : "hors ligne";
}

/**
 * Écoute le profil du destinataire.
 */
function listenOtherUser() {
  unsubscribeOtherUser =
    onSnapshot(
      doc(
        db,
        "users",
        otherUser
      ),
      (snapshot) => {
        if (!snapshot.exists()) return;

        updatePersonHeader(
          snapshot.data()
        );
      }
    );
}

/**
 * Écoute les messages en temps réel.
 */
function listenMessages() {
  const messagesRef =
    collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );

  const messagesQuery =
    query(
      messagesRef,
      orderBy(
        "createdAt",
        "asc"
      )
    );

  unsubscribeMessages =
    onSnapshot(
      messagesQuery,
      (snapshot) => {
        const list =
          snapshot.docs.map(
            (item) => ({
              id: item.id,
              ...item.data()
            })
          );

        renderMessages(list);

        markReceivedMessagesAsRead(
          list
        );
      },
      (error) => {
        console.error(
          "Erreur messages :",
          error
        );
      }
    );
}

/**
 * Affiche les messages.
 */
function renderMessages(list) {
  if (!messages) return;

  messages.innerHTML =
    list.map((message) => {
      const mine =
        message.senderId === me.uid;

      let body = "";

      if (
        message.type ===
        "image"
      ) {
        body = `
          <a
            href="${escapeHTML(
              message.url || "#"
            )}"
            target="_blank"
            rel="noopener"
          >
            <img
              class="msg-image"
              src="${escapeHTML(
                message.url || ""
              )}"
              alt="Image"
            >
          </a>
        `;
      }

      else if (
        message.type ===
        "video"
      ) {
        body = `
          <video
            class="msg-video"
            controls
            src="${escapeHTML(
              message.url || ""
            )}"
          ></video>
        `;
      }

      else if (
        message.type ===
        "voice"
      ) {
        body = `
          <audio
            controls
            src="${escapeHTML(
              message.url || ""
            )}"
          ></audio>
        `;
      }

      else if (
        message.type ===
        "file"
      ) {
        body = `
          <a
            class="file"
            href="${escapeHTML(
              message.url || "#"
            )}"
            target="_blank"
            rel="noopener"
          >
            📎
            ${escapeHTML(
              message.fileName ||
              "Fichier"
            )}
          </a>
        `;
      }

      else {
        body = `
          <span>
            ${escapeHTML(
              message.text || ""
            )}
          </span>
        `;
      }

      const read =
        mine &&
        Array.isArray(
          message.readBy
        ) &&
        message.readBy.includes(
          otherUser
        );

      return `
        <div
          class="bubble-row ${
            mine ? "mine" : ""
          }"
        >
          <div class="bubble">
            ${body}

            <small>
              ${formatTime(
                message.createdAt
              )}

              ${
                mine
                  ? read
                    ? " ✓✓"
                    : " ✓"
                  : ""
              }
            </small>
          </div>
        </div>
      `;
    }).join("");

  messages.scrollTop =
    messages.scrollHeight;
}

/**
 * Marque les messages reçus comme lus.
 */
async function markReceivedMessagesAsRead(
  list
) {
  const unread =
    list.filter(
      (message) =>
        message.senderId !==
          me.uid &&
        !(
          Array.isArray(
            message.readBy
          ) &&
          message.readBy.includes(
            me.uid
          )
        )
    );

  for (const message of unread) {
    try {
      await updateDoc(
        doc(
          db,
          "conversations",
          conversationId,
          "messages",
          message.id
        ),
        {
          readBy:
            arrayUnion(me.uid)
        }
      );
    } catch (error) {
      console.warn(
        "Impossible de marquer le message comme lu :",
        error
      );
    }
  }
}

/**
 * Marque toute la conversation comme lue.
 */
async function markConversationAsRead() {
  try {
    await updateDoc(
      doc(
        db,
        "conversations",
        conversationId
      ),
      {
        [`unread.${me.uid}`]: 0,

        [`lastRead.${me.uid}`]:
          serverTimestamp()
      }
    );
  } catch (error) {
    console.warn(
      "Lecture conversation :",
      error
    );
  }
}

/**
 * Envoie un message.
 */
async function sendMessage(
  text,
  type = "text",
  extra = {}
) {
  const cleanText =
    String(text || "").trim();

  if (
    type === "text" &&
    !cleanText
  ) {
    return;
  }

  if (!me || !otherUser) {
    return;
  }

  if (sendButton) {
    sendButton.disabled = true;
  }

  try {
    await addDoc(
      collection(
        db,
        "conversations",
        conversationId,
        "messages"
      ),
      {
        senderId: me.uid,

        text:
          type === "text"
            ? cleanText
            : "",

        type,

        createdAt:
          serverTimestamp(),

        readBy: [me.uid],

        ...extra
      }
    );

    const currentUnread =
      Number(
        conversation?.unread?.[
          otherUser
        ] || 0
      );

    const preview =
      type === "text"
        ? cleanText
        : type === "voice"
        ? "🎙 Message vocal"
        : type === "image"
        ? "📷 Photo"
        : type === "video"
        ? "🎥 Vidéo"
        : "📎 Fichier";

    await updateDoc(
      doc(
        db,
        "conversations",
        conversationId
      ),
      {
        lastMessage:
          preview,

        lastMessageAt:
          serverTimestamp(),

        lastSenderId:
          me.uid,

        [`unread.${otherUser}`]:
          currentUnread + 1
      }
    );

    conversation.unread = {
      ...(conversation.unread || {}),
      [otherUser]:
        currentUnread + 1
    };

    if (input) {
      input.value = "";
    }

  } catch (error) {
    console.error(
      "Erreur envoi message :",
      error
    );

    alert(
      "Le message n'a pas pu être envoyé."
    );
  } finally {
    if (sendButton) {
      sendButton.disabled = false;
    }
  }
}

/**
 * Bouton envoyer.
 */
sendButton?.addEventListener(
  "click",
  () => {
    sendMessage(
      input?.value || ""
    );
  }
);

/**
 * Touche Entrée.
 */
input?.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage(
        input.value
      );
    }
  }
);

/**
 * Indicateur "écrit..."
 */
input?.addEventListener(
  "input",
  async () => {
    if (!me) return;

    try {
      await setDoc(
        doc(
          db,
          "conversations",
          conversationId,
          "typing",
          me.uid
        ),
        {
          typing: true,
          at: serverTimestamp()
        },
        {
          merge: true
        }
      );
    } catch (_) {}

    clearTimeout(
      typingTimer
    );

    typingTimer =
      setTimeout(
        async () => {
          try {
            await setDoc(
              doc(
                db,
                "conversations",
                conversationId,
                "typing",
                me.uid
              ),
              {
                typing: false,
                at: serverTimestamp()
              },
              {
                merge: true
              }
            );
          } catch (_) {}
        },
        1500
      );
  }
);

/**
 * Écoute "écrit..."
 */
function listenTyping() {
  unsubscribeTyping =
    onSnapshot(
      doc(
        db,
        "conversations",
        conversationId,
        "typing",
        otherUser
      ),
      (snapshot) => {
        if (!typing) return;

        typing.textContent =
          snapshot.exists() &&
          snapshot.data().typing
            ? "écrit…"
            : "";
      }
    );
}

/**
 * Fichiers, images et vidéos.
 */
attachButton?.addEventListener(
  "click",
  () => {
    fileInput?.click();
  }
);

fileInput?.addEventListener(
  "change",
  async (event) => {
    const file =
      event.target.files?.[0];

    if (!file || !me) return;

    try {
      attachButton.disabled =
        true;

      const safeName =
        file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

      const path =
        `attachments/${me.uid}/${conversationId}/${Date.now()}_${safeName}`;

      const storageRef =
        ref(
          storage,
          path
        );

      const uploaded =
        await uploadBytes(
          storageRef,
          file
        );

      const url =
        await getDownloadURL(
          uploaded.ref
        );

      let type = "file";

      if (
        file.type.startsWith(
          "image/"
        )
      ) {
        type = "image";
      }

      else if (
        file.type.startsWith(
          "video/"
        )
      ) {
        type = "video";
      }

      await sendMessage(
        "",
        type,
        {
          url,
          fileName:
            file.name,
          mimeType:
            file.type,
          size:
            file.size
        }
      );

    } catch (error) {
      console.error(
        "Erreur fichier :",
        error
      );

      alert(
        "Impossible d'envoyer ce fichier."
      );
    } finally {
      attachButton.disabled =
        false;

      fileInput.value = "";
    }
  }
);

/**
 * Enregistrement vocal.
 */
recordButton?.addEventListener(
  "click",
  async () => {
    if (
      mediaRecorder?.state ===
      "recording"
    ) {
      mediaRecorder.stop();
      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true
          }
        );

      voiceChunks = [];

      mediaRecorder =
        new MediaRecorder(
          stream
        );

      mediaRecorder.ondataavailable =
        (event) => {
          if (
            event.data.size > 0
          ) {
            voiceChunks.push(
              event.data
            );
          }
        };

      mediaRecorder.onstop =
        async () => {
          try {
            stream
              .getTracks()
              .forEach(
                (track) =>
                  track.stop()
              );

            const blob =
              new Blob(
                voiceChunks,
                {
                  type:
                    mediaRecorder.mimeType ||
                    "audio/webm"
                }
              );

            const path =
              `voices/${me.uid}/${conversationId}/${Date.now()}.webm`;

            const storageRef =
              ref(
                storage,
                path
              );

            const uploaded =
              await uploadBytes(
                storageRef,
                blob
              );

            const url =
              await getDownloadURL(
                uploaded.ref
              );

            await sendMessage(
              "",
              "voice",
              {
                url,
                duration: 0,
                mimeType:
                  blob.type,
                size:
                  blob.size
              }
            );

          } catch (error) {
            console.error(
              "Erreur message vocal :",
              error
            );

            alert(
              "Impossible d'envoyer le message vocal."
            );
          } finally {
            if (recordButton) {
              recordButton.textContent =
                "🎙";
            }
          }
        };

      mediaRecorder.start();

      recordButton.textContent =
        "⏹";

    } catch (error) {
      console.error(
        "Microphone :",
        error
      );

      alert(
        "Autorise le microphone dans ton navigateur pour envoyer un message vocal."
      );
    }
  }
);

/**
 * Retour.
 */
backButton?.addEventListener(
  "click",
  () => {
    window.location.href =
      "chat.html";
  }
);

/**
 * Nettoyage des écouteurs.
 */
window.addEventListener(
  "beforeunload",
  () => {
    unsubscribeMessages?.();
    unsubscribeTyping?.();
    unsubscribeOtherUser?.();
  }
);