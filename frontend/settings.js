const API_URL = "http://127.0.0.1:5000";


// ==============================
// LOGIN CHECK
// ==============================

const userData = localStorage.getItem("nexoraUser");

if (!userData) {
    window.location.href = "login.html";
}


// ==============================
// LOAD USER DATA
// ==============================

let user = {};

try {

    user = JSON.parse(userData);

} catch (error) {

    console.error("User data error:", error);

    localStorage.removeItem("nexoraUser");

    window.location.href = "login.html";

}


// ==============================
// PROFILE ELEMENTS
// ==============================

const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const emailDisplay = document.getElementById("emailDisplay");
const userRole = document.getElementById("userRole");

const profileAvatar =
    document.getElementById("profileAvatar");

const profileNameInput =
    document.getElementById("profileNameInput");

const profileEmailInput =
    document.getElementById("profileEmailInput");

const profileRoleInput =
    document.getElementById("profileRoleInput");

const cancelProfileBtn =
    document.getElementById("cancelProfileBtn");

const saveProfileBtn =
    document.getElementById("saveProfileBtn");

const profileMessage =
    document.getElementById("profileMessage");


// ==============================
// FIND USER ID
// ==============================

async function findUserId() {

    // ID already available
    if (user.id) {
        return true;
    }

    try {

        const response =
            await fetch(`${API_URL}/api/users`);

        if (!response.ok) {
            throw new Error("Unable to load users");
        }

        const data =
            await response.json();

        console.log(
            "Users API Response:",
            data
        );


        let users = [];

        if (Array.isArray(data)) {

            users = data;

        } else if (Array.isArray(data.users)) {

            users = data.users;

        } else if (Array.isArray(data.data)) {

            users = data.data;

        }


        const foundUser =
            users.find(function (item) {

                return (
                    item.email &&
                    user.email &&
                    item.email.toLowerCase() ===
                    user.email.toLowerCase()
                );

            });


        if (foundUser) {

            user.id = foundUser.id;

            // Also update missing data
            user.name =
                foundUser.name || user.name;

            user.email =
                foundUser.email || user.email;

            user.role =
                foundUser.role || user.role;


            localStorage.setItem(
                "nexoraUser",
                JSON.stringify(user)
            );


            console.log(
                "User ID found:",
                user.id
            );

            return true;

        }


        console.error(
            "User not found using email:",
            user.email
        );

        return false;

    } catch (error) {

        console.error(
            "Find User Error:",
            error
        );

        return false;

    }

}


// ==============================
// PROFILE DISPLAY
// ==============================

function updateProfileDisplay() {

    const name =
        user.name || "NEXORA Admin";

    const email =
        user.email || "admin@nexora.com";

    const role =
        user.role || "Member";


    if (userName) {
        userName.innerText = name;
    }

    if (userEmail) {
        userEmail.innerText = email;
    }

    if (emailDisplay) {
        emailDisplay.innerText = email;
    }

    if (userRole) {
        userRole.innerText = role;
    }


    // Edit fields

    if (profileNameInput) {
        profileNameInput.value = name;
    }

    if (profileEmailInput) {
        profileEmailInput.value = email;
    }

    if (profileRoleInput) {
        profileRoleInput.value = role;
    }


    // Avatar initials

    if (profileAvatar) {

        const words =
            name
                .trim()
                .split(/\s+/)
                .filter(Boolean);


        let initials = "";


        if (words.length >= 2) {

            initials =
                words[0].charAt(0) +
                words[words.length - 1].charAt(0);

        } else if (words.length === 1) {

            initials =
                words[0].substring(0, 2);

        } else {

            initials = "NU";

        }


        profileAvatar.innerText =
            initials.toUpperCase();

    }

}


// ==============================
// PROFILE MESSAGE
// ==============================

function showProfileMessage(
    message,
    type
) {

    if (!profileMessage) {
        return;
    }


    profileMessage.innerText =
        message;


    if (type === "success") {

        profileMessage.style.color =
            "#059669";

    } else if (type === "error") {

        profileMessage.style.color =
            "#dc2626";

    } else {

        profileMessage.style.color =
            "#6b7280";

    }

}


// ==============================
// CANCEL PROFILE
// ==============================

if (cancelProfileBtn) {

    cancelProfileBtn.addEventListener(
        "click",
        function () {

            updateProfileDisplay();

            showProfileMessage(
                "Changes cancelled.",
                "normal"
            );

        }
    );

}


// ==============================
// SAVE PROFILE
// ==============================

