import firebase_admin
from firebase_admin import credentials, firestore
import json

try:
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred)
    db = firestore.client()

    print("\n--- Recent Attendance Records in Firebase ---")
    
    # Query the 10 most recent attendance records
    docs = db.collection('attendance').order_by('ts', direction=firestore.Query.DESCENDING).limit(10).stream()
    
    found = False
    for doc in docs:
        found = True
        data = doc.to_dict()
        print(f"Time: {data.get('ts')} | Employee Name: {data.get('name')} (Code: {data.get('uid')}) | Action: {data.get('result')} | Device: {data.get('device_id')}")
        
    if not found:
        print("No attendance records found.")
        
except Exception as e:
    print(f"Error connecting to Firebase: {e}")
