import mysql.connector

def get_db_connection():
    connection = mysql.connector.connect(
        host="localhost",
        port=3333,
        user="root",
        password="",
        database="nexora_db"
    )

    return connection