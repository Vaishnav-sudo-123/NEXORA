
document.addEventListener("DOMContentLoaded", () => {

    const startButtons = document.querySelectorAll(
        ".start-btn, .primary-btn"
    );

    startButtons.forEach(button => {

        button.addEventListener("click", () => {

            alert(
                "Welcome to NEXORA! 🚀\n\n" +
                "Workspace creation will be available soon."
            );

        });

    });


    const exploreButton = document.querySelector(".secondary-btn");

    exploreButton.addEventListener("click", () => {

        document
            .querySelector("#features")
            .scrollIntoView({
                behavior: "smooth"
            });

    });

});

