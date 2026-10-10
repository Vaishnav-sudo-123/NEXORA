const API_URL = "http://127.0.0.1:5000";


/* =========================================================
   ELEMENTS
   ========================================================= */

const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

const registerButton = document.getElementById("registerBtn");
const registerButtonText = document.getElementById("registerBtnText");

const passwordInput = document.getElementById("password");
const confirmPasswordInput =
    document.getElementById("confirmPassword");

const passwordToggle =
    document.getElementById("passwordToggle");

const confirmPasswordToggle =
    document.getElementById("confirmPasswordToggle");


/* =========================================================
   SHOW / HIDE PASSWORD
   ========================================================= */

function setupPasswordToggle(button, input) {

    if (!button || !input) {
        return;
    }

    button.addEventListener("click", function () {

        if (input.type === "password") {

            input.type = "text";

            button.innerText = "🙈";

            button.setAttribute(
                "aria-label",
                "Hide password"
            );

        } else {

            input.type = "password";

            button.innerText = "👁";

            button.setAttribute(
                "aria-label",
                "Show password"
            );
        }
    });
}


setupPasswordToggle(
    passwordToggle,
    passwordInput
);

setupPasswordToggle(
    confirmPasswordToggle,
    confirmPasswordInput
);


/* =========================================================
   SHOW MESSAGE
   ========================================================= */

function showRegisterMessage(message, type) {

    if (!registerMessage) {
        return;
    }

    registerMessage.innerText = message;

    if (type === "success") {

        registerMessage.style.color = "#059669";

    } else if (type === "error") {

        registerMessage.style.color = "#dc2626";

    } else {

        registerMessage.style.color = "#6b7280";
    }
}


/* =========================================================
   PASSWORD VALIDATION
   ========================================================= */

function validatePassword(password) {

    if (password.length < 6) {
        return "Password must contain at least 6 characters.";
    }

    return "";
}


/* =========================================================
   REGISTER FORM
   ========================================================= */

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            /* -------------------------------------------------
               GET VALUES
               ------------------------------------------------- */

            const nameInput =
                document.getElementById("name");

            const emailInput =
                document.getElementById("email");


            const name =
                nameInput.value.trim();

            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;

            const confirmPassword =
                confirmPasswordInput.value;


            /* -------------------------------------------------
               VALIDATION
               ------------------------------------------------- */

            if (!name || !email || !password || !confirmPassword) {

                showRegisterMessage(
                    "Please fill in all fields.",
                    "error"
                );

                return;
            }


            if (name.length < 2) {

                showRegisterMessage(
                    "Please enter a valid full name.",
                    "error"
                );

                return;
            }


            if (!email.includes("@")) {

                showRegisterMessage(
                    "Please enter a valid email address.",
                    "error"
                );

                return;
            }


            const passwordError =
                validatePassword(password);

            if (passwordError) {

                showRegisterMessage(
                    passwordError,
                    "error"
                );

                return;
            }


            if (password !== confirmPassword) {

                showRegisterMessage(
                    "Passwords do not match.",
                    "error"
                );

                return;
            }


            /* -------------------------------------------------
               LOADING STATE
               ------------------------------------------------- */

            if (registerButton) {
                registerButton.disabled = true;
            }

            if (registerButtonText) {
                registerButtonText.innerText =
                    "Creating Account...";
            }

            showRegisterMessage(
                "Creating your NEXORA account...",
                "normal"
            );


            /* -------------------------------------------------
               API REQUEST
               ------------------------------------------------- */

            try {

                const response = await fetch(
                    `${API_URL}/api/register`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({

                            name: name,

                            email: email,

                            password: password

                        })
                    }
                );


                /* -------------------------------------------------
                   READ RESPONSE
                   ------------------------------------------------- */

                let data;

                try {

                    data = await response.json();

                } catch (jsonError) {

                    throw new Error(
                        "Invalid response received from server."
                    );
                }


                console.log(
                    "Register Response:",
                    data
                );


                /* -------------------------------------------------
                   SUCCESS
                   ------------------------------------------------- */

                if (
                    response.ok &&
                    (
                        data.success === true ||
                        data.success === "true"
                    )
                ) {

                    showRegisterMessage(
                        "✓ Account created successfully! Redirecting to login...",
                        "success"
                    );


                    registerForm.reset();


                    setTimeout(function () {

                        window.location.href =
                            "login.html";

                    }, 1200);

                    return;
                }


                /* -------------------------------------------------
                   FAILED
                   ------------------------------------------------- */

                const errorMessage =
                    data.message ||
                    data.error ||
                    "Unable to create account.";


                showRegisterMessage(
                    errorMessage,
                    "error"
                );


            } catch (error) {

                console.error(
                    "Register Error:",
                    error
                );


                showRegisterMessage(
                    "Unable to connect to server. Make sure Flask backend is running.",
                    "error"
                );

            } finally {

                if (registerButton) {
                    registerButton.disabled = false;
                }

                if (registerButtonText) {
                    registerButtonText.innerText =
                        "Create NEXORA Account";
                }
            }

        }
    );
}