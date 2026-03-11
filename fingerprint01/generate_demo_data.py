import urllib.request
import json
import random
from datetime import datetime, timedelta
import time
import ssl

COMPANY_ID = "cf525652-0f91-4b11-93a1-3e08f1ed2977"
BASE_URL = "https://attendwatch.com/api/v1/attendance"
DAYS_TO_GENERATE = 30

def fetch_employees():
    url = f"{BASE_URL}/employees?companyId={COMPANY_ID}"
    req = urllib.request.Request(url)
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        with urllib.request.urlopen(req, context=ctx) as response:
            data = json.loads(response.read().decode())
            return data
    except Exception as e:
        print(f"Error fetching employees: {e}")
        return []

def post_log(employee_id, event_type, timestamp_str):
    url = f"{BASE_URL}/log"
    payload = {
        "companyId": COMPANY_ID,
        "employeeId": employee_id,
        "eventType": event_type,
        "deviceId": "DEMO-KIOSK",
        "confidenceScore": 100.0,
        "overrideTimestamp": timestamp_str
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        with urllib.request.urlopen(req, context=ctx) as response:
            return response.getcode() == 200
    except Exception as e:
        print(f"Failed to log {event_type} at {timestamp_str}: {e}")
        return False

def generate_data():
    employees = fetch_employees()
    if not employees:
        print("No employees found. Cannot generate data.")
        return
        
    print(f"Loaded {len(employees)} employees.")
    
    today = datetime.now()
    total_logs = 0
    
    # Go back 30 days
    for day_offset in range(DAYS_TO_GENERATE, 0, -1):
        current_date = today - timedelta(days=day_offset)
        
        # Skip Sundays (6 is Sunday in Python's weekday() where Monday is 0)
        # We can also skip some Saturdays randomly
        if current_date.weekday() == 6:
            continue
            
        if current_date.weekday() == 5 and random.random() > 0.3:
            continue # 70% chance to skip Saturdays
            
        print(f"Generating data for {current_date.strftime('%Y-%m-%d')}...")
        
        for emp in employees:
            # 10% chance an employee is absent on any given workday
            if random.random() < 0.10:
                continue
                
            emp_id = emp["id"]
            
            # Generate Clock In (Between 08:00 AM and 09:30 AM)
            in_hour = 8
            in_minute = random.randint(0, 59)
            if random.random() > 0.8:
                in_hour = 9 # Late arrivals sometimes
                in_minute = random.randint(0, 30)
                
            clock_in_time = current_date.replace(hour=in_hour, minute=in_minute, second=random.randint(0,59))
            
            # Format to ISO-8601 with Z
            in_str = clock_in_time.isoformat() + "Z"
            post_log(emp_id, "CLOCK_IN", in_str)
            total_logs += 1
            
            # 5% chance they forgot to clock out
            if random.random() < 0.05:
                continue
                
            # Generate Clock Out (Between 17:00 and 19:00)
            out_hour = 17
            out_minute = random.randint(0, 59)
            if random.random() > 0.5:
                out_hour = 18 # overtime
                out_minute = random.randint(0, 30)
                
            clock_out_time = current_date.replace(hour=out_hour, minute=out_minute, second=random.randint(0,59))
            
            out_str = clock_out_time.isoformat() + "Z"
            post_log(emp_id, "CLOCK_OUT", out_str)
            total_logs += 1
            
            # Sleep tiny bit to not overwhelm the server
            time.sleep(0.01)
            
    print(f"\nDone! Successfully injected {total_logs} realistic attendance logs.")

if __name__ == "__main__":
    generate_data()
