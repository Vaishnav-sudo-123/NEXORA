const API_URL = "http://127.0.0.1:5000";

let allTeamMembers = [];


// =====================================================
// LOAD TEAM
// =====================================================

async function loadTeam() {

    const grid = document.getElementById("teamGrid");

    grid.innerHTML = `
        <div class="loading">
            Loading team members...
        </div>
    `;

    try {

        const response = await fetch(`${API_URL}/api/team`);

        if (!response.ok) {
            throw new Error("Failed to load team");
        }

        const data = await response.json();

        allTeamMembers = Array.isArray(data)
            ? data
            : data.team || [];

        displayTeam(allTeamMembers);
        updateStats(allTeamMembers);

    } catch (error) {

        console.error("Team Error:", error);

        grid.innerHTML = `
            <div class="loading">
                ⚠️ Unable to load team members.
                <br>
                <small>Make sure the Flask backend is running.</small>
            </div>
        `;

        updateStats([]);
    }
}


// =====================================================
// DISPLAY TEAM
// =====================================================

function displayTeam(team) {

    const grid = document.getElementById("teamGrid");

    if (!team || team.length === 0) {

        grid.innerHTML = `
            <div class="loading">
                👥 No team members found.
            </div>
        `;

        return;
    }

    grid.innerHTML = "";

    team.forEach(member => {

        const name = member.name || "Unknown User";
        const email = member.email || "No email";
        const role = member.role || "Team Member";
        const projectName = member.project_name || "No Project";

        const initials = getInitials(name);

        const card = document.createElement("div");

        card.className = "team-card";

        card.innerHTML = `
            <div class="member-top">

                <div class="avatar">
                    ${escapeHTML(initials)}
                </div>

                <div class="member-details">

                    <div class="member-name">
                        ${escapeHTML(name)}
                    </div>

                    <div class="member-email">
                        ${escapeHTML(email)}
                    </div>

                </div>

            </div>


            <div class="member-role-row">

                <span class="role">
                    ${escapeHTML(role)}
                </span>

                <span class="status-badge">
                    ● Active
                </span>

            </div>


            <div class="project-info">

                <span class="project-label">
                    PROJECT
                </span>

                <strong>
                    📁 ${escapeHTML(projectName)}
                </strong>

            </div>


            <div class="team-actions">

                <button
                    class="edit-team-btn"
                    onclick="editTeamMember(${member.id})">
                    ✏️ Edit
                </button>

                <button
                    class="delete-team-btn"
                    onclick="deleteTeamMember(${member.id})">
                    🗑 Delete
                </button>

            </div>
        `;

        grid.appendChild(card);
    });
}


// =====================================================
// GET INITIALS
// =====================================================

function getInitials(name) {

    return name
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0))
        .join("")
        .substring(0, 2)
        .toUpperCase();
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// UPDATE STATS
// =====================================================

function updateStats(team) {

    const members = new Set();
    const projects = new Set();

    team.forEach(member => {

        if (
            member.user_id !== null &&
            member.user_id !== undefined
        ) {
            members.add(member.user_id);
        }

        if (
            member.project_id !== null &&
            member.project_id !== undefined
        ) {
            projects.add(member.project_id);
        }

    });

    document.getElementById("totalMembers").innerText =
        members.size;

    document.getElementById("totalProjects").innerText =
        projects.size;

    document.getElementById("totalAssignments").innerText =
        team.length;
}


// =====================================================
// LOAD USERS
// =====================================================

async function loadUsers(selectedUserId = "") {

    const select = document.getElementById("userSelect");

    select.innerHTML = `
        <option value="">Loading users...</option>
    `;

    try {

        const response = await fetch(`${API_URL}/api/users`);

        if (!response.ok) {
            throw new Error("Failed to load users");
        }

        const data = await response.json();

        const users = Array.isArray(data)
            ? data
            : data.users || [];

        select.innerHTML = `
            <option value="">Choose user</option>
        `;

        users.forEach(user => {

            const option = document.createElement("option");

            option.value = user.id;

            option.textContent =
                `${user.name} — ${user.email}`;

            if (String(user.id) === String(selectedUserId)) {
                option.selected = true;
            }

            select.appendChild(option);
        });

    } catch (error) {

        console.error("Users Error:", error);

        select.innerHTML = `
            <option value="">
                Unable to load users
            </option>
        `;
    }
}


// =====================================================
// LOAD PROJECTS
// =====================================================

async function loadProjects(selectedProjectId = "") {

    const select = document.getElementById("projectSelect");

    select.innerHTML = `
        <option value="">Loading projects...</option>
    `;

    try {

        const response = await fetch(`${API_URL}/api/projects`);

        if (!response.ok) {
            throw new Error("Failed to load projects");
        }

        const data = await response.json();

        const projects = Array.isArray(data)
            ? data
            : data.projects || [];

        select.innerHTML = `
            <option value="">Choose project</option>
        `;

        projects.forEach(project => {

            const option = document.createElement("option");

            option.value = project.id;

            option.textContent = project.name;

            if (
                String(project.id) ===
                String(selectedProjectId)
            ) {
                option.selected = true;
            }

            select.appendChild(option);
        });

    } catch (error) {

        console.error("Projects Error:", error);

        select.innerHTML = `
            <option value="">
                Unable to load projects
            </option>
        `;
    }
}


