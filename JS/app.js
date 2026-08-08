// ==========================================
// ChatOpen - app.js
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("ChatOpen est chargé.");

    // ==========================================
    // INSCRIPTION
    // ==========================================

    const registerForm = document.getElementById("registerForm");

    if (registerForm) {

        registerForm.addEventListener("submit", (event) => {

            event.preventDefault();

            const username =
                document.getElementById("username").value.trim();

            const email =
                document.getElementById("email").value.trim();

            const password =
                document.getElementById("password").value;

            const confirmPassword =
                document.getElementById("confirm-password").value;


            // Vérification du nom
            if (username.length < 3) {
                alert("Le nom d'utilisateur doit contenir au moins 3 caractères.");
                return;
            }


            // Vérification du mot de passe
            if (password.length < 6) {
                alert("Le mot de passe doit contenir au moins 6 caractères.");
                return;
            }


            // Vérification des mots de passe
            if (password !== confirmPassword) {
                alert("Les mots de passe ne correspondent pas.");
                return;
            }


            // Vérifier si un compte existe déjà
            const existingUser =
                localStorage.getItem("chatopen_user");

            if (existingUser) {

                const user = JSON.parse(existingUser);

                if (user.email === email) {
                    alert("Un compte avec cette adresse e-mail existe déjà.");
                    return;
                }
            }


            // Création du compte local
            const newUser = {
                username: username,
                email: email,
                password: password
            };


            localStorage.setItem(
                "chatopen_user",
                JSON.stringify(newUser)
            );


            alert("Compte ChatOpen créé avec succès !");


            // Redirection
            window.location.href = "login.html";

        });

    }


    // ==========================================
    // CONNEXION
    // ==========================================

    const loginForm =
        document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", (event) => {

            event.preventDefault();

            const email =
                document.getElementById("email").value.trim();

            const password =
                document.getElementById("password").value;


            // Récupération du compte
            const savedUser =
                localStorage.getItem("chatopen_user");


            if (!savedUser) {

                alert(
                    "Aucun compte trouvé. Crée d'abord un compte."
                );

                return;
            }


            const user =
                JSON.parse(savedUser);


            // Vérification de l'e-mail
            if (email !== user.email) {

                alert("Adresse e-mail incorrecte.");

                return;
            }


            // Vérification du mot de passe
            if (password !== user.password) {

                alert("Mot de passe incorrect.");

                return;
            }


            // Connexion réussie
            localStorage.setItem(
                "chatopen_logged_in",
                "true"
            );


            localStorage.setItem(
                "chatopen_current_user",
                JSON.stringify({
                    username: user.username,
                    email: user.email
                })
            );


            alert(
                "Connexion réussie ! Bienvenue sur ChatOpen."
            );


            // Aller vers le chat
            window.location.href = "chat.html";

        });

    }


    // ==========================================
    // PROTECTION DE CHAT.HTML
    // ==========================================

    const currentPage =
        window.location.pathname.split("/").pop();


    if (currentPage === "chat.html") {

        const loggedIn =
            localStorage.getItem("chatopen_logged_in");


        if (loggedIn !== "true") {

            alert(
                "Tu dois être connecté pour accéder à ChatOpen."
            );

            window.location.href = "login.html";

            return;
        }

    }


    // ==========================================
    // AFFICHER L'UTILISATEUR CONNECTÉ
    // ==========================================

    const currentUser =
        localStorage.getItem("chatopen_current_user");


    if (currentUser) {

        try {

            const user =
                JSON.parse(currentUser);

            const usernameElements =
                document.querySelectorAll(
                    ".current-username"
                );


            usernameElements.forEach((element) => {

                element.textContent =
                    user.username;

            });

        } catch (error) {

            console.log(
                "Impossible de récupérer l'utilisateur."
            );

        }

    }


    // ==========================================
    // DÉCONNEXION
    // ==========================================

    const logoutButton =
        document.getElementById("logoutButton");


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            () => {

                localStorage.removeItem(
                    "chatopen_logged_in"
                );

                localStorage.removeItem(
                    "chatopen_current_user"
                );


                window.location.href =
                    "login.html";

            }
        );

    }

});