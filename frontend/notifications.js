const API_URL = "http://127.0.0.1:5000";

let allNotifications = [];


/* =========================================================
   CHECK LOGIN
   ========================================================= */

function checkLogin() {
    const userData = localStorage.getItem("nexoraUser");

    if (!userData) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}


/* =========================================================
   LOAD NOTIFICATIONS
   ========================================================= */

async function loadNotifications() {

    if (!checkLogin()) {
        return;
    }

    const list = document.getElementById("notificationList");

    if (!list) {
        return;
    }

    list.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⏳</div>
            <h3>Loading notifications...</h3>
            <p>Please wait.</p>
        </div>
    `;

    try {

        const response = await fetch(`${API_URL}/api/notifications`);

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        console.log("Notifications Data:", data);

        if (Array.isArray(data)) {
            allNotifications = data;
        } else if (Array.isArray(data.notifications)) {
            allNotifications = data.notifications;
        } else if (data.success && Array.isArray(data.data)) {
            allNotifications = data.data;
        } else {
            allNotifications = [];
        }

        updateNotificationStats();
        renderNotifications();

    } catch (error) {

        console.error("Notification Error:", error);

        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h3>Unable to load notifications</h3>
                <p>Make sure the Flask backend is running.</p>
            </div>
        `;
    }
}


/* =========================================================
   UPDATE STATS
   ========================================================= */

function updateNotificationStats() {

    const total = allNotifications.length;

    const unread = allNotifications.filter(notification => {
        return Number(notification.is_read) === 0 ||
               notification.is_read === false ||
               notification.is_read === "0";
    }).length;

    const read = total - unread;

    const totalElement = document.getElementById("totalNotifications");
    const unreadElement = document.getElementById("unreadNotifications");
    const readElement = document.getElementById("readNotifications");

    if (totalElement) {
        totalElement.innerText = total;
    }

    if (unreadElement) {
        unreadElement.innerText = unread;
    }

    if (readElement) {
        readElement.innerText = read;
    }
}


/* =========================================================
   CHECK UNREAD
   ========================================================= */

function isUnread(notification) {

    return Number(notification.is_read) === 0 ||
           notification.is_read === false ||
           notification.is_read === "0";
}


/* =========================================================
   RENDER NOTIFICATIONS
   ========================================================= */

function renderNotifications() {

    const list = document.getElementById("notificationList");

    if (!list) {
        return;
    }

    const searchInput = document.getElementById("notificationSearch");
    const filterSelect = document.getElementById("notificationFilter");

    const searchText = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    const filter = filterSelect
        ? filterSelect.value
        : "all";


    let filteredNotifications = allNotifications.filter(notification => {

        const title = String(
            notification.title ||
            notification.notification_title ||
            ""
        ).toLowerCase();

        const message = String(
            notification.message ||
            notification.notification_message ||
            notification.content ||
            ""
        ).toLowerCase();

        const matchesSearch =
            title.includes(searchText) ||
            message.includes(searchText);

        let matchesFilter = true;

        if (filter === "unread") {
            matchesFilter = isUnread(notification);
        }

        if (filter === "read") {
            matchesFilter = !isUnread(notification);
        }

        return matchesSearch && matchesFilter;
    });


    if (filteredNotifications.length === 0) {

        list.innerHTML = `
            <div class="empty-state no-notifications">
                <div class="empty-state-icon">🔔</div>
                <h3>No notifications found</h3>
                <p>There are no notifications matching your search.</p>
            </div>
        `;

        return;
    }


    list.innerHTML = filteredNotifications.map(notification => {

        const unread = isUnread(notification);

        const notificationId =
            notification.id ||
            notification.notification_id;

        const title =
            notification.title ||
            notification.notification_title ||
            "Notification";

        const message =
            notification.message ||
            notification.notification_message ||
            notification.content ||
            "";

        const time =
            notification.created_at ||
            notification.createdAt ||
            notification.time ||
            "Recently";


        return `
            <div class="notification-item ${unread ? "unread" : "read"}"
                 data-id="${notificationId}">

                <div class="notification-icon">
                    ${unread ? "🔔" : "✓"}
                </div>

                <div class="notification-content">

                    <div class="notification-title">
                        ${escapeHTML(title)}
                    </div>

                    <div class="notification-message">
                        ${escapeHTML(message)}
                    </div>

                    <div class="notification-time">
                        ${escapeHTML(formatDate(time))}
                    </div>

                </div>

                ${
                    unread
                    ? `
                        <button
                            class="notification-read"
                            onclick="markAsRead(${notificationId})">
                            Mark read
                        </button>
                    `
                    : `
                        <span class="notification-status">
                            Read
                        </span>
                    `
                }

                <button
                    class="notification-delete"
                    onclick="deleteNotification(${notificationId})"
                    title="Delete notification">
                    🗑️
                </button>

            </div>
        `;

    }).join("");
}


