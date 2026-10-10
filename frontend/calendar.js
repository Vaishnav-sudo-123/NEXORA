
const API_URL = "http://127.0.0.1:5000";

let currentDate = new Date();
let selectedDate = new Date();
let calendarEvents = [];

const calendarGrid = document.getElementById("calendarGrid");
const monthTitle = document.getElementById("monthTitle");
const selectedDateTitle = document.getElementById("selectedDateTitle");
const selectedDateEvents = document.getElementById("selectedDateEvents");
const eventFilter = document.getElementById("eventFilter");
const calendarStatus = document.getElementById("calendarStatus");

function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function parseDate(value) {
    if (!value) return null;

    const text = String(value).slice(0, 10);
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (match) {
        const date = new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3])
        );

        if (
            date.getFullYear() === Number(match[1]) &&
            date.getMonth() === Number(match[2]) - 1 &&
            date.getDate() === Number(match[3])
        ) {
            return date;
        }

        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return null;

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getArray(response, key) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.[key])) return response[key];
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.items)) return response.items;

    return [];
}

function isCompleted(status) {
    return String(status || "").toLowerCase() === "completed";
}

function isDateToday(date) {
    return date && getLocalDateString(date) === getLocalDateString(new Date());
}

function createEventId(type, item, index) {
    return `${type}-${item.id ?? item.task_id ?? item.project_id ?? index}`;
}

function normalizeProject(project, index) {
    const date = parseDate(
        project.deadline ||
        project.due_date ||
        project.end_date ||
        project.dueDate
    );

    if (!date) return null;

    return {
        id: createEventId("project", project, index),
        type: "project",
        title: project.name || project.project_name || "Untitled Project",
        date,
        status: project.status || "",
        completed: false,
        details: project.description || "",
        projectName: project.name || project.project_name || ""
    };
}

function normalizeTask(task, index) {
    const date = parseDate(
        task.due_date ||
        task.deadline ||
        task.dueDate ||
        task.end_date
    );

    if (!date) return null;

    return {
        id: createEventId("task", task, index),
        type: "task",
        title: task.title || task.task_name || task.name || "Untitled Task",
        date,
        status: task.status || "To Do",
        completed: isCompleted(task.status),
        details: task.description || "",
        projectName: task.project_name || task.project || ""
    };
}

async function fetchList(endpoint, key) {
    const response = await fetch(`${API_URL}${endpoint}`);

    if (!response.ok) {
        throw new Error(`${endpoint} returned ${response.status}`);
    }

    const data = await response.json();

    if (data && data.success === false) {
        throw new Error(data.message || `Could not load ${key}`);
    }

    return getArray(data, key);
}

async function loadCalendarEvents() {
    calendarStatus.textContent = "Loading calendar events...";

    try {
        const [projects, tasks] = await Promise.all([
            fetchList("/api/projects", "projects"),
            fetchList("/api/tasks", "tasks")
        ]);

        const projectEvents = projects
            .map(normalizeProject)
            .filter(Boolean);

        const taskEvents = tasks
            .map(normalizeTask)
            .filter(Boolean);

        calendarEvents = [...projectEvents, ...taskEvents];

        renderCalendar();
        updateCalendarStats();
        renderSelectedDateEvents();

        calendarStatus.textContent = calendarEvents.length
            ? `Loaded ${calendarEvents.length} events from your projects and tasks.`
            : "No dated projects or tasks found. Add deadlines to see them here.";
    } catch (error) {
        console.error("Calendar loading error:", error);

        calendarStatus.textContent =
            "Could not load calendar data. Check that the NEXORA backend is running.";

        calendarGrid.innerHTML = `
            <div class="empty-day">
                Calendar data unavailable. Start the backend and refresh this page.
            </div>
        `;

        selectedDateEvents.innerHTML = `
            <p class="empty-day">Events could not be loaded.</p>
        `;
    }
}

function getFilteredEvents() {
    const filter = eventFilter.value;

    if (filter === "task") {
        return calendarEvents.filter(event => event.type === "task");
    }

    if (filter === "project") {
        return calendarEvents.filter(event => event.type === "project");
    }

    return calendarEvents;
}

