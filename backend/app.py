from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash
from db import get_db_connection
from datetime import date, timedelta

app = Flask(__name__)
CORS(app)


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():
    return jsonify({
        "message": "NEXORA Backend is running successfully 🚀",
        "status": "online"
    })


# =========================================================
# REGISTER API
# =========================================================

@app.route("/api/register", methods=["POST"])
def register():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request data is required"
        }), 400

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({
            "success": False,
            "message": "Name, email and password are required"
        }), 400

    if "@" not in email:
        return jsonify({
            "success": False,
            "message": "Please enter a valid email address"
        }), 400

    if len(password) < 6:
        return jsonify({
            "success": False,
            "message": "Password must contain at least 6 characters"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT id
            FROM users
            WHERE email = %s
        """, (email,))

        existing_user = cursor.fetchone()

        if existing_user:
            return jsonify({
                "success": False,
                "message": "An account with this email already exists"
            }), 409

        hashed_password = generate_password_hash(password)

        cursor.execute("""
            INSERT INTO users
            (
                name,
                email,
                password,
                role
            )
            VALUES (%s, %s, %s, %s)
        """, (
            name,
            email,
            hashed_password,
            "Member"
        ))

        user_id = cursor.lastrowid

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Account created successfully!",
            "user": {
                "id": user_id,
                "name": name,
                "email": email,
                "role": "Member"
            }
        }), 201

    except Exception as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


# =========================================================
# LOGIN API
# =========================================================

@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request data is required"
        }), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                id,
                name,
                email,
                password,
                role
            FROM users
            WHERE email = %s
        """, (email,))

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        if not check_password_hash(
            user["password"],
            password
        ):
            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        user.pop("password", None)

        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": user
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


# =========================================================
# PROFILE UPDATE API
# =========================================================

@app.route("/api/users/<int:user_id>", methods=["PUT"])
def update_user_profile(user_id):

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request data is required"
        }), 400

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()

    if not name or not email:
        return jsonify({
            "success": False,
            "message": "Name and email are required"
        }), 400

    if "@" not in email:
        return jsonify({
            "success": False,
            "message": "Please enter a valid email address"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        # Check if email is already used by another user
        cursor.execute("""
            SELECT id
            FROM users
            WHERE email = %s
            AND id != %s
        """, (
            email,
            user_id
        ))

        existing_user = cursor.fetchone()

        if existing_user:
            return jsonify({
                "success": False,
                "message": "This email is already used by another account"
            }), 409

        # Update user profile
        cursor.execute("""
            UPDATE users
            SET
                name = %s,
                email = %s
            WHERE id = %s
        """, (
            name,
            email,
            user_id
        ))

        if cursor.rowcount == 0:
            connection.rollback()

            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        connection.commit()

        # Get updated user
        cursor.execute("""
            SELECT
                id,
                name,
                email,
                role
            FROM users
            WHERE id = %s
        """, (user_id,))

        updated_user = cursor.fetchone()

        return jsonify({
            "success": True,
            "message": "Profile updated successfully!",
            "user": updated_user
        }), 200

    except Exception as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


# =========================================================
# DASHBOARD API
# =========================================================

@app.route("/api/dashboard", methods=["GET"])
def get_dashboard():

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM projects
        """)
        projects = cursor.fetchone()["total"]

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM tasks
        """)
        tasks = cursor.fetchone()["total"]

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM tasks
            WHERE status = 'Completed'
        """)
        completed = cursor.fetchone()["total"]

        cursor.execute("""
            SELECT COUNT(DISTINCT user_id) AS total
            FROM team_members
        """)
        team_members = cursor.fetchone()["total"]

        return jsonify({
            "success": True,
            "projects": projects,
            "tasks": tasks,
            "completed": completed,
            "team_members": team_members
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


# =========================================================
# PROJECT MANAGEMENT
# =========================================================

@app.route("/api/projects", methods=["GET"])
def get_projects():

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                id,
                name,
                description,
                status,
                progress,
                deadline,
                created_at
            FROM projects
            ORDER BY created_at DESC
        """)

        projects = cursor.fetchall()

        return jsonify({
            "success": True,
            "projects": projects
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


@app.route("/api/projects", methods=["POST"])
def create_project():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request data is required"
        }), 400

    name = data.get("name")
    description = data.get("description", "")
    status = data.get("status", "Active")
    progress = data.get("progress", 0)
    deadline = data.get("deadline")

    if not name:
        return jsonify({
            "success": False,
            "message": "Project name is required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            INSERT INTO projects
            (
                name,
                description,
                status,
                progress,
                deadline
            )
            VALUES (%s, %s, %s, %s, %s)
        """, (
            name,
            description,
            status,
            progress,
            deadline
        ))

        project_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO notifications
            (
                user_id,
                message,
                type,
                is_read
            )
            VALUES (%s, %s, %s, %s)
        """, (
            2,
            f'New project "{name}" was created.',
            "project",
            0
        ))

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Project created successfully!",
            "project_id": project_id
        }), 201

    except Exception as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


