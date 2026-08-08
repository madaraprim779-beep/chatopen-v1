<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Chat - ChatOpen</title>

    <link rel="stylesheet" href="CSS/style.css">
</head>

<body>

    <div class="chat-app">

        <!-- EN-TÊTE -->
        <header class="chat-header">

            <div class="chat-logo">
                💬 ChatOpen
            </div>

            <div class="chat-user">
                <span class="current-username">
                    Utilisateur
                </span>

                <button id="logoutButton" type="button">
                    Déconnexion
                </button>
            </div>

        </header>


        <!-- ZONE DES MESSAGES -->
        <main
            id="messages"
            class="messages"
            aria-label="Messages"
        >
        </main>


        <!-- ZONE D'ÉCRITURE -->
        <footer class="chat-input-area">

            <input
                type="text"
                id="messageInput"
                placeholder="Écris un message..."
                autocomplete="off"
                maxlength="1000"
            >

            <button
                type="button"
                id="sendButton"
            >
                Envoyer
            </button>

        </footer>

    </div>


    <!-- SCRIPTS -->
    <script src="JS/app.js"></script>
    <script src="JS/chat.js"></script>

</body>
</html>