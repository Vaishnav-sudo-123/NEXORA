const API_URL = "http://127.0.0.1:5000";


// ==============================
// GLOBAL TASK DATA
// ==============================

let allTasks = [];

let currentFilters = {
    search: "",
    status: "",
    priority: "",
    project: ""
};


// ==============================
// LOAD PROJECTS
// ==============================

async function loadProjectsForTask(
    selectedProjectId = ""
) {

    const projectSelect =
        document.getElementById("taskProject");

    if (!projectSelect) return;

    try {

        const response =
            await fetch(
                `${API_URL}/api/projects`
            );

        const data =
            await response.json();

        if (!data.success) {

            throw new Error(
                data.message ||
                "Failed to load projects"
            );
        }

        projectSelect.innerHTML = `
            <option value="">
                Select Project
            </option>
        `;

        data.projects.forEach(
            project => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    project.id;

                option.textContent =
                    project.name;

                if (
                    String(project.id) ===
                    String(selectedProjectId)
                ) {

                    option.selected =
                        true;

                }

                projectSelect.appendChild(
                    option
                );

            }
        );

    } catch (error) {

        console.error(
            "Project Load Error:",
            error
        );

        projectSelect.innerHTML = `
            <option value="">
                Unable to load projects
            </option>
        `;
    }
}


// ==============================
// LOAD USERS
// ==============================

async function loadUsersForTask(
    selectedUserId = ""
) {

    const assigneeSelect =
        document.getElementById(
            "taskAssignee"
        );

    if (!assigneeSelect) return;

    try {

        const response =
            await fetch(
                `${API_URL}/api/users`
            );

        const data =
            await response.json();

        if (!data.success) {

            throw new Error(
                data.message ||
                "Failed to load users"
            );
        }

        assigneeSelect.innerHTML = `
            <option value="">
                Unassigned
            </option>
        `;

        data.users.forEach(
            user => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    user.id;

                option.textContent =
                    `${user.name} (${user.role})`;

                if (
                    String(user.id) ===
                    String(selectedUserId)
                ) {

                    option.selected =
                        true;

                }

                assigneeSelect.appendChild(
                    option
                );

            }
        );

    } catch (error) {

        console.error(
            "User Load Error:",
            error
        );

        assigneeSelect.innerHTML = `
            <option value="">
                Unable to load users
            </option>
        `;
    }
}


// ==============================
// LOAD TASKS
// ==============================