if (saveProfileBtn) {

    saveProfileBtn.addEventListener(
        "click",
        async function () {

            const name =
                profileNameInput
                    ? profileNameInput.value.trim()
                    : "";

            const email =
                profileEmailInput
                    ? profileEmailInput.value.trim()
                    : "";


            // Validation

            if (!name || !email) {

                showProfileMessage(
                    "Please enter your name and email.",
                    "error"
                );

                return;

            }


            if (!email.includes("@")) {

                showProfileMessage(
                    "Please enter a valid email address.",
                    "error"
                );

                return;

            }


            // Button loading

            saveProfileBtn.disabled = true;

            saveProfileBtn.innerText =
                "Saving...";


            showProfileMessage(
                "Finding your account...",
                "normal"
            );


            try {

                // Find ID if missing

                const userFound =
                    await findUserId();


                if (!userFound || !user.id) {

                    showProfileMessage(
                        "User account could not be found. Please login again.",
                        "error"
                    );

                    return;

                }


                showProfileMessage(
                    "Updating your profile...",
                    "normal"
                );


                // UPDATE API

                const response =
                    await fetch(
                        `${API_URL}/api/users/${user.id}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                name: name,
                                email: email
                            })
                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "Profile Update Response:",
                    data
                );


                if (
                    response.ok &&
                    data.success === true
                ) {

                    // Save updated user

                    user =
                        data.user || {
                            ...user,
                            name: name,
                            email: email
                        };


                    localStorage.setItem(
                        "nexoraUser",
                        JSON.stringify(user)
                    );


                    // Update page

                    updateProfileDisplay();


                    showProfileMessage(
                        "✓ Profile updated successfully!",
                        "success"
                    );

                } else {

                    showProfileMessage(
                        data.message ||
                        "Unable to update profile.",
                        "error"
                    );

                }

            } catch (error) {

                console.error(
                    "Profile Update Error:",
                    error
                );


                showProfileMessage(
                    "Unable to connect to server. Make sure Flask backend is running.",
                    "error"
                );

            } finally {

                saveProfileBtn.disabled =
                    false;

                saveProfileBtn.innerText =
                    "💾 Save Profile";

            }

        }
    );

}


// ==============================
// LOGOUT
// ==============================

function logout() {

    localStorage.removeItem(
        "nexoraUser"
    );

    window.location.href =
        "login.html";

}


const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        logout
    );

}


const logoutSettingsBtn =
    document.getElementById(
        "logoutSettingsBtn"
    );


if (logoutSettingsBtn) {

    logoutSettingsBtn.addEventListener(
        "click",
        logout
    );

}


// ==============================
// CHANGE PASSWORD
// ==============================

const changePasswordBtn =
    document.getElementById(
        "changePasswordBtn"
    );


if (changePasswordBtn) {

    changePasswordBtn.addEventListener(
        "click",
        function () {

            const currentPassword =
                prompt(
                    "Enter your current password:"
                );


            if (currentPassword === null) {
                return;
            }


            if (currentPassword.trim() === "") {

                alert(
                    "Please enter your current password."
                );

                return;

            }


            const newPassword =
                prompt(
                    "Enter your new password:"
                );


            if (newPassword === null) {
                return;
            }


            if (newPassword.length < 6) {

                alert(
                    "New password must be at least 6 characters."
                );

                return;

            }


            const confirmPassword =
                prompt(
                    "Confirm your new password:"
                );


            if (confirmPassword === null) {
                return;
            }


            if (newPassword !== confirmPassword) {

                alert(
                    "New passwords do not match."
                );

                return;

            }


            alert(
                "Password validation completed. Backend password update can be connected next."
            );

        }
    );

}


// ==============================
// PROJECT NOTIFICATIONS
// ==============================

const projectNotifications =
    document.getElementById(
        "projectNotifications"
    );


if (projectNotifications) {

    projectNotifications.addEventListener(
        "change",
        function () {

            localStorage.setItem(
                "projectNotifications",
                this.checked
            );

        }
    );

}


// ==============================
// TASK NOTIFICATIONS
// ==============================

const taskNotifications =
    document.getElementById(
        "taskNotifications"
    );


if (taskNotifications) {

    taskNotifications.addEventListener(
        "change",
        function () {

            localStorage.setItem(
                "taskNotifications",
                this.checked
            );

        }
    );

}


// ==============================
// LOAD NOTIFICATION SETTINGS
// ==============================

const savedProjectNotifications =
    localStorage.getItem(
        "projectNotifications"
    );


const savedTaskNotifications =
    localStorage.getItem(
        "taskNotifications"
    );


if (
    savedProjectNotifications !== null &&
    projectNotifications
) {

    projectNotifications.checked =
        savedProjectNotifications === "true";

}


if (
    savedTaskNotifications !== null &&
    taskNotifications
) {

    taskNotifications.checked =
        savedTaskNotifications === "true";

}


// ==============================
// THEME
// ==============================

const themeSelect =
    document.getElementById(
        "themeSelect"
    );


function applyTheme(theme) {

    if (theme === "light") {

        document.body.classList.add(
            "light-theme"
        );

    } else {

        document.body.classList.remove(
            "light-theme"
        );

    }

}


if (themeSelect) {

    themeSelect.addEventListener(
        "change",
        function () {

            const selectedTheme =
                this.value;


            localStorage.setItem(
                "nexoraTheme",
                selectedTheme
            );


            applyTheme(
                selectedTheme
            );

        }
    );

}


// ==============================
// LOAD SAVED THEME
// ==============================

const savedTheme =
    localStorage.getItem(
        "nexoraTheme"
    ) || "dark";


if (themeSelect) {

    themeSelect.value =
        savedTheme;

}


applyTheme(savedTheme);


// ==============================
// INITIAL LOAD
// ==============================

updateProfileDisplay();


console.log(
    "NEXORA Settings loaded successfully."
);