/* =========================================================
   MARK AS READ
   ========================================================= */

async function markAsRead(notificationId) {

    try {

        const response = await fetch(
            `${API_URL}/api/notifications/${notificationId}/read`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        console.log("Mark Read:", data);

        const notification = allNotifications.find(
            item =>
                Number(item.id || item.notification_id) ===
                Number(notificationId)
        );

        if (notification) {
            notification.is_read = 1;
        }

        updateNotificationStats();
        renderNotifications();

    } catch (error) {

        console.error("Mark Read Error:", error);

        alert("Unable to mark notification as read.");
    }
}


/* =========================================================
   MARK ALL AS READ
   ========================================================= */

async function markAllAsRead() {

    const unreadNotifications = allNotifications.filter(
        notification => isUnread(notification)
    );

    if (unreadNotifications.length === 0) {
        alert("All notifications are already read.");
        return;
    }

    for (const notification of unreadNotifications) {

        const notificationId =
            notification.id ||
            notification.notification_id;

        try {

            await fetch(
                `${API_URL}/api/notifications/${notificationId}/read`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            notification.is_read = 1;

        } catch (error) {

            console.error(
                `Failed to mark ${notificationId} as read`,
                error
            );
        }
    }

    updateNotificationStats();
    renderNotifications();
}


/* =========================================================
   DELETE NOTIFICATION
   ========================================================= */

async function deleteNotification(notificationId) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this notification?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/notifications/${notificationId}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        console.log("Delete Notification:", data);

        allNotifications = allNotifications.filter(
            notification =>
                Number(notification.id || notification.notification_id) !==
                Number(notificationId)
        );

        updateNotificationStats();
        renderNotifications();

    } catch (error) {

        console.error("Delete Notification Error:", error);

        alert("Unable to delete notification.");
    }
}


/* =========================================================
   SEARCH
   ========================================================= */

const searchInput = document.getElementById("notificationSearch");

if (searchInput) {

    searchInput.addEventListener("input", function () {
        renderNotifications();
    });
}


/* =========================================================
   FILTER
   ========================================================= */

const filterSelect = document.getElementById("notificationFilter");

if (filterSelect) {

    filterSelect.addEventListener("change", function () {
        renderNotifications();
    });
}


/* =========================================================
   REFRESH
   ========================================================= */

const refreshButton = document.getElementById("refreshBtn");

if (refreshButton) {

    refreshButton.addEventListener("click", function () {
        loadNotifications();
    });
}


/* =========================================================
   MARK ALL READ BUTTON
   ========================================================= */

const markAllReadButton = document.getElementById("markAllReadBtn");

if (markAllReadButton) {

    markAllReadButton.addEventListener(
        "click",
        function () {
            markAllAsRead();
        }
    );
}


/* =========================================================
   LOGOUT
   ========================================================= */

const logoutButton = document.getElementById("logoutBtn");

if (logoutButton) {

    logoutButton.addEventListener("click", function () {

        localStorage.removeItem("nexoraUser");

        window.location.href = "login.html";
    });
}


/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const menuButton = document.getElementById("mobileMenuBtn");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const closeButton = document.getElementById("sidebarClose");


    function openSidebar() {

        if (sidebar) {
            sidebar.classList.add("mobile-open");
        }

        if (overlay) {
            overlay.classList.add("show");
        }
    }


    function closeSidebar() {

        if (sidebar) {
            sidebar.classList.remove("mobile-open");
        }

        if (overlay) {
            overlay.classList.remove("show");
        }
    }


    if (menuButton) {
        menuButton.addEventListener(
            "click",
            openSidebar
        );
    }


    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closeSidebar
        );
    }


    if (overlay) {
        overlay.addEventListener(
            "click",
            closeSidebar
        );
    }


    loadNotifications();
});


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(value) {

    if (!value) {
        return "Recently";
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}