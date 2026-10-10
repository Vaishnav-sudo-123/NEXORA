const API_URL = "http://127.0.0.1:5000";


/* =========================================================
   LOGIN FORM
   ========================================================= */

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const loginButton = document.getElementById("loginBtn");
const loginButtonText = document.getElementById("loginBtnText");


/* =========================================================
   PASSWORD SHOW / HIDE
   ========================================================= */

const passwordInput = document.getElementById("password");
const passwordToggle = document.getElementById("passwordToggle");

if (passwordToggle && passwordInput) {

    passwordToggle.addEventListener("click", function () {

        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            passwordToggle.innerText = "🙈";
            passwordToggle.setAttribute(
                "aria-label",
                "Hide password"
            );

        } else {

            passwordInput.type = "password";

            passwordToggle.innerText = "👁";
            passwordToggle.setAttribute(
                "aria-label",
                "Show password"
            );
        }
    });
}


/* =========================================================
   SHOW MESSAGE
   ========================================================= */

function showLoginMessage(message, type) {

    if (!loginMessage) {
        return;
    }

    loginMessage.innerText = message;

    if (type === "success") {

        loginMessage.style.color = "#059669";

    } else if (type === "error") {

        loginMessage.style.color = "#dc2626";

    } else {

        loginMessage.style.color = "#6b7280";
    }
}


/* =========================================================
   LOGIN FORM SUBMIT
   ========================================================= */

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();


        /* -------------------------------------------------
           GET VALUES
           ------------------------------------------------- */

        const email = document
            .getElementById("email")
            .value
            .trim();

        const password = document
            .getElementById("password")
            .value;


        /* -------------------------------------------------
           BASIC VALIDATION
           ------------------------------------------------- */

        if (!email || !password) {

            showLoginMessage(
                "Please enter email and password.",
                "error"
            );

            return;
        }


        if (!email.includes("@")) {

            showLoginMessage(
                "Please enter a valid email address.",
                "error"
            );

            return;
        }


        /* -------------------------------------------------
           LOADING STATE
           ------------------------------------------------- */

        if (loginButton) {
            loginButton.disabled = true;
        }

        if (loginButtonText) {
            loginButtonText.innerText = "Logging in...";
        }

        showLoginMessage(
            "Connecting to NEXORA...",
            "normal"
        );


        /* -------------------------------------------------
           API REQUEST
           ------------------------------------------------- */

        try {

            const response = await fetch(
                `${API_URL}/api/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );


            /* -------------------------------------------------
               RESPONSE
               ------------------------------------------------- */

            let data;

            try {

                data = await response.json();

            } catch (jsonError) {

                throw new Error(
                    "Invalid response received from server."
                );
            }


            console.log("Login Response:", data);


            /* -------------------------------------------------
               LOGIN SUCCESS
               ------------------------------------------------- */

            if (
                response.ok &&
                (
                    data.success === true ||
                    data.success === "true"
                )
            ) {

                showLoginMessage(
                    "✓ Login successful! Redirecting...",
                    "success"
                );


                /* ---------------------------------------------
                   SAVE USER DATA
                   --------------------------------------------- */

                const userData =
                    data.user ||
                    data.data ||
                    {
                        email: email
                    };


                localStorage.setItem(
                    "nexoraUser",
                    JSON.stringify(userData)
                );


                /* ---------------------------------------------
                   REDIRECT
                   --------------------------------------------- */

                setTimeout(function () {

                    window.location.href =
                        "dashboard.html";

                }, 700);

                return;
            }


            /* -------------------------------------------------
               LOGIN FAILED
               ------------------------------------------------- */

            const errorMessage =
                data.message ||
                data.error ||
                "Invalid email or password.";


            showLoginMessage(
                errorMessage,
                "error"
            );


        } catch (error) {

            console.error(
                "Login Error:",
                error
            );


            showLoginMessage(
                "Unable to connect to server. Make sure Flask backend is running.",
                "error"
            );

        } finally {

            if (loginButton) {
                loginButton.disabled = false;
            }

            if (loginButtonText) {
                loginButtonText.innerText =
                    "Login to NEXORA";
            }
        }

    });
}


/* =========================================================
   ENTER KEY SUPPORT
   ========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter" &&
            document.activeElement === passwordInput
        ) {

            if (loginForm) {
                loginForm.requestSubmit();
            }
        }

    }
);