function getEventsForDate(date) {
    const dateString = getLocalDateString(date);

    return getFilteredEvents().filter(event =>
        getLocalDateString(event.date) === dateString
    );
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthTitle.textContent = currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
    });

    calendarGrid.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement("div");
        empty.className = "calendar-day empty-day";
        empty.setAttribute("aria-hidden", "true");
        calendarGrid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = getLocalDateString(date);
        const events = getEventsForDate(date);

        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "calendar-day";

        if (isDateToday(date)) cell.classList.add("today");

        if (dateString === getLocalDateString(selectedDate)) {
            cell.classList.add("selected");
        }

        const visibleEvents = events.slice(0, 2);

        cell.innerHTML = `
            <span class="calendar-day-number">${day}</span>
            <div class="calendar-day-events">
                ${visibleEvents.map(event => `
                    <span class="calendar-event-chip ${
                        event.type === "task" ? "task-event" : "project-event"
                    } ${
                        !event.completed && event.type === "task" &&
                        event.date < new Date(
                            new Date().getFullYear(),
                            new Date().getMonth(),
                            new Date().getDate()
                        ) ? "overdue-event" : ""
                    }">
                        ${escapeHTML(event.title)}
                    </span>
                `).join("")}
                ${events.length > 2
                    ? `<span class="more-events">+${events.length - 2} more</span>`
                    : ""}
            </div>
        `;

        cell.setAttribute("aria-label", `${dateString}, ${events.length} events`);

        cell.addEventListener("click", () => {
            selectedDate = new Date(year, month, day);
            renderCalendar();
            renderSelectedDateEvents();
        });

        calendarGrid.appendChild(cell);
    }
}

function renderSelectedDateEvents() {
    selectedDateTitle.textContent = selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });

    const events = getEventsForDate(selectedDate);

    if (!events.length) {
        selectedDateEvents.innerHTML = `
            <div class="empty-day">
                <p>No events for this date.</p>
                <p>Project deadlines and task due dates will appear here.</p>
            </div>
        `;
        return;
    }

    selectedDateEvents.innerHTML = events.map(event => {
        const overdue = event.type === "task" &&
            !event.completed &&
            event.date < new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                new Date().getDate()
            );

        const icon = event.type === "task" ? "✓" : "▣";

        return `
            <article class="event-card">
                <div class="event-card-top">
                    <span class="event-type-icon">${icon}</span>
                    <span class="event-badge ${event.type}-badge">
                        ${event.type === "task" ? "Task" : "Project"}
                    </span>
                    ${overdue ? '<span class="event-badge overdue-badge">Overdue</span>' : ""}
                </div>

                <div class="event-card-info">
                    <h4>${escapeHTML(event.title)}</h4>
                    ${event.projectName
                        ? `<p>Project: ${escapeHTML(event.projectName)}</p>`
                        : ""}
                    ${event.status
                        ? `<p>Status: ${escapeHTML(event.status)}</p>`
                        : ""}
                    ${event.details
                        ? `<p>${escapeHTML(event.details)}</p>`
                        : ""}
                </div>
            </article>
        `;
    }).join("");
}

function updateCalendarStats() {
    const today = new Date();
    const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );

    const total = calendarEvents.length;

    const upcoming = calendarEvents.filter(event =>
        event.date >= todayStart &&
        !(event.type === "task" && event.completed)
    ).length;

    const overdue = calendarEvents.filter(event =>
        event.type === "task" &&
        !event.completed &&
        event.date < todayStart
    ).length;

    const dueToday = calendarEvents.filter(event =>
        event.type === "task" &&
        !event.completed &&
        isDateToday(event.date)
    ).length;

    document.getElementById("totalEvents").textContent = total;
    document.getElementById("upcomingEvents").textContent = upcoming;
    document.getElementById("overdueTasks").textContent = overdue;
    document.getElementById("dueToday").textContent = dueToday;
}

document.getElementById("prevMonth").addEventListener("click", () => {
    currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
    );
    renderCalendar();
});

document.getElementById("nextMonth").addEventListener("click", () => {
    currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
    );
    renderCalendar();
});

document.getElementById("todayBtn").addEventListener("click", () => {
    currentDate = new Date();
    selectedDate = new Date();
    renderCalendar();
    renderSelectedDateEvents();
});

eventFilter.addEventListener("change", () => {
    renderCalendar();
    renderSelectedDateEvents();
});

loadCalendarEvents();