@app.route("/api/projects/<int:project_id>", methods=["PUT"])
def update_project(project_id):

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request data is required"
        }), 400

    name = data.get("name")
    description = data.get("description", "")
    status = data.get("status", "Active")
    progress = data.get("progress", 0)
    deadline = data.get("deadline")

    if not name:
        return jsonify({
            "success": False,
            "message": "Project name is required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            UPDATE projects
            SET
                name = %s,
                description = %s,
                status = %s,
                progress = %s,
                deadline = %s
            WHERE id = %s
        """, (
            name,
            description,
            status,
            progress,
            deadline,
            project_id
        ))

        if cursor.rowcount == 0:
            connection.rollback()

            return jsonify({
                "success": False,
                "message": "Project not found"
            }), 404

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Project updated successfully!"
        }), 200

    except Exception as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


@app.route("/api/projects/<int:project_id>", methods=["DELETE"])
def delete_project(project_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            SELECT id
            FROM projects
            WHERE id = %s
        """, (project_id,))

        project = cursor.fetchone()

        if not project:
            return jsonify({
                "success": False,
                "message": "Project not found"
            }), 404

        cursor.execute("""
            DELETE FROM projects
            WHERE id = %s
        """, (project_id,))

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Project deleted successfully!"
        }), 200

    except Exception as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


# =========================================================
# TASK MANAGEMENT
# =========================================================