async function loadTasks() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/tasks`
            );

        if (!response.ok) {

            throw new Error(
                `Server error: ${response.status}`
            );

        }

        const data =
            await response.json();

        if (!data.success) {

            throw new Error(
                data.message ||
                "Failed to load tasks"
            );

        }

        allTasks =
            data.tasks || [];


        populateProjectFilter(
            allTasks
        );


        applyTaskFilters();


    } catch (error) {

        console.error(
            "Task Load Error:",
            error
        );

        const todo =
            document.getElementById(
                "todo-container"
            );

        const progress =
            document.getElementById(
                "progress-container"
            );

        const completed =
            document.getElementById(
                "completed-container"
            );


        if (todo) {

            todo.innerHTML = `
                <div class="empty-task">
                    Unable to load tasks.
                </div>
            `;

        }

        if (progress) {

            progress.innerHTML = "";

        }

        if (completed) {

            completed.innerHTML = "";

        }

    }
}


// ==============================
// ESCAPE HTML
// ==============================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

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


// ==============================
// POPULATE PROJECT FILTER
// ==============================

function populateProjectFilter(
    tasks
) {

    const projectFilter =
        document.getElementById(
            "projectFilter"
        );

    if (!projectFilter) return;


    const projects =
        new Map();


    tasks.forEach(
        task => {

            if (
                task.project_id &&
                task.project_name
            ) {

                projects.set(
                    String(
                        task.project_id
                    ),
                    task.project_name
                );

            }

        }
    );


    projectFilter.innerHTML = `
        <option value="">
            All Projects
        </option>
    `;


    projects.forEach(
        (
            projectName,
            projectId
        ) => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                projectId;

            option.textContent =
                projectName;

            projectFilter.appendChild(
                option
            );

        }
    );


    projectFilter.value =
        currentFilters.project || "";

}


// ==============================
// APPLY FILTERS
// ==============================

function applyTaskFilters() {

    const search =
        currentFilters.search
            .toLowerCase()
            .trim();


    const status =
        currentFilters.status;


    const priority =
        currentFilters.priority;


    const project =
        currentFilters.project;


    const filteredTasks =
        allTasks.filter(
            task => {

                const title =
                    String(
                        task.title || ""
                    ).toLowerCase();


                const description =
                    String(
                        task.description || ""
                    ).toLowerCase();


                const assignee =
                    String(
                        task.assigned_user || ""
                    ).toLowerCase();


                const projectName =
                    String(
                        task.project_name || ""
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    title.includes(
                        search
                    ) ||
                    description.includes(
                        search
                    ) ||
                    assignee.includes(
                        search
                    ) ||
                    projectName.includes(
                        search
                    );


                const matchesStatus =
                    !status ||
                    task.status === status;


                const matchesPriority =
                    !priority ||
                    task.priority === priority;


                const matchesProject =
                    !project ||
                    String(
                        task.project_id
                    ) === String(
                        project
                    );


                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesPriority &&
                    matchesProject
                );

            }
        );


    displayTasks(
        filteredTasks
    );


    updateFilteredStats(
        filteredTasks
    );
}


// ==============================
// DISPLAY TASKS
// ==============================

function displayTasks(tasks) {

    const todoContainer =
        document.getElementById(
            "todo-container"
        );

    const progressContainer =
        document.getElementById(
            "progress-container"
        );

    const completedContainer =
        document.getElementById(
            "completed-container"
        );


    if (
        !todoContainer ||
        !progressContainer ||
        !completedContainer
    ) {

        console.error(
            "Task containers not found."
        );

        return;
    }


    todoContainer.innerHTML = "";

    progressContainer.innerHTML = "";

    completedContainer.innerHTML = "";


    let todoCount = 0;

    let progressCount = 0;

    let completedCount = 0;


    tasks.forEach(
        task => {

            const card =
                createTaskCard(
                    task
                );


            if (
                task.status === "To Do"
            ) {

                todoContainer.innerHTML +=
                    card;

                todoCount++;

            } else if (
                task.status ===
                "In Progress"
            ) {

                progressContainer.innerHTML +=
                    card;

                progressCount++;

            } else if (
                task.status ===
                "Completed"
            ) {

                completedContainer.innerHTML +=
                    card;

                completedCount++;

            }

        }
    );


    if (todoCount === 0) {

        todoContainer.innerHTML = `
            <div class="empty-task">
                No tasks
            </div>
        `;

    }


    if (progressCount === 0) {

        progressContainer.innerHTML = `
            <div class="empty-task">
                No tasks
            </div>
        `;

    }


    if (completedCount === 0) {

        completedContainer.innerHTML = `
            <div class="empty-task">
                No tasks
            </div>
        `;

    }


    const todoCountElement =
        document.getElementById(
            "todo-count"
        );

    const progressCountElement =
        document.getElementById(
            "progress-count"
        );

    const completedCountElement =
        document.getElementById(
            "completed-count"
        );


    if (todoCountElement) {

        todoCountElement.innerText =
            todoCount;

    }


    if (progressCountElement) {

        progressCountElement.innerText =
            progressCount;

    }


    if (completedCountElement) {

        completedCountElement.innerText =
            completedCount;

    }

}


// ==============================
// CREATE TASK CARD
// ==============================

function createTaskCard(task) {

    const priorityClass =
        task.priority
            ? task.priority.toLowerCase()
            : "medium";


    return `
        <div class="task-card">

            <h4>
                ${escapeHTML(
                    task.title ||
                    "Untitled Task"
                )}
            </h4>


            <p class="task-description">
                ${escapeHTML(
                    task.description ||
                    "No description provided."
                )}
            </p>


            <div class="task-meta">

                <span class="priority ${priorityClass}">
                    ${escapeHTML(
                        task.priority ||
                        "Medium"
                    )}
                </span>


                <span class="project-name">
                    ${escapeHTML(
                        task.project_name ||
                        "No project"
                    )}
                </span>

            </div>


            <div class="task-footer">

                <span>
                    👤 ${escapeHTML(
                        task.assigned_user ||
                        "Unassigned"
                    )}
                </span>


                <span>
                    📅 ${escapeHTML(
                        task.due_date ||
                        "No date"
                    )}
                </span>

            </div>


            <div class="task-actions">

                <button
                    type="button"
                    class="edit-task-btn"
                    onclick="editTask(${Number(task.id)})"
                >
                    ✏️ Edit
                </button>


                <button
                    type="button"
                    class="delete-task-btn"
                    onclick="deleteTask(${Number(task.id)})"
                >
                    🗑️ Delete
                </button>

            </div>

        </div>
    `;
}


// ==============================
// FILTERED STATISTICS
// ==============================

function updateFilteredStats(
    tasks
) {

    const total =
        tasks.length;


    const todo =
        tasks.filter(
            task =>
                task.status ===
                "To Do"
        ).length;


    const progress =
        tasks.filter(
            task =>
                task.status ===
                "In Progress"
        ).length;


    const completed =
        tasks.filter(
            task =>
                task.status ===
                "Completed"
        ).length;


    setTaskText(
        "total-tasks",
        total
    );

    setTaskText(
        "todo-tasks",
        todo
    );

    setTaskText(
        "progress-tasks",
        progress
    );

    setTaskText(
        "completed-tasks",
        completed
    );
}


function setTaskText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.innerText =
            value;

    }

}


// ==============================
// SETUP FILTER EVENTS
// ==============================

function setupTaskFilters() {

    const searchInput =
        document.getElementById(
            "taskSearch"
        );


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    const priorityFilter =
        document.getElementById(
            "priorityFilter"
        );


    const projectFilter =
        document.getElementById(
            "projectFilter"
        );


    const clearButton =
        document.getElementById(
            "clearTaskFilters"
        );


    // SEARCH

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                currentFilters.search =
                    this.value;

                applyTaskFilters();

            }
        );

    }


    // STATUS

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            function () {

                currentFilters.status =
                    this.value;

                applyTaskFilters();

            }
        );

    }


    // PRIORITY

    if (priorityFilter) {

        priorityFilter.addEventListener(
            "change",
            function () {

                currentFilters.priority =
                    this.value;

                applyTaskFilters();

            }
        );

    }


    // PROJECT

    if (projectFilter) {

        projectFilter.addEventListener(
            "change",
            function () {

                currentFilters.project =
                    this.value;

                applyTaskFilters();

            }
        );

    }


    // CLEAR

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function () {

                currentFilters = {
                    search: "",
                    status: "",
                    priority: "",
                    project: ""
                };


                if (searchInput) {

                    searchInput.value =
                        "";

                }


                if (statusFilter) {

                    statusFilter.value =
                        "";

                }


                if (priorityFilter) {

                    priorityFilter.value =
                        "";

                }


                if (projectFilter) {

                    projectFilter.value =
                        "";

                }


                applyTaskFilters();

            }
        );

    }

}


// ==============================
// CREATE TASK MODAL
// ==============================

function openTaskModal() {

    const modal =
        document.getElementById(
            "taskModal"
        );


    if (!modal) return;


    modal.classList.add(
        "show"
    );


    loadProjectsForTask();

    loadUsersForTask();

}


function closeTaskModal() {

    const modal =
        document.getElementById(
            "taskModal"
        );


    const form =
        document.getElementById(
            "taskForm"
        );


    const message =
        document.getElementById(
            "taskMessage"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }


    if (form) {

        form.reset();

    }


    if (message) {

        message.innerText =
            "";

    }

}


// ==============================
// CREATE TASK
// ==============================

function setupCreateTaskForm() {

    const taskForm =
        document.getElementById(
            "taskForm"
        );


    if (!taskForm) {

        console.error(
            "Task form not found."
        );

        return;

    }


    taskForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const title =
                document
                    .getElementById(
                        "taskTitle"
                    )
                    .value
                    .trim();


            const description =
                document
                    .getElementById(
                        "taskDescription"
                    )
                    .value
                    .trim();


            const status =
                document
                    .getElementById(
                        "taskStatus"
                    )
                    .value;


            const priority =
                document
                    .getElementById(
                        "taskPriority"
                    )
                    .value;


            const projectId =
                document
                    .getElementById(
                        "taskProject"
                    )
                    .value;


            const assignee =
                document
                    .getElementById(
                        "taskAssignee"
                    )
                    .value;


            const dueDate =
                document
                    .getElementById(
                        "taskDueDate"
                    )
                    .value;


            const message =
                document.getElementById(
                    "taskMessage"
                );


            if (!title) {

                message.innerText =
                    "Please enter task title.";

                message.style.color =
                    "#dc2626";

                return;

            }


            if (!projectId) {

                message.innerText =
                    "Please select a project.";

                message.style.color =
                    "#dc2626";

                return;

            }


            message.innerText =
                "Creating task...";

            message.style.color =
                "#64748b";


            try {

                const response =
                    await fetch(
                        `${API_URL}/api/tasks`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    title:
                                        title,

                                    description:
                                        description,

                                    status:
                                        status,

                                    priority:
                                        priority,

                                    project_id:
                                        parseInt(
                                            projectId
                                        ),

                                    assigned_to:
                                        assignee
                                            ? parseInt(
                                                assignee
                                            )
                                            : null,

                                    due_date:
                                        dueDate
                                            ? dueDate
                                            : null

                                })
                        }
                    );


                const data =
                    await response.json();


                if (!data.success) {

                    throw new Error(
                        data.message ||
                        "Failed to create task"
                    );

                }


                message.innerText =
                    "✓ Task created successfully!";

                message.style.color =
                    "#16a34a";


                setTimeout(
                    async () => {

                        closeTaskModal();

                        await loadTasks();

                    },
                    700
                );


            } catch (error) {

                console.error(
                    "Create Task Error:",
                    error
                );


                message.innerText =
                    error.message ||
                    "Failed to create task.";

                message.style.color =
                    "#dc2626";

            }

        }
    );

}


// ==============================
// EDIT TASK
// ==============================

async function editTask(
    taskId
) {

    console.log(
        "EDIT BUTTON CLICKED:",
        taskId
    );


    try {

        const response =
            await fetch(
                `${API_URL}/api/tasks`
            );


        if (!response.ok) {

            throw new Error(
                `Server error: ${response.status}`
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Failed to load task"
            );

        }


        const task =
            data.tasks.find(
                item =>
                    Number(item.id) ===
                    Number(taskId)
            );


        if (!task) {

            alert(
                "Task not found."
            );

            return;

        }


        document.getElementById(
            "editTaskId"
        ).value =
            task.id;


        document.getElementById(
            "editTaskTitle"
        ).value =
            task.title || "";


        document.getElementById(
            "editTaskDescription"
        ).value =
            task.description || "";


        document.getElementById(
            "editTaskStatus"
        ).value =
            task.status || "To Do";


        document.getElementById(
            "editTaskPriority"
        ).value =
            task.priority || "Medium";


        document.getElementById(
            "editTaskDueDate"
        ).value =
            task.due_date || "";


        await loadEditProjects(
            task.project_id
        );


        await loadEditUsers(
            task.assigned_to
        );


        const message =
            document.getElementById(
                "editTaskMessage"
            );


        if (message) {

            message.innerText =
                "";

        }


        const modal =
            document.getElementById(
                "editTaskModal"
            );


        if (modal) {

            modal.classList.add(
                "show"
            );

        }


    } catch (error) {

        console.error(
            "Edit Task Error:",
            error
        );


        alert(
            error.message ||
            "Failed to open edit task."
        );

    }

}


// ==============================
// LOAD EDIT PROJECTS
// ==============================

async function loadEditProjects(
    selectedProjectId = ""
) {

    const select =
        document.getElementById(
            "editTaskProject"
        );


    if (!select) return;


    try {

        const response =
            await fetch(
                `${API_URL}/api/projects`
            );


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Failed to load projects"
            );

        }


        select.innerHTML = `
            <option value="">
                Select Project
            </option>
        `;


        data.projects.forEach(
            project => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    project.id;


                option.textContent =
                    project.name;


                if (
                    String(
                        project.id
                    ) ===
                    String(
                        selectedProjectId
                    )
                ) {

                    option.selected =
                        true;

                }


                select.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "Edit Project Load Error:",
            error
        );

    }

}


// ==============================
// LOAD EDIT USERS
// ==============================

async function loadEditUsers(
    selectedUserId = ""
) {

    const select =
        document.getElementById(
            "editTaskAssignee"
        );


    if (!select) return;


    try {

        const response =
            await fetch(
                `${API_URL}/api/users`
            );


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Failed to load users"
            );

        }


        select.innerHTML = `
            <option value="">
                Unassigned
            </option>
        `;


        data.users.forEach(
            user => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    user.id;


                option.textContent =
                    `${user.name} (${user.role})`;


                if (
                    String(
                        user.id
                    ) ===
                    String(
                        selectedUserId
                    )
                ) {

                    option.selected =
                        true;

                }


                select.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "Edit User Load Error:",
            error
        );

    }

}


// ==============================
// CLOSE EDIT MODAL
// ==============================

function closeEditTaskModal() {

    const modal =
        document.getElementById(
            "editTaskModal"
        );


    const form =
        document.getElementById(
            "editTaskForm"
        );


    const message =
        document.getElementById(
            "editTaskMessage"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }


    if (form) {

        form.reset();

    }


    if (message) {

        message.innerText =
            "";

    }

}


// ==============================
// SAVE EDITED TASK
// ==============================

function setupEditTaskForm() {

    const editForm =
        document.getElementById(
            "editTaskForm"
        );


    if (!editForm) {

        console.error(
            "Edit task form not found."
        );

        return;

    }


    editForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const taskId =
                document.getElementById(
                    "editTaskId"
                ).value;


            const title =
                document.getElementById(
                    "editTaskTitle"
                ).value.trim();


            const description =
                document.getElementById(
                    "editTaskDescription"
                ).value.trim();


            const status =
                document.getElementById(
                    "editTaskStatus"
                ).value;


            const priority =
                document.getElementById(
                    "editTaskPriority"
                ).value;


            const projectId =
                document.getElementById(
                    "editTaskProject"
                ).value;


            const assignee =
                document.getElementById(
                    "editTaskAssignee"
                ).value;


            const dueDate =
                document.getElementById(
                    "editTaskDueDate"
                ).value;


            const message =
                document.getElementById(
                    "editTaskMessage"
                );


            if (!title) {

                message.innerText =
                    "Task title is required.";

                message.style.color =
                    "#dc2626";

                return;

            }


            if (!projectId) {

                message.innerText =
                    "Please select a project.";

                message.style.color =
                    "#dc2626";

                return;

            }


            message.innerText =
                "Saving changes...";

            message.style.color =
                "#64748b";


            try {

                const response =
                    await fetch(
                        `${API_URL}/api/tasks/${taskId}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    title:
                                        title,

                                    description:
                                        description,

                                    status:
                                        status,

                                    priority:
                                        priority,

                                    project_id:
                                        parseInt(
                                            projectId
                                        ),

                                    assigned_to:
                                        assignee
                                            ? parseInt(
                                                assignee
                                            )
                                            : null,

                                    due_date:
                                        dueDate
                                            ? dueDate
                                            : null

                                })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        `Update failed: ${response.status}`
                    );

                }


                if (!data.success) {

                    throw new Error(
                        data.message ||
                        "Failed to update task"
                    );

                }


                message.innerText =
                    "✓ Task updated successfully!";

                message.style.color =
                    "#16a34a";


                setTimeout(
                    async () => {

                        closeEditTaskModal();

                        await loadTasks();

                    },
                    700
                );


            } catch (error) {

                console.error(
                    "Update Task Error:",
                    error
                );


                message.innerText =
                    error.message ||
                    "Failed to update task.";

                message.style.color =
                    "#dc2626";

            }

        }
    );

}


// ==============================
// DELETE TASK
// ==============================

async function deleteTask(
    taskId
) {

    console.log(
        "DELETE BUTTON CLICKED:",
        taskId
    );


    const confirmDelete =
        confirm(
            "Are you sure you want to delete this task?"
        );


    if (!confirmDelete) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/tasks/${taskId}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                `Delete failed: ${response.status}`
            );

        }


        if (!data.success) {

            throw new Error(
                data.message ||
                "Failed to delete task"
            );

        }


        alert(
            "✓ Task deleted successfully!"
        );


        await loadTasks();


    } catch (error) {

        console.error(
            "Delete Task Error:",
            error
        );


        alert(
            error.message ||
            "Failed to delete task."
        );

    }

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


// ==============================
// AUTH CHECK
// ==============================

function checkLogin() {

    const user =
        localStorage.getItem(
            "nexoraUser"
        );


    if (!user) {

        window.location.href =
            "login.html";

        return false;

    }


    return true;

}


// ==============================
// PAGE LOAD
// ==============================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupTaskFilters();

        setupCreateTaskForm();

        setupEditTaskForm();


        if (checkLogin()) {

            loadTasks();

        }

    }
);