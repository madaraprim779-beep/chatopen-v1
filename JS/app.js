// ChatOpen - app.js

document.addEventListener("DOMContentLoaded", () => {

    console.log("ChatOpen est chargé.");

    // Gestion du formulaire d'inscription
    const registerForm = document.querySelector("#registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const username = document.querySelector("#username").value.trim();
            const email = document.querySelector("#email").value.trim();
            const password = document.querySelector("#password").value;
            const confirmPassword =
                document.querySelector("#confirm-password").value;

            if (password !== confirmPassword) {
                alert("Les mots de passe ne correspondent pas.");
                return;
            }

            localStorage.setItem(
                "chatopen_user",
                JSON.stringify({
                    username: username,
                    email: email
                })
            );

            alert("Compte créé avec succès !");

            window.location.href = "login.html";
        });
    }

    // Gestion du formulaire de connexion
    const loginForm = document.querySelector("#loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const email = document.querySelector("#email").value.trim();

            const savedUser = localStorage.getItem("chatopen_user");

            if (!savedUser) {
                alert("Aucun compte trouvé. Crée d'abord un compte.");
                return;
            }

            const user = JSON.parse(savedUser);

            if (email !== user.email) {
                alert("Adresse e-mail incorrecte.");
                return;
            }

            localStorage.setItem("chatopen_logged_in", "true");

            alert("Connexion réussie !");

            window.location.href = "chat.html";
        });
    }

});