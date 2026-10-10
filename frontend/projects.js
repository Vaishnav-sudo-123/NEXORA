const API_URL = "http://127.0.0.1:5000";


// ==============================
// LOAD PROJECTS
// ==============================

async function loadProjects() {

    const container = document.getElementById("projects-container");

    try {

        const response = await fetch(`${API_URL}/api/projects`);

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        const projects = data.projects;

        updateProjectStats(projects);

        if (projects.length === 0) {

            container.innerHTML = `
                <div class="empty-state">
                    <h3>No projects yet</h3>
                    <p>Create your first project to get started.</p>
                </div>
            `;

            return;
        }

        container.innerHTML = projects.map(project => {

            const statusClass =
                project.status.toLowerCase();

            return `
                <div class="project-card">

                    <div class="project-card-header">

                        <h4>
                            ${project.name}
                        </h4>

                        <span class="status ${statusClass}">
                            ${project.status}
                        </span>

                    </div>

                    <p class="project-description">
                        ${project.description || "No description provided."}
                    </p>

                    <div class="progress-info">

                        <span>Progress</span>

                        <strong>
                            ${project.progress}%
                        </strong>

                    </div>

                    <div class="progress-bar">

                        <div
                            class="progress-fill"
                            style="width: ${project.progress}%"
                        ></div>

                    </div>

                    <div class="project-deadline">
    📅 Deadline:
    ${project.deadline || "Not set"}
</div>

<div class="project-actions">

    <button
        class="edit-project-btn"
        onclick="editProject(${project.id})"
    >
        ✏️ Edit
    </button>

    <button
        class="delete-project-btn"
        onclick="deleteProject(${project.id})"
    >
        🗑️ Delete
    </button>

</div>
</div>
                </div>
            `;

        }).join("");

    } catch (error) {

        console.error("Projects Error:", error);

        container.innerHTML = `
            <div class="empty-state">
                <h3>Unable to load projects</h3>
                <p>Please make sure the backend server is running.</p>
            </div>
        `;
    }
}


// ==============================
// PROJECT STATISTICS
// ==============================

function updateProjectStats(projects) {

    const total = projects.length;

    const active = projects.filter(
        project => project.status === "Active"
    ).length;

    const completed = projects.filter(
        project => project.status === "Completed"
    ).length;

    document.getElementById("total-projects").innerText = total;

    document.getElementById("active-projects").innerText = active;

    document.getElementById("completed-projects").innerText = completed;
}
// ==============================
// EDIT PROJECT
// ==============================
// ==============================
// DELETE PROJECT
// ==============================

async function deleteProject(projectId) {

    const confirmed = confirm(
        "Are you sure you want to delete this project?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/projects/${projectId}`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        alert("✓ Project deleted successfully!");

        loadProjects();

    } catch (error) {

        console.error(
            "Delete Project Error:",
            error
        );

        alert("Failed to delete project.");
    }
}
// ==============================
// OPEN EDIT PROJECT MODAL
// ==============================

async function editProject(projectId) {

    try {

        const response = await fetch(
            `${API_URL}/api/projects`
        );

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        const project = data.projects.find(
            project => project.id === projectId
        );

        if (!project) {
            alert("Project not found.");
            return;
        }

        document.getElementById("editProjectId").value =
            project.id;

        document.getElementById("editProjectName").value =
            project.name;

        document.getElementById("editProjectDescription").value =
            project.description || "";

        document.getElementById("editProjectStatus").value =
            project.status;

        document.getElementById("editProjectProgress").value =
            project.progress || 0;

        document.getElementById("editProjectDeadline").value =
            project.deadline || "";

        document
            .getElementById("editProjectModal")
            .classList.add("show");

    } catch (error) {

        console.error("Load Project Error:", error);

        alert("Unable to load project.");
    }
}


// ==============================
// CLOSE EDIT PROJECT MODAL
// ==============================

function closeEditProjectModal() {

    document
        .getElementById("editProjectModal")
        .classList.remove("show");

    document
        .getElementById("editProjectForm")
        .reset();

    document
        .getElementById("editProjectMessage")
        .innerText = "";
}


// ==============================
// UPDATE PROJECT
// ==============================

document
    .getElementById("editProjectForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const projectId =
            document.getElementById("editProjectId").value;

        const name =
            document.getElementById("editProjectName").value.trim();

        const description =
            document.getElementById("editProjectDescription").value.trim();

        const status =
            document.getElementById("editProjectStatus").value;

        const progress =
            parseInt(
                document.getElementById("editProjectProgress").value
            ) || 0;

        const deadline =
            document.getElementById("editProjectDeadline").value;

        const message =
            document.getElementById("editProjectMessage");

        if (!name) {

            message.innerText =
                "Project name is required.";

            message.style.color = "#dc2626";

            return;
        }

        message.innerText =
            "Updating project...";

        message.style.color =
            "#64748b";

        try {

            const response = await fetch(
                `${API_URL}/api/projects/${projectId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name: name,
                        description: description,
                        status: status,
                        progress: progress,
                        deadline: deadline || null
                    })
                }
            );

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message);
            }

            message.innerText =
                "✓ Project updated successfully!";

            message.style.color =
                "#16a34a";

            setTimeout(() => {

                closeEditProjectModal();

                loadProjects();

            }, 700);

        } catch (error) {

            console.error(
                "Update Project Error:",
                error
            );

            message.innerText =
                "Failed to update project.";

            message.style.color =
                "#dc2626";
        }

    });
// ==============================
// OPEN MODAL
// ==============================

function openProjectModal() {

    document
        .getElementById("projectModal")
        .classList.add("show");
}


// ==============================
// CLOSE MODAL
// ==============================

function closeProjectModal() {

    document
        .getElementById("projectModal")
        .classList.remove("show");

    document
        .getElementById("projectForm")
        .reset();

    document
        .getElementById("projectMessage")
        .innerText = "";
}


// ==============================
// CREATE PROJECT
// ==============================

document
    .getElementById("projectForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const name =
            document.getElementById("projectName").value.trim();

        const description =
            document.getElementById("projectDescription").value.trim();

        const status =
            document.getElementById("projectStatus").value;

        const progress =
            parseInt(
                document.getElementById("projectProgress").value
            ) || 0;

        const deadline =
            document.getElementById("projectDeadline").value;

        const message =
            document.getElementById("projectMessage");

        message.innerText = "Creating project...";
        message.style.color = "#64748b";

        try {

            const response = await fetch(
                `${API_URL}/api/projects`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name: name,
                        description: description,
                        status: status,
                        progress: progress,
                        deadline: deadline || null
                    })
                }
            );

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message);
            }

            message.innerText =
                "✓ Project created successfully!";

            message.style.color = "#16a34a";

            setTimeout(() => {

                closeProjectModal();

                loadProjects();

            }, 700);

        } catch (error) {

            console.error("Create Project Error:", error);

            message.innerText =
                "Failed to create project.";

            message.style.color = "#dc2626";
        }

    });


// ==============================
// LOGOUT
// ==============================

function logout() {

    localStorage.removeItem("nexoraUser");

    window.location.href = "login.html";
}


// ==============================
// AUTH CHECK
// ==============================

function checkLogin() {

    const user =
        localStorage.getItem("nexoraUser");

    if (!user) {

        window.location.href = "login.html";

        return false;
    }

    return true;
}


// ==============================
// PAGE LOAD
// ==============================

document.addEventListener("DOMContentLoaded", function() {

    if (checkLogin()) {
        loadProjects();
    }

});