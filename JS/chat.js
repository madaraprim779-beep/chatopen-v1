// ==========================================
// ChatOpen - JS/chat.js
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ------------------------------------------
    // RÉCUPÉRATION DES ÉLÉMENTS
    // ------------------------------------------

    const messageInput =
        document.getElementById("messageInput");

    const sendButton =
        document.getElementById("sendButton");

    const messagesContainer =
        document.getElementById("messages");


    // ------------------------------------------
    // VÉRIFICATION
    // ------------------------------------------

    if (
        !messageInput ||
        !sendButton ||
        !messagesContainer
    ) {
        console.log(
            "ChatOpen : éléments du chat introuvables."
        );

        return;
    }


    // ------------------------------------------
    // UTILISATEUR CONNECTÉ
    // ------------------------------------------

    let currentUser = {
        username: "Utilisateur"
    };


    const savedUser =
        localStorage.getItem(
            "chatopen_current_user"
        );


    if (savedUser) {

        try {

            currentUser =
                JSON.parse(savedUser);

        } catch (error) {

            console.log(
                "Erreur lors de la récupération du compte."
            );

        }

    }


    // ------------------------------------------
    // RÉCUPÉRER LES MESSAGES
    // ------------------------------------------

    let messages = [];

    try {

        messages =
            JSON.parse(
                localStorage.getItem(
                    "chatopen_messages"
                )
            ) || [];

    } catch (error) {

        messages = [];

    }


    // ------------------------------------------
    // AFFICHER LES MESSAGES
    // ------------------------------------------

    function displayMessages() {

        messagesContainer.innerHTML = "";


        messages.forEach((message) => {

            const messageElement =
                document.createElement("div");


            messageElement.classList.add(
                "message"
            );


            if (
                message.username ===
                currentUser.username
            ) {

                messageElement.classList.add(
                    "my-message"
                );

            } else {

                messageElement.classList.add(
                    "other-message"
                );

            }


            const usernameElement =
                document.createElement("div");

            usernameElement.classList.add(
                "message-user"
            );

            usernameElement.textContent =
                message.username;


            const textElement =
                document.createElement("div");

            textElement.classList.add(
                "message-text"
            );

            textElement.textContent =
                message.text;


            const timeElement =
                document.createElement("div");

            timeElement.classList.add(
                "message-time"
            );

            timeElement.textContent =
                message.time;


            messageElement.appendChild(
                usernameElement
            );

            messageElement.appendChild(
                textElement
            );

            messageElement.appendChild(
                timeElement
            );


            messagesContainer.appendChild(
                messageElement
            );

        });


        // Descendre automatiquement
        messagesContainer.scrollTop =
            messagesContainer.scrollHeight;

    }


    // ------------------------------------------
    // ENVOYER UN MESSAGE
    // ------------------------------------------

    function sendMessage() {

        const text =
            messageInput.value.trim();


        // Empêcher les messages vides
        if (!text) {
            return;
        }


        const date =
            new Date();


        const time =
            date.toLocaleTimeString(
                "fr-FR",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );


        const newMessage = {

            username:
                currentUser.username,

            text:
                text,

            time:
                time

        };


        messages.push(
            newMessage
        );


        // Sauvegarder
        localStorage.setItem(
            "chatopen_messages",
            JSON.stringify(messages)
        );


        // Vider la zone de texte
        messageInput.value = "";


        // Afficher
        displayMessages();

    }


    // ------------------------------------------
    // BOUTON ENVOYER
    // ------------------------------------------

    sendButton.addEventListener(
        "click",
        sendMessage
    );


    // ------------------------------------------
    // ENVOYER AVEC ENTRÉE
    // ------------------------------------------

    messageInput.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Enter") {

                event.preventDefault();

                sendMessage();

            }

        }
    );


    // ------------------------------------------
    // AFFICHAGE INITIAL
    // ------------------------------------------

    displayMessages();

});