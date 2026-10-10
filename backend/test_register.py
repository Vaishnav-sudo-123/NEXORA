import requests

url = "http://127.0.0.1:5000/api/register"

data = {
    "name": "NEXORA Admin",
    "email": "admin@nexora.com",
    "password": "Admin@123"
}

response = requests.post(url, json=data)

print("Status:", response.status_code)
print("Response:", response.json())