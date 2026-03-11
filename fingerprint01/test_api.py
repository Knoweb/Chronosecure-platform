import urllib.request
import json
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

url = "http://165.232.174.162:8080/api/v1/attendance/employees?companyId=245e58a5-37c3-4298-9363-16ffe32a4baa"
print(f"Fetching from: {url}")

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.getcode()}")
        data = response.read().decode()
        print(f"Response Body: {data}")
except Exception as e:
    print(f"Error: {e}")
