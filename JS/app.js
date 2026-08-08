// ==========================================
// ChatOpen - JS/app.js
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("ChatOpen démarré");


    // ==========================================
    // GÉNÉRER UN NUMÉRO CHATOPEN UNIQUE
    // ==========================================

    function generateChatOpenNumber() {

        let users =
            JSON.parse(
                localStorage.getItem("chatopen_users")
            ) || [];


        let number;

        do {

            // Numéro de 9 chiffres
            number =
                Math.floor(
                    100000000 +
                    Math.random() * 900000000
                ).toString();

        } while (
            users.some(
                user => user.chatopenNumber === number
            )
        );


        return number;
    }


    // ==========================================
    // INSCRIPTION
    // ==========================================

    const registerForm =
        document.getElementById("registerForm");


    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();


                const username =
                    document
                        .getElementById("username")
                        .value
                        .trim();


                const password =
                    document
                        .getElementById("password")
                        .value;


                const confirmPassword =
                    document
                        .getElementById(
                            "confirm-password"
                        )
                        .value;


                // Vérifier le nom
                if (username.length < 2) {

                    alert(
                        "Le nom doit contenir au moins 2 caractères."
                    );

                    return;
                }


                // Vérifier le mot de passe
                if (password.length < 6) {

                    alert(
                        "Le mot de passe doit contenir au moins 6 caractères."
                    );

                    return;
                }


                // Vérifier les mots de passe
                if (
                    password !==
                    confirmPassword
                ) {

                    alert(
                        "Les mots de passe ne correspondent pas."
                    );

                    return;
                }


                // Récupérer les utilisateurs
                let users =
                    JSON.parse(
                        localStorage.getItem(
                            "chatopen_users"
                        )
                    ) || [];


                // Vérifier si le nom existe
                const existingUser =
                    users.find(
                        user =>
                            user.username.toLowerCase() ===
                            username.toLowerCase()
                    );


                if (existingUser) {

                    alert(
                        "Ce nom d'utilisateur est déjà utilisé."
                    );

                    return;
                }


                // Générer le numéro
                const chatopenNumber =
                    generateChatOpenNumber();


                // Créer le compte
                const newUser = {

                    username:
                        username,

                    password:
                        password,

                    chatopenNumber:
                        chatopenNumber,

                    createdAt:
                        new Date().toISOString()

                };


                // Ajouter l'utilisateur
                users.push(newUser);


                // Sauvegarder
                localStorage.setItem(
                    "chatopen_users",
                    JSON.stringify(users)
                );


                // Sauvegarder l'utilisateur actuel
                localStorage.setItem(
                    "chatopen_current_user",
                    JSON.stringify({
                        username:
                            username,

                        chatopenNumber:
                            chatopenNumber
                    })
                );


                // Afficher le numéro
                const accountCreated =
                    document.getElementById(
                        "accountCreated"
                    );


                const numberElement =
                    document.getElementById(
                        "chatopenNumber"
                    );


                if (numberElement) {

                    numberElement.textContent =
                        formatChatOpenNumber(
                            chatopenNumber
                        );

                }


                if (accountCreated) {

                    accountCreated.style.display =
                        "block";

                }


                // Cacher le formulaire
                registerForm.style.display =
                    "none";


                console.log(
                    "Compte ChatOpen créé :",
                    chatopenNumber
                );

            }
        );

    }


    // ==========================================
    // CONNEXION
    // ==========================================

    const loginForm =
        document.getElementById("loginForm");


    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();


                const chatopenNumber =
                    document
                        .getElementById(
                            "chatopenNumber"
                        )
                        ?.value
                        .replace(/\s/g, "");


                const password =
                    document
                        .getElementById("password")
                        .value;


                const users =
                    JSON.parse(
                        localStorage.getItem(
                            "chatopen_users"
                        )
                    ) || [];


                const user =
                    users.find(
                        item =>
                            item.chatopenNumber ===
                                chatopenNumber &&
                            item.password ===
                                password
                    );


                if (!user) {

                    alert(
                        "Numéro ChatOpen ou mot de passe incorrect."
                    );

                    return;
                }


                // Connexion
                localStorage.setItem(
                    "chatopen_logged_in",
                    "true"
                );


                localStorage.setItem(
                    "chatopen_current_user",
                    JSON.stringify({
                        username:
                            user.username,

                        chatopenNumber:
                            user.chatopenNumber
                    })
                );


                window.location.href =
                    "chat.html";

            }
        );

    }


    // ==========================================
    // PROTECTION DU CHAT
    // ==========================================

    const currentPage =
        window.location.pathname
            .split("/")
            .pop();


    if (currentPage === "chat.html") {

        const loggedIn =
            localStorage.getItem(
                "chatopen_logged_in"
            );


        if (loggedIn !== "true") {

            window.location.href =
                "login.html";

            return;
        }

    }


    // ==========================================
    // AFFICHER LE PROFIL
    // ==========================================

    const currentUser =
        JSON.parse(
            localStorage.getItem(
                "chatopen_current_user"
            )
        );


    if (currentUser) {

        document
            .querySelectorAll(
                ".current-username"
            )
            .forEach(
                element => {
                    element.textContent =
                        currentUser.username;
                }
            );


        document
            .querySelectorAll(
                ".current-chatopen-number"
            )
            .forEach(
                element => {
                    element.textContent =
                        formatChatOpenNumber(
                            currentUser.chatopenNumber
                        );
                }
            );

    }


    // ==========================================
    // DÉCONNEXION
    // ==========================================

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


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


    // ==========================================
    // FORMAT DU NUMÉRO
    // ==========================================

    function formatChatOpenNumber(number) {

        if (!number) {
            return "---";
        }


        return number.replace(
            /(\d{3})(\d{3})(\d{3})/,
            "$1 $2 $3"
        );

    }

});