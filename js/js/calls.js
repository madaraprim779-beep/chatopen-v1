/*

* ChatOpen — Appels vocaux et vidéo
* WebRTC + Firebase Firestore
  */

import {
collection,
doc,
addDoc,
setDoc,
getDoc,
onSnapshot,
updateDoc,
deleteDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
auth,
db
} from "./firebase.js";

/* =========================================================
CONFIGURATION WEBRTC
========================================================= */

const ICE_SERVERS = {

iceServers: [

{
  urls: [
    "stun:stun.l.google.com:19302",
    "stun:stun1.l.google.com:19302"
  ]
}

]

};

/* =========================================================
VARIABLES
========================================================= */

let localStream = null;
let remoteStream = null;

let peerConnection = null;

let currentCallId = null;

let unsubscribeCall = null;
let unsubscribeCandidates = null;

let isCaller = false;

let currentCallType = "audio";

/* =========================================================
ÉLÉMENTS HTML
========================================================= */

const callModal =
document.getElementById("callModal");

const callTitle =
document.getElementById("callTitle");

const callStatus =
document.getElementById("callStatus");

const localVideo =
document.getElementById("localVideo");

const remoteVideo =
document.getElementById("remoteVideo");

const acceptCallButton =
document.getElementById("acceptCallButton");

const rejectCallButton =
document.getElementById("rejectCallButton");

const endCallButton =
document.getElementById("endCallButton");

const muteButton =
document.getElementById("muteButton");

const cameraButton =
document.getElementById("cameraButton");

/* =========================================================
OUVRIR LE MICRO / LA CAMÉRA
========================================================= */

async function getMedia(type) {

const constraints = {

audio: true,

video:
  type === "video"

};

localStream =
await navigator.mediaDevices
.getUserMedia(constraints);

if (localVideo) {

localVideo.srcObject =
  localStream;

}

return localStream;

}

/* =========================================================
CRÉER PEER CONNECTION
========================================================= */

function createPeerConnection() {

peerConnection =
new RTCPeerConnection(
ICE_SERVERS
);

remoteStream =
new MediaStream();

if (remoteVideo) {

remoteVideo.srcObject =
  remoteStream;

}

if (localStream) {

localStream
  .getTracks()
  .forEach((track) => {

    peerConnection.addTrack(
      track,
      localStream
    );

  });

}

peerConnection.ontrack =
(event) => {

  event.streams[0]
    .getTracks()
    .forEach((track) => {

      remoteStream.addTrack(track);

    });

};

peerConnection.onicecandidate =
async (event) => {

  if (!event.candidate ||
      !currentCallId) {

    return;

  }


  await addDoc(

    collection(
      db,
      "calls",
      currentCallId,
      "candidates"
    ),

    {
      senderId:
        auth.currentUser.uid,

      candidate:
        event.candidate.toJSON(),

      createdAt:
        serverTimestamp()

    }

  );

};

return peerConnection;

}

/* =========================================================
APPEL SORTANT
========================================================= */

export async function startCall(
receiverId,
type = "audio"
) {

if (!auth.currentUser) {

throw new Error(
  "Utilisateur non connecté."
);

}

currentCallType =
type;

await getMedia(type);

createPeerConnection();

const callRef =
await addDoc(
collection(db, "calls"),
{

    callerId:
      auth.currentUser.uid,

    receiverId:

      receiverId,

    type:
      type,

    status:
      "ringing",

    createdAt:
      serverTimestamp()

  }
);

currentCallId =
callRef.id;

const offer =
await peerConnection
.createOffer();

await peerConnection
.setLocalDescription(
offer
);

await updateDoc(
callRef,
{

  offer: {

    type:
      offer.type,

    sdp:
      offer.sdp

  }

}

);

listenToCall();

showCallScreen(
"Appel en cours",
type
);

}

/* =========================================================
ÉCOUTER L'APPEL
========================================================= */

function listenToCall() {

if (!currentCallId) return;

const callRef =
doc(
db,
"calls",
currentCallId
);

unsubscribeCall =
onSnapshot(
callRef,
async (snapshot) => {

    if (!snapshot.exists()) {

      return;

    }


    const call =
      snapshot.data();


    if (
      call.answer &&
      peerConnection &&
      !peerConnection
        .currentRemoteDescription
    ) {

      await peerConnection
        .setRemoteDescription(

          new RTCSessionDescription(
            call.answer
          )

        );

      callStatus.textContent =
        "Appel connecté";

    }


    if (
      call.status === "ended" ||
      call.status === "rejected"
    ) {

      closeCall();

    }

  }
);

const candidatesRef =
collection(
db,
"calls",
currentCallId,
"candidates"
);

unsubscribeCandidates =
onSnapshot(
candidatesRef,
async (snapshot) => {

    for (
      const change of snapshot.docChanges()
    ) {

      if (
        change.type !== "added"
      ) {

        continue;

      }


      const data =
        change.doc.data();


      if (
        data.senderId ===
        auth.currentUser.uid
      ) {

        continue;

      }


      try {

        await peerConnection
          ?.addIceCandidate(

            new RTCIceCandidate(
              data.candidate
            )

          );

      } catch (error) {

        console.error(
          "ICE error:",
          error
        );

      }

    }

  }
);

}

/* =========================================================
APPEL ENTRANT
========================================================= */

