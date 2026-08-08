// ==========================================
// ChatOpen - chat.js
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const messageInput =
        document.getElementById("messageInput");

    const sendButton =
        document.getElementById("sendButton");

    const messagesContainer =
        document.getElementById("messages");


    // Vérifier que les éléments existent
    if (
        !messageInput ||
        !sendButton ||
        !messagesContainer
    ) {
        console.log("Éléments du chat introuvables.");
        return;
    }


    // ==========================================
    // UTILISATEUR CONNECTÉ
    // ==========================================

    let currentUser = {
        username: "Utilisateur"
    };


    const savedUser =
        localStorage.getItem("chatopen_current_user");


    if (savedUser) {

        try {

            currentUser =
                JSON.parse(savedUser);

        } catch (error) {

            console.log(
                "Erreur utilisateur."
            );

        }

    }


    // ==========================================
    // RÉCUPÉRER LES MESSAGES
    // ==========================================

    let messages =
        JSON.parse(
            localStorage.getItem(
                "chatopen_messages"
            )
        ) || [];


    // ==========================================
    // AFFICHER LES MESSAGES
    // ==========================================

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


            messageElement.innerHTML = `
                <div class="message-user">
                    ${escapeHTML(message.username)}
                </div>

                <div class="message-text">
                    ${escapeHTML(message.text)}
                </div>

                <div class="message-time">
                    ${message.time}
                </div>
            `;


            messagesContainer.appendChild(
                messageElement
            );

        });


        // Descendre automatiquement
        messagesContainer.scrollTop =
            messagesContainer.scrollHeight;

    }


    // ==========================================
    // ENVOYER UN MESSAGE
    // ==========================================

    function sendMessage() {

        const text =
            messageInput.value.trim();


        if (!text) {
            return;
        }


        const now =
            new Date();


        const time =
            now.toLocaleTimeString(
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


        messages.push(newMessage);


        localStorage.setItem(
            "chatopen_messages",
            JSON.stringify(messages)
        );


        messageInput.value = "";


        displayMessages();

    }


    // ==========================================
    // BOUTON ENVOYER
    // ==========================================

    sendButton.addEventListener(
        "click",
        sendMessage
    );


    // ==========================================
    // TOUCHE ENTRÉE
    // ==========================================

    messageInput.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Enter") {

                event.preventDefault();

                sendMessage();

            }

        }
    );


    // ==========================================
    // PROTECTION CONTRE LE HTML
    // ==========================================

    function escapeHTML(text) {

        const element =
            document.createElement("div");

        element.textContent =
            text;

        return element.innerHTML;

    }


    // ==========================================
    // AFFICHAGE INITIAL
    // ==========================================

    displayMessages();

});