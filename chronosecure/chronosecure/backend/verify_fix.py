
import urllib.request
import json
import uuid
import datetime
import sys
import time

BASE_URL = "http://localhost:8080/api/v1"

def post(url, data, headers={}):
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json', **headers})
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Error {e.code} POST {url}: {e.read().decode('utf-8')}")
        raise
    except Exception as e:
        print(f"Connection Error POST {url}: {str(e)}")
        raise

def get(url, headers={}):
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Error {e.code} GET {url}: {e.read().decode('utf-8')}")
        raise
    except Exception as e:
        print(f"Connection Error GET {url}: {str(e)}")
        raise

def wait_for_server():
    print("Checking if server is ready...")
    for _ in range(30):
        try:
            # Check public endpoint
            with urllib.request.urlopen(f"{BASE_URL}/auth/signup", timeout=1) as response:
                pass # 405 Method Not Allowed implies server is UP
            return True
        except urllib.error.HTTPError as e:
            if e.code in [405, 404, 400]: # Server is responding
                return True
        except Exception:
            time.sleep(2)
            print(".", end="", flush=True)
    return False

# Mute ssl warnings if any (localhost)
# ssl._create_default_https_context = ssl._create_unverified_context

# 0. Wait for server
# if not wait_for_server():
#     print("\nServer not ready.")
#     sys.exit(1)

# 1. Signup
email = f"testadmin_{str(uuid.uuid4())[:8]}@chronosecure.com"
print(f"Signing up as {email}...")
signup_data = {
    "email": email,
    "password": "password123",
    "firstName": "Test",
    "lastName": "Admin",
    "companyName": "Test Company" + str(uuid.uuid4())[:8]
}

try:
    signup_res = post(f"{BASE_URL}/auth/signup", signup_data)
except Exception as e:
    print("Signup failed. Ensure server is running.")
    sys.exit(1)

token = signup_res.get('token')
company_id = signup_res.get('companyId')

if not token or not company_id:
    print("Failed to get token or companyId from signup response")
    print(signup_res)
    sys.exit(1)

print(f"Signup successful. Company ID: {company_id}")

headers = {"Authorization": f"Bearer {token}", "X-Company-Id": company_id}

# 2. Create Employee
print("Creating Employee...")
emp_code = f"E-{str(uuid.uuid4())[:8]}"
emp_data = {
    "employeeCode": emp_code,
    "firstName": "John",
    "lastName": "Doe",
    "grantBiometricConsent": True
}
try:
    emp_res = post(f"{BASE_URL}/employees", emp_data, headers)
    employee_id = emp_res['id']
    print(f"Employee created: {employee_id}")
except Exception:
    print("Employee creation failed.")
    sys.exit(1)

# 3. Create Time Off Request (Today)
today = datetime.date.today().isoformat()
print(f"Creating Time Off Request for {today}...")
time_off_data = {
    "employeeId": employee_id,
    "startDate": today,
    "endDate": today,
    "reason": "Sick Leave",
    "type": "SICK_LEAVE"
}

try:
    time_off_res = post(f"{BASE_URL}/time-off", time_off_data, headers)
    request_id = time_off_res['id']
    print(f"Time Off Request Created.")
except Exception:
    print("Time Off Request creation failed.")
    sys.exit(1)

# 4. Log Attendance
print("Logging Attendance to trigger invalidation...")
att_data = {
    "companyId": company_id,
    "employeeId": employee_id,
    "eventType": "CLOCK_IN",
    "confidenceScore": 0.95,
    "deviceId": "TEST_SCRIPT",
    "photoBase64": "" # Optional? Logic says if not empty checks liveness.
}

try:
    att_res = post(f"{BASE_URL}/attendance/log", att_data, headers)
    print(f"Attendance Logged: {att_res['id']}")
except Exception:
    print("Attendance Logging failed.")
    sys.exit(1)

# 5. Verify Time Off Status
print("Verifying Time Off Status...")
time.sleep(1) # Give DB a moment? Transaction should be immediate in same service call though.

try:
    all_requests = get(f"{BASE_URL}/time-off/requests", headers)
    my_req = next((r for r in all_requests if r['id'] == request_id), None)

    if my_req:
        print(f"Request ID: {my_req['id']}")
        print(f"Final Status: {my_req['status']}")
        print(f"Reason: {my_req.get('reason', '')}")
        
        if my_req['status'] == 'REJECTED':
            print("SUCCESS: Time Off Request was automatically REJECTED.")
        else:
            print(f"FAILURE: Status is {my_req['status']} (Expected REJECTED)")
            sys.exit(1)
    else:
        print("FAILURE: Request not found")
        sys.exit(1)

except Exception as e:
    print(f"Verification Check Failed: {e}")
    sys.exit(1)
