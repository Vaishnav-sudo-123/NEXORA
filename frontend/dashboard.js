const API_URL = "http://127.0.0.1:5000";


// =========================================================
// LOAD DASHBOARD
// =========================================================

async function loadDashboard() {

    const userData = localStorage.getItem("nexoraUser");

    if (!userData) {
        window.location.href = "login.html";
        return;
    }

    let user;

    try {

        user = JSON.parse(userData);

    } catch (error) {

        console.error("User data error:", error);

        localStorage.removeItem("nexoraUser");

        window.location.href = "login.html";

        return;
    }


    // =====================================================
    // USER DATA
    // =====================================================

    const userNameValue =
        user.name || "NEXORA User";

    const userEmailValue =
        user.email || "No email available";

    const userRoleValue =
        user.role || "Workspace Member";


    // =====================================================
    // WELCOME USER NAME
    // =====================================================

    setText(
        "userName",
        userNameValue
    );


    // =====================================================
    // PROFILE NAME
    // =====================================================

    setText(
        "profileName",
        userNameValue
    );


    // =====================================================
    // PROFILE ROLE
    // =====================================================

    setText(
        "profileRole",
        userRoleValue
    );


    // =====================================================
    // DROPDOWN PROFILE NAME
    // =====================================================

    setText(
        "dropdownProfileName",
        userNameValue
    );


    // =====================================================
    // DROPDOWN PROFILE ROLE
    // =====================================================

    setText(
        "dropdownProfileRole",
        userRoleValue
    );


    // =====================================================
    // DROPDOWN PROFILE EMAIL
    // =====================================================

    setText(
        "dropdownProfileEmail",
        userEmailValue
    );


    // =====================================================
    // PROFILE DETAIL NAME
    // =====================================================

    setText(
        "profileDetailName",
        userNameValue
    );


    // =====================================================
    // PROFILE DETAIL EMAIL
    // =====================================================

    setText(
        "profileDetailEmail",
        userEmailValue
    );


    // =====================================================
    // PROFILE DETAIL ROLE
    // =====================================================

    setText(
        "profileDetailRole",
        userRoleValue
    );


    // =====================================================
    // DASHBOARD API
    // =====================================================

    try {

        const response =
            await fetch(
                `${API_URL}/api/dashboard`
            );


        if (!response.ok) {

            throw new Error(
                `Dashboard API error: ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "Dashboard Data:",
            data
        );


        if (!data.success) {

            throw new Error(
                data.message ||
                "Dashboard API error"
            );

        }


        // =================================================
        // STAT CARDS
        // =================================================

        setText(
            "totalProjects",
            data.projects ?? 0
        );


        setText(
            "totalTasks",
            data.tasks ?? 0
        );


        setText(
            "completedTasks",
            data.completed ?? 0
        );


        setText(
            "teamMembers",
            data.team_members ?? 0
        );


        // =================================================
        // OVERVIEW
        // =================================================

        setText(
            "overviewProjects",
            data.projects ?? 0
        );


        setText(
            "overviewCompletedTasks",
            data.completed ?? 0
        );


        // =================================================
        // RECENT DATA
        // =================================================

        await loadRecentData();


    } catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

    }

}


/* =========================================
   UPCOMING DEADLINES
========================================= */

async function loadUpcomingDeadlines() {
    const countElement = document.getElementById(
        "upcomingDeadlinesCount"
    );

    if (!countElement) return;

    try {
        const [projectsResponse, tasksResponse] =
            await Promise.all([
                fetch(`${API_URL}/api/projects`),
                fetch(`${API_URL}/api/tasks`)
            ]);

        if (!projectsResponse.ok || !tasksResponse.ok) {
            throw new Error("Unable to fetch deadlines");
        }

        const projectsData = await projectsResponse.json();
        const tasksData = await tasksResponse.json();

        const projects = Array.isArray(projectsData)
            ? projectsData
            : projectsData.projects || projectsData.data || [];

        const tasks = Array.isArray(tasksData)
            ? tasksData
            : tasksData.tasks || tasksData.data || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        function parseDeadline(value) {
            if (!value) return null;

            const match = String(value).match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );

            if (match) {
                return new Date(
                    Number(match[1]),
                    Number(match[2]) - 1,
                    Number(match[3])
                );
            }

            const date = new Date(value);

            if (Number.isNaN(date.getTime())) return null;

            date.setHours(0, 0, 0, 0);
            return date;
        }

        const upcomingProjectCount = projects.filter(project => {
            const deadline = parseDeadline(
                project.deadline ||
                project.due_date ||
                project.end_date
            );

            return deadline &&
                deadline >= today &&
                deadline <= nextWeek;
        }).length;

        const upcomingTaskCount = tasks.filter(task => {
            const status = String(task.status || "").toLowerCase();

            if (status === "completed") return false;

            const deadline = parseDeadline(
                task.due_date ||
                task.deadline ||
                task.end_date
            );

            return deadline &&
                deadline >= today &&
                deadline <= nextWeek;
        }).length;

        countElement.textContent =
            upcomingProjectCount + upcomingTaskCount;

    } catch (error) {
        console.error("Upcoming deadlines error:", error);
        countElement.textContent = "—";
    }
}

// =========================================================
// LOAD RECENT DATA
// =========================================================

async function loadRecentData() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/dashboard/recent`
            );


        if (!response.ok) {

            throw new Error(
                `Recent API error: ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "Recent Data:",
            data
        );


        if (!data.success) {

            throw new Error(
                data.message ||
                "Recent API error"
            );

        }
        


        // =================================================
        // PROJECTS
        // =================================================

        displayRecentProjects(
            data.projects || []
        );


        // =================================================
        // TASKS
        // =================================================

        displayRecentTasks(
            data.tasks || []
        );


        // =================================================
        // ACTIVE PROJECTS
        // =================================================

        const activeProjects =
            (data.projects || []).filter(
                project =>
                    String(project.status)
                        .toLowerCase() === "active"
            ).length;


        setText(
            "overviewActiveProjects",
            activeProjects
        );


    } catch (error) {

        console.error(
            "Recent Data Error:",
            error
        );


        const recentProjects =
            document.getElementById(
                "recentProjects"
            );


        const recentTasks =
            document.getElementById(
                "recentTasks"
            );


        if (recentProjects) {

            recentProjects.innerHTML = `
                <div class="empty">
                    ⚠️ Unable to load projects.
                </div>
            `;

        }


        if (recentTasks) {

            recentTasks.innerHTML = `
                <div class="empty">
                    ⚠️ Unable to load tasks.
                </div>
            `;

        }

    }

}



// =========================================================
// DISPLAY RECENT PROJECTS
// =========================================================

function displayRecentProjects(projects) {

    const container =
        document.getElementById(
            "recentProjects"
        );


    if (!container) return;


    if (!projects || projects.length === 0) {

        container.innerHTML = `
            <div class="empty">
                📁 No projects yet.
            </div>
        `;

        return;
    }


    container.innerHTML = "";


    projects.forEach(
        project => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "recent-item";


            const name =
                escapeHTML(
                    project.name ||
                    "Untitled Project"
                );


            const status =
                escapeHTML(
                    project.status ||
                    "Unknown"
                );


            let progress =
                Number(
                    project.progress
                );


            if (
                Number.isNaN(progress) ||
                progress < 0
            ) {

                progress = 0;

            }


            if (progress > 100) {

                progress = 100;

            }


            item.innerHTML = `

                <div class="recent-info">

                    <span class="recent-title">
                        ${name}
                    </span>


                    <span class="recent-meta">
                        ${status}
                    </span>

                </div>


                <div class="recent-project-progress">

                    <div class="progress-label">

                        <span>
                            Progress
                        </span>


                        <span>
                            ${progress}%
                        </span>

                    </div>


                    <div class="progress-bar">

                        <div
                            class="progress-fill"
                            style="width: ${progress}%"
                        ></div>

                    </div>

                </div>

            `;


            container.appendChild(
                item
            );

        }
    );

}



// =========================================================
// DISPLAY RECENT TASKS
// =========================================================

function displayRecentTasks(tasks) {

    const container =
        document.getElementById(
            "recentTasks"
        );


    if (!container) return;


    if (!tasks || tasks.length === 0) {

        container.innerHTML = `
            <div class="empty">
                ✅ No tasks yet.
            </div>
        `;

        return;
    }


    container.innerHTML = "";


    tasks.forEach(
        task => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "recent-item";


            const title =
                escapeHTML(
                    task.title ||
                    "Untitled Task"
                );


            const projectName =
                escapeHTML(
                    task.project_name ||
                    "No project"
                );


            const assignedUser =
                escapeHTML(
                    task.assigned_user ||
                    "Unassigned"
                );


            const status =
                escapeHTML(
                    task.status ||
                    "To Do"
                );


            item.innerHTML = `

                <div class="recent-info">

                    <span class="recent-title">
                        ${title}
                    </span>


                    <span class="recent-meta">

                        ${projectName}

                        •

                        ${assignedUser}

                    </span>

                </div>


                <span class="status-badge">

                    ${status}

                </span>

            `;


            container.appendChild(
                item
            );

        }
    );

}



// =========================================================
// NOTIFICATION COUNT
// =========================================================

async function loadNotificationCount() {

    const userData =
        localStorage.getItem(
            "nexoraUser"
        );


    if (!userData) return;


    let user;


    try {

        user =
            JSON.parse(
                userData
            );

    } catch (error) {

        console.error(
            "Notification user data error:",
            error
        );

        return;
    }


    if (!user.id) return;


    try {

        const response =
            await fetch(
                `${API_URL}/api/notifications/${user.id}`
            );


        if (!response.ok) {

            throw new Error(
                "Notification API failed"
            );

        }


        const data =
            await response.json();


        if (!data.success) return;


        const notifications =
            data.notifications || [];


        const unreadCount =
            notifications.filter(
                notification =>
                    !notification.is_read
            ).length;


        const notificationBtn =
            document.querySelector(
                ".notification-btn"
            );


        if (!notificationBtn) return;


        let badge =
            document.getElementById(
                "notificationBadge"
            );


        if (!badge) {

            badge =
                document.createElement(
                    "span"
                );


            badge.id =
                "notificationBadge";


            notificationBtn.appendChild(
                badge
            );

        }


        badge.innerText =
            unreadCount;


        if (unreadCount === 0) {

            badge.style.display =
                "none";

        } else {

            badge.style.display =
                "flex";

        }


    } catch (error) {

        console.error(
            "Notification Count Error:",
            error
        );

    }

}



// =========================================================
// PROFILE DROPDOWN
// =========================================================

function setupProfileMenu() {

    const profileBtn =
        document.getElementById(
            "profileBtn"
        );


    const profileDropdown =
        document.getElementById(
            "profileDropdown"
        );


    const profileLogoutBtn =
        document.getElementById(
            "profileLogoutBtn"
        );


    if (
        !profileBtn ||
        !profileDropdown
    ) {

        return;

    }


    // =====================================================
    // OPEN / CLOSE DROPDOWN
    // =====================================================

    profileBtn.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();


            profileDropdown.classList.toggle(
                "show"
            );

        }
    );


    // =====================================================
    // CLOSE OUTSIDE CLICK
    // =====================================================

    document.addEventListener(
        "click",
        function (event) {

            if (
                !event.target.closest(
                    ".profile-menu"
                )
            ) {

                profileDropdown.classList.remove(
                    "show"
                );

            }

        }
    );


    // =====================================================
    // PROFILE LOGOUT
    // =====================================================

    if (profileLogoutBtn) {

        profileLogoutBtn.addEventListener(
            "click",
            function () {

                localStorage.removeItem(
                    "nexoraUser"
                );


                window.location.href =
                    "login.html";

            }
        );

    }

}



// =========================================================
// SETTINGS
// =========================================================

function openSettings() {

    window.location.href =
        "settings.html";

}



// =========================================================
// SIDEBAR LOGOUT
// =========================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "nexoraUser"
            );


            window.location.href =
                "login.html";

        }
    );

}



// =========================================================
// HELPER
// =========================================================

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.innerText =
            value;

    }

}



// =========================================================
// HTML SECURITY
// =========================================================

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}



// =========================================================
// PAGE LOAD
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadDashboard();

        loadNotificationCount();

        setupProfileMenu();

        loadUpcomingDeadlines();

    }
);

// =====================================
// AUTOMATIC DEADLINE REMINDERS
// =====================================

async function checkDeadlineReminders() {
    try {
        const response = await fetch(
            `${API_URL}/api/notifications/check-deadlines`,
            {
                method: "POST"
            }
        );

        const data = await response.json();

        if (data.success) {
            console.log(
                "Deadline reminders checked:",
                data.reminders_created
            );
        } else {
            console.error("Deadline reminder check failed:", data.message);
        }
    } catch (error) {
        console.error("Unable to check deadline reminders:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    checkDeadlineReminders();
});

