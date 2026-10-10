const API_URL = "http://127.0.0.1:5000";


// ==============================
// LOAD ANALYTICS
// ==============================

async function loadAnalytics() {

    const userData = localStorage.getItem("nexoraUser");

    if (!userData) {
        window.location.href = "login.html";
        return;
    }

    const statusElement = document.getElementById("analyticsStatus");

    statusElement.innerText = "Loading analytics...";

    try {

        const response = await fetch(`${API_URL}/api/analytics`);

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        console.log("Analytics Data:", data);

        if (!data.success) {
            throw new Error(data.message || "Analytics API error");
        }


        // ==============================
        // STAT CARDS
        // ==============================

        document.getElementById("totalProjects").innerText =
            data.total_projects ?? 0;

        document.getElementById("totalTasks").innerText =
            data.total_tasks ?? 0;

        document.getElementById("completedTasks").innerText =
            data.completed_tasks ?? 0;

        document.getElementById("teamMembers").innerText =
            data.team_members ?? 0;


        // ==============================
        // TASK PERFORMANCE
        // ==============================

        const completedPercent =
            Number(data.completed_percent ?? 0);

        const pendingPercent =
            Number(data.pending_percent ?? 0);


        document.getElementById("completedPercent").innerText =
            `${completedPercent}%`;

        document.getElementById("pendingPercent").innerText =
            `${pendingPercent}%`;


        document.getElementById("completedProgress").style.width =
            `${completedPercent}%`;

        document.getElementById("pendingProgress").style.width =
            `${pendingPercent}%`;


        // ==============================
        // PROJECT OVERVIEW
        // ==============================

        document.getElementById("activeProjects").innerText =
            data.active_projects ?? 0;

        document.getElementById("completedProjects").innerText =
            data.completed_projects ?? 0;


        // ==============================
        // SUCCESS STATUS
        // ==============================

        statusElement.innerText =
            "✓ Analytics data loaded successfully.";

    }

    catch (error) {

        console.error("Analytics Error:", error);

        statusElement.innerText =
            "⚠️ Unable to load analytics data. Make sure the Flask backend is running.";

    }
}



// ==============================
// REFRESH BUTTON
// ==============================

const refreshButton = document.getElementById("refreshBtn");

if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        function () {

            loadAnalytics();

        }
    );

}



// ==============================
// LOGOUT
// ==============================

const logoutButton = document.getElementById("logoutBtn");

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function () {

            localStorage.removeItem("nexoraUser");

            window.location.href = "login.html";

        }
    );

}



// ==============================
// PAGE LOAD
// ==============================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadAnalytics();

    }
);