export async function acceptCall(
callId
) {

currentCallId =
callId;

const callRef =
doc(
db,
"calls",
callId
);

const snapshot =
await getDoc(callRef);

if (!snapshot.exists()) {

return;

}

const call =
snapshot.data();

currentCallType =
call.type || "audio";

await getMedia(
currentCallType
);

createPeerConnection();

if (call.offer) {

await peerConnection
  .setRemoteDescription(

    new RTCSessionDescription(
      call.offer
    )

  );

}

const answer =
await peerConnection
.createAnswer();

await peerConnection
.setLocalDescription(
answer
);

await updateDoc(
callRef,
{

  answer: {

    type:
      answer.type,

    sdp:
      answer.sdp

  },

  status:
    "connected"

}

);

listenToCall();

showCallScreen(
"Appel connecté",
currentCallType
);

}

/* =========================================================
REFUSER
========================================================= */

export async function rejectCall(
callId
) {

await updateDoc(
doc(
db,
"calls",
callId
),
{

  status:
    "rejected"

}

);

}

/* =========================================================
TERMINER
========================================================= */

export async function endCall() {

if (currentCallId) {

try {

  await updateDoc(
    doc(
      db,
      "calls",
      currentCallId
    ),
    {

      status:
        "ended",

      endedAt:
        serverTimestamp()

    }
  );

} catch (error) {

  console.error(error);

}

}

closeCall();

}

/* =========================================================
FERMER L'APPEL
========================================================= */

function closeCall() {

if (unsubscribeCall) {

unsubscribeCall();

unsubscribeCall =
  null;

}

if (unsubscribeCandidates) {

unsubscribeCandidates();

unsubscribeCandidates =
  null;

}

if (localStream) {

localStream
  .getTracks()
  .forEach(
    track => track.stop()
  );

localStream =
  null;

}

if (remoteStream) {

remoteStream
  .getTracks()
  .forEach(
    track => track.stop()
  );

remoteStream =
  null;

}

if (peerConnection) {

peerConnection.close();

peerConnection =
  null;

}

currentCallId =
null;

if (localVideo) {

localVideo.srcObject =
  null;

}

if (remoteVideo) {

remoteVideo.srcObject =
  null;

}

callModal
?.classList.add("hidden");

}

/* =========================================================
MICRO
========================================================= */

export function toggleMute() {

if (!localStream) return;

const audioTracks =
localStream
.getAudioTracks();

audioTracks.forEach(
track => {

  track.enabled =
    !track.enabled;

}

);

const enabled =
audioTracks[0]?.enabled;

if (muteButton) {

muteButton.textContent =
  enabled
    ? "🎙️"
    : "🔇";

}

}

/* =========================================================
CAMÉRA
========================================================= */

export function toggleCamera() {

if (!localStream) return;

const videoTracks =
localStream
.getVideoTracks();

videoTracks.forEach(
track => {

  track.enabled =
    !track.enabled;

}

);

const enabled =
videoTracks[0]?.enabled;

if (cameraButton) {

cameraButton.textContent =
  enabled
    ? "📹"
    : "🚫";

}

}

/* =========================================================
INTERFACE
========================================================= */

function showCallScreen(
status,
type
) {

if (!callModal) return;

callModal
.classList.remove("hidden");

if (callTitle) {

callTitle.textContent =
  type === "video"
    ? "Appel vidéo"
    : "Appel vocal";

}

if (callStatus) {

callStatus.textContent =
  status;

}

if (localVideo) {

localVideo.style.display =
  type === "video"
    ? "block"
    : "none";

}

if (remoteVideo) {

remoteVideo.style.display =
  type === "video"
    ? "block"
    : "none";

}

}

/* =========================================================
BOUTONS
========================================================= */

acceptCallButton?.addEventListener(
"click",
async () => {

if (!currentCallId) return;

await acceptCall(
  currentCallId
);

}
);

rejectCallButton?.addEventListener(
"click",
async () => {

if (!currentCallId) return;

await rejectCall(
  currentCallId
);

closeCall();

}
);

endCallButton?.addEventListener(
"click",
async () => {

await endCall();

}
);

muteButton?.addEventListener(
"click",
() => {

toggleMute();

}
);

cameraButton?.addEventListener(
"click",
() => {

toggleCamera();

}
);

/* =========================================================
APPEL ENTRANT
========================================================= */

export function listenForIncomingCalls() {

if (!auth.currentUser) {
return;
}

const callsQuery =
query(
collection(db, "calls")
);

onSnapshot(
callsQuery,
(snapshot) => {

  snapshot.docChanges()
    .forEach(
      (change) => {

        if (
          change.type !== "added"
        ) {

          return;

        }


        const call =
          change.doc.data();


        if (
          call.receiverId !==
          auth.currentUser.uid
        ) {

          return;

        }


        if (
          call.status !==
          "ringing"
        ) {

          return;

        }


        currentCallId =
          change.doc.id;


        currentCallType =
          call.type ||
          "audio";


        showIncomingCall(
          currentCallType
        );

      }
    );

}

);

}

/* =========================================================
AFFICHER APPEL ENTRANT
========================================================= */

function showIncomingCall(type) {

if (!callModal) return;

callModal
.classList.remove("hidden");

if (callTitle) {

callTitle.textContent =
  type === "video"
    ? "Appel vidéo entrant"
    : "Appel vocal entrant";

}

if (callStatus) {

callStatus.textContent =
  "Appel entrant...";

}

if (acceptCallButton) {

acceptCallButton
  .style.display =
    "inline-flex";

}

if (rejectCallButton) {

rejectCallButton
  .style.display =
    "inline-flex";

}

}

/* =========================================================
EXPORT
========================================================= */

export {
closeCall
};