// =====================================================
// OPEN ADD MODAL
// =====================================================

function openTeamModal() {

    const modal = document.getElementById("teamModal");

    modal.style.display = "flex";

    document.querySelector("#teamModal h2").innerText =
        "Add Team Member";

    document.querySelector("#teamModal .modal-header p").innerText =
        "Assign a user to a project.";

    document.querySelector("#teamForm .save-btn").innerText =
        "Add Member";

    loadUsers();
    loadProjects();

    document.getElementById("teamForm").dataset.editId = "";
}


// =====================================================
// CLOSE MODAL
// =====================================================

function closeTeamModal() {

    const modal = document.getElementById("teamModal");

    modal.style.display = "none";

    document.getElementById("teamForm").reset();

    document.getElementById("teamForm").dataset.editId = "";
}


// =====================================================
// EDIT TEAM MEMBER
// =====================================================

async function editTeamMember(memberId) {

    const member = allTeamMembers.find(
        item => String(item.id) === String(memberId)
    );

    if (!member) {

        alert("Team member not found.");

        return;
    }

    const modal = document.getElementById("teamModal");

    modal.style.display = "flex";

    document.querySelector("#teamModal h2").innerText =
        "Edit Team Assignment";

    document.querySelector("#teamModal .modal-header p").innerText =
        "Update user and project assignment.";

    document.querySelector("#teamForm .save-btn").innerText =
        "Update Assignment";

    document.getElementById("teamForm").dataset.editId =
        memberId;

    await loadUsers(member.user_id);

    await loadProjects(member.project_id);
}


// =====================================================
// ADD / UPDATE TEAM MEMBER
// =====================================================

document
    .getElementById("teamForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const userId =
            document.getElementById("userSelect").value;

        const projectId =
            document.getElementById("projectSelect").value;

        const editId =
            this.dataset.editId;

        if (!userId || !projectId) {

            alert("Please select both user and project.");

            return;
        }

        try {

            let response;

            // =========================================
            // UPDATE
            // =========================================

            if (editId) {

                response = await fetch(
                    `${API_URL}/api/team/members/${editId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            user_id: parseInt(userId),
                            project_id: parseInt(projectId)
                        })
                    }
                );

            }

            // =========================================
            // CREATE
            // =========================================

            else {

                response = await fetch(
                    `${API_URL}/api/team/members`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            user_id: parseInt(userId),
                            project_id: parseInt(projectId)
                        })
                    }
                );

            }

            const data = await response.json();

            if (data.success) {

                alert(
                    editId
                        ? "Team assignment updated successfully! 🎉"
                        : "Team member added successfully! 🎉"
                );

                closeTeamModal();

                await loadTeam();

            } else {

                alert(
                    data.message ||
                    "Unable to save team assignment."
                );
            }

        } catch (error) {

            console.error(
                "Team Save Error:",
                error
            );

            alert(
                "Unable to connect to server."
            );
        }

    });


// =====================================================
// DELETE TEAM MEMBER
// =====================================================

async function deleteTeamMember(memberId) {

    const member = allTeamMembers.find(
        item => String(item.id) === String(memberId)
    );

    if (!member) {

        alert("Team assignment not found.");

        return;
    }

    const confirmDelete = confirm(
        `Delete ${member.name}'s assignment from "${member.project_name}"?`
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/team/members/${memberId}`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (data.success) {

            alert(
                "Team assignment deleted successfully! 🗑️"
            );

            await loadTeam();

        } else {

            alert(
                data.message ||
                "Unable to delete assignment."
            );
        }

    } catch (error) {

        console.error(
            "Delete Team Error:",
            error
        );

        alert(
            "Unable to connect to server."
        );
    }
}


// =====================================================
// SEARCH TEAM
// =====================================================

document
    .getElementById("searchTeam")
    .addEventListener("input", function() {

        const searchValue =
            this.value.trim().toLowerCase();

        if (!searchValue) {

            displayTeam(allTeamMembers);

            return;
        }

        const filteredTeam =
            allTeamMembers.filter(member => {

                const name =
                    String(member.name || "")
                        .toLowerCase();

                const email =
                    String(member.email || "")
                        .toLowerCase();

                const project =
                    String(member.project_name || "")
                        .toLowerCase();

                const role =
                    String(member.role || "")
                        .toLowerCase();

                return (
                    name.includes(searchValue) ||
                    email.includes(searchValue) ||
                    project.includes(searchValue) ||
                    role.includes(searchValue)
                );
            });

        displayTeam(filteredTeam);
    });


// =====================================================
// CLOSE MODAL OUTSIDE
// =====================================================

document
    .getElementById("teamModal")
    .addEventListener("click", function(event) {

        if (event.target === this) {

            closeTeamModal();
        }
    });


// =====================================================
// LOGOUT
// =====================================================

document
    .getElementById("logoutBtn")
    .addEventListener("click", function() {

        localStorage.removeItem("nexoraUser");

        window.location.href = "login.html";
    });


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", function() {

    const user =
        localStorage.getItem("nexoraUser");

    if (!user) {

        window.location.href = "login.html";

        return;
    }

    loadTeam();
});