@app.route("/api/tasks", methods=["GET"])
def get_tasks():

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                tasks.id,
                tasks.title,
                tasks.description,
                tasks.status,
                tasks.priority,
                tasks.project_id,
                tasks.assigned_to,
                tasks.due_date,
                projects.name AS project_name,
                users.name AS assigned_user
            FROM tasks
            LEFT JOIN projects
                ON tasks.project_id = projects.id
            LEFT JOIN users
                ON tasks.assigned_to = users.id
            ORDER BY tasks.created_at DESC
        """)

        tasks = cursor.fetchall()

        return jsonify({
            "success": True,
            "tasks": tasks
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


@app.route("/api/tasks", methods=["POST"])
def create_task():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request data is required"
        }), 400

    title = data.get("title")
    description = data.get("description", "")
    status = data.get("status", "To Do")
    priority = data.get("priority", "Medium")
    project_id = data.get("project_id")
    assigned_to = data.get("assigned_to")
    due_date = data.get("due_date")

    if not title:
        return jsonify({
            "success": False,
            "message": "Task title is required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            INSERT INTO tasks
            (
                title,
                description,
                status,
                priority,
                project_id,
                assigned_to,
                due_date
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            title,
            description,
            status,
            priority,
            project_id,
            assigned_to,
            due_date
        ))

        task_id = cursor.lastrowid

        if assigned_to:

            cursor.execute("""
                INSERT INTO notifications
                (
                    user_id,
                    message,
                    type,
                    is_read
                )
                VALUES (%s, %s, %s, %s)
            """, (
                assigned_to,
                f'You have been assigned a new task: "{title}"',
                "task",
                0
            ))

        cursor.execute("""
            INSERT INTO notifications
            (
                user_id,
                message,
                type,
                is_read
            )
            VALUES (%s, %s, %s, %s)
        """, (
            2,
            f'New task "{title}" was created.',
            "task",
            0
        ))

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Task created successfully!",
            "task_id": task_id
        }), 201

    except Exception as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request data is required"
        }), 400

    title = data.get("title")
    description = data.get("description", "")
    status = data.get("status", "To Do")
    priority = data.get("priority", "Medium")
    project_id = data.get("project_id")
    assigned_to = data.get("assigned_to")
    due_date = data.get("due_date")

    if not title or not title.strip():
        return jsonify({
            "success": False,
            "message": "Task title is required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            UPDATE tasks
            SET
                title = %s,
                description = %s,
                status = %s,
                priority = %s,
                project_id = %s,
                assigned_to = %s,
                due_date = %s
            WHERE id = %s
        """, (
            title.strip(),
            description,
            status,
            priority,
            project_id,
            assigned_to,
            due_date,
            task_id
        ))

        if cursor.rowcount == 0:
            connection.rollback()

            return jsonify({
                "success": False,
                "message": "Task not found"
            }), 404

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Task updated successfully!"
        }), 200

    except Exception as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            DELETE FROM tasks
            WHERE id = %s
        """, (task_id,))

        if cursor.rowcount == 0:
            connection.rollback()

            return jsonify({
                "success": False,
                "message": "Task not found"
            }), 404

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Task deleted successfully!"
        }), 200

    except Exception as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


# =========================================================
# TEAM MANAGEMENT
# =========================================================

@app.route("/api/team", methods=["GET"])
def get_team():

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        query = """
            SELECT
                team_members.id,
                users.id AS user_id,
                users.name,
                users.email,
                users.role,
                projects.id AS project_id,
                projects.name AS project_name
            FROM team_members
            JOIN users
                ON team_members.user_id = users.id
            JOIN projects
                ON team_members.project_id = projects.id
            ORDER BY team_members.id DESC
        """

        cursor.execute(query)

        team = cursor.fetchall()

        return jsonify(team)

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


@app.route("/api/users", methods=["GET"])
def get_users():

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                id,
                name,
                email,
                role
            FROM users
            ORDER BY name ASC
        """)

        users = cursor.fetchall()

        return jsonify(users)

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


@app.route("/api/team/members", methods=["POST"])
def add_team_member():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request data is required"
        }), 400

    user_id = data.get("user_id")
    project_id = data.get("project_id")

    if not user_id or not project_id:
        return jsonify({
            "success": False,
            "message": "User and project are required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            INSERT INTO team_members
            (
                user_id,
                project_id
            )
            VALUES (%s, %s)
        """, (
            user_id,
            project_id
        ))

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Team member added successfully!"
        }), 201

    except Exception as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


@app.route("/api/team/members/<int:member_id>", methods=["PUT"])
def update_team_member(member_id):

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request data is required"
        }), 400

    user_id = data.get("user_id")
    project_id = data.get("project_id")

    if not user_id or not project_id:
        return jsonify({
            "success": False,
            "message": "User and project are required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            UPDATE team_members
            SET
                user_id = %s,
                project_id = %s
            WHERE id = %s
        """, (
            user_id,
            project_id,
            member_id
        ))

        if cursor.rowcount == 0:
            connection.rollback()

            return jsonify({
                "success": False,
                "message": "Team assignment not found"
            }), 404

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Team assignment updated successfully!"
        }), 200

    except Exception as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


@app.route("/api/team/members/<int:member_id>", methods=["DELETE"])
def delete_team_member(member_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            DELETE FROM team_members
            WHERE id = %s
        """, (member_id,))

        if cursor.rowcount == 0:
            connection.rollback()

            return jsonify({
                "success": False,
                "message": "Team assignment not found"
            }), 404

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Team assignment deleted successfully!"
        }), 200

    except Exception as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


# =========================================================
# NOTIFICATIONS
# =========================================================

@app.route("/api/notifications/check-deadlines", methods=["POST"])
def check_deadline_notifications():

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        today = date.today()
        tomorrow = today + timedelta(days=1)

        reminders_created = 0

        # Check project deadlines
        cursor.execute("""
            SELECT id, name, deadline
            FROM projects
            WHERE deadline IS NOT NULL
              AND DATE(deadline) BETWEEN %s AND %s
        """, (today, tomorrow))

        projects = cursor.fetchall()

        for project in projects:
            deadline = project["deadline"]
            deadline_date = deadline.date() if hasattr(deadline, "date") else deadline

            if deadline_date == today:
                message = f'Project "{project["name"]}" is due today!'
            else:
                message = f'Project "{project["name"]}" is due tomorrow!'

            cursor.execute("""
                SELECT id
                FROM notifications
                WHERE user_id = %s
                  AND message = %s
                  AND type = %s
                LIMIT 1
            """, (2, message, "deadline"))

            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO notifications
                        (user_id, message, type, is_read)
                    VALUES (%s, %s, %s, %s)
                """, (2, message, "deadline", 0))
                reminders_created += 1

        # Check task deadlines
        cursor.execute("""
            SELECT id, title, due_date, assigned_to
            FROM tasks
            WHERE due_date IS NOT NULL
              AND DATE(due_date) BETWEEN %s AND %s
        """, (today, tomorrow))

        tasks = cursor.fetchall()

        for task in tasks:
            due_date = task["due_date"]
            due_date = due_date.date() if hasattr(due_date, "date") else due_date

            if due_date == today:
                message = f'Task "{task["title"]}" is due today!'
            else:
                message = f'Task "{task["title"]}" is due tomorrow!'

            # Notify Admin
            recipients = {2}

            # Also notify the assigned user, if any
            if task["assigned_to"]:
                recipients.add(task["assigned_to"])

            for user_id in recipients:
                cursor.execute("""
                    SELECT id
                    FROM notifications
                    WHERE user_id = %s
                      AND message = %s
                      AND type = %s
                    LIMIT 1
                """, (user_id, message, "deadline"))

                if not cursor.fetchone():
                    cursor.execute("""
                        INSERT INTO notifications
                            (user_id, message, type, is_read)
                        VALUES (%s, %s, %s, %s)
                    """, (user_id, message, "deadline", 0))
                    reminders_created += 1

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Deadline reminders checked successfully",
            "reminders_created": reminders_created
        }), 200

    except Exception as e:
        connection.rollback()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


@app.route("/api/notifications", methods=["GET"])
def get_all_notifications():

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                id,
                user_id,
                message,
                type,
                is_read,
                created_at
            FROM notifications
            ORDER BY created_at DESC
        """)

        notifications = cursor.fetchall()

        return jsonify(notifications), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


@app.route("/api/notifications/<int:user_id>", methods=["GET"])
def get_user_notifications(user_id):

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                id,
                user_id,
                message,
                type,
                is_read,
                created_at
            FROM notifications
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id,))

        notifications = cursor.fetchall()

        return jsonify({
            "success": True,
            "notifications": notifications
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


@app.route("/api/notifications", methods=["POST"])
def create_notification():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request data is required"
        }), 400

    user_id = data.get("user_id")
    message = data.get("message")
    notification_type = data.get("type", "info")

    if not user_id or not message:
        return jsonify({
            "success": False,
            "message": "User ID and message are required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            INSERT INTO notifications
            (
                user_id,
                message,
                type,
                is_read
            )
            VALUES (%s, %s, %s, %s)
        """, (
            user_id,
            message,
            notification_type,
            0
        ))

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Notification created successfully!"
        }), 201

    except Exception as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


@app.route(
    "/api/notifications/<int:notification_id>/read",
    methods=["PUT"]
)
def mark_notification_read(notification_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            UPDATE notifications
            SET is_read = 1
            WHERE id = %s
        """, (notification_id,))

        if cursor.rowcount == 0:
            connection.rollback()

            return jsonify({
                "success": False,
                "message": "Notification not found"
            }), 404

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Notification marked as read!"
        }), 200

    except Exception as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


@app.route(
    "/api/notifications/<int:notification_id>",
    methods=["DELETE"]
)
def delete_notification(notification_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            DELETE FROM notifications
            WHERE id = %s
        """, (notification_id,))

        if cursor.rowcount == 0:
            connection.rollback()

            return jsonify({
                "success": False,
                "message": "Notification not found"
            }), 404

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Notification deleted successfully!"
        }), 200

    except Exception as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


# =========================================================
# ANALYTICS API
# =========================================================

@app.route("/api/analytics", methods=["GET"])
def get_analytics():

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT COUNT(*) AS total_projects
            FROM projects
        """)
        total_projects = cursor.fetchone()["total_projects"]

        cursor.execute("""
            SELECT COUNT(*) AS active_projects
            FROM projects
            WHERE status = 'Active'
        """)
        active_projects = cursor.fetchone()["active_projects"]

        cursor.execute("""
            SELECT COUNT(*) AS completed_projects
            FROM projects
            WHERE status = 'Completed'
        """)
        completed_projects = cursor.fetchone()["completed_projects"]

        cursor.execute("""
            SELECT COUNT(*) AS total_tasks
            FROM tasks
        """)
        total_tasks = cursor.fetchone()["total_tasks"]

        cursor.execute("""
            SELECT COUNT(*) AS completed_tasks
            FROM tasks
            WHERE status = 'Completed'
        """)
        completed_tasks = cursor.fetchone()["completed_tasks"]

        cursor.execute("""
            SELECT COUNT(DISTINCT user_id) AS team_members
            FROM team_members
        """)
        team_members = cursor.fetchone()["team_members"]

        pending_tasks = total_tasks - completed_tasks

        if total_tasks > 0:

            completed_percent = round(
                (completed_tasks / total_tasks) * 100
            )

            pending_percent = round(
                (pending_tasks / total_tasks) * 100
            )

        else:

            completed_percent = 0
            pending_percent = 0

        return jsonify({
            "success": True,
            "total_projects": total_projects,
            "active_projects": active_projects,
            "completed_projects": completed_projects,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks,
            "team_members": team_members,
            "completed_percent": completed_percent,
            "pending_percent": pending_percent
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


# =========================================================
# DASHBOARD RECENT DATA
# =========================================================

@app.route("/api/dashboard/recent", methods=["GET"])
def get_recent_dashboard_data():

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                id,
                name,
                status,
                progress,
                deadline,
                created_at
            FROM projects
            ORDER BY created_at DESC
            LIMIT 5
        """)

        recent_projects = cursor.fetchall()

        cursor.execute("""
            SELECT
                tasks.id,
                tasks.title,
                tasks.status,
                tasks.priority,
                tasks.due_date,
                projects.name AS project_name,
                users.name AS assigned_user
            FROM tasks
            LEFT JOIN projects
                ON tasks.project_id = projects.id
            LEFT JOIN users
                ON tasks.assigned_to = users.id
            ORDER BY tasks.created_at DESC
            LIMIT 5
        """)

        recent_tasks = cursor.fetchall()

        return jsonify({
            "success": True,
            "projects": recent_projects,
            "tasks": recent_tasks
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        connection.close()


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":
    app.run(debug=True)