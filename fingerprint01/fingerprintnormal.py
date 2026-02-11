import os, time, sqlite3, ctypes, hashlib, threading, base64, urllib.request, json, winsound
from datetime import datetime, date
import numpy as np
import cv2
import tkinter as tk
from tkinter import ttk, messagebox
from PIL import Image, ImageTk

# ---- Firebase (added) ----
FIREBASE_ERROR = None
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_OK = True
except Exception as e:
    FIREBASE_OK = False
    FIREBASE_ERROR = str(e)
    print(f"DEBUG: Firebase import failed: {e}")


# ----------------CONFIG----------------
# DLL Path Resolution for PyInstaller
def get_dll_path(dll_name):
    # Potential paths to check
    paths_to_check = [
        dll_name, # Current directory
        os.path.join(os.path.dirname(__file__), dll_name), # Script directory
    ]
    
    if getattr(sys, 'frozen', False):
        # PyInstaller paths
        base_dir = os.path.dirname(sys.executable)
        paths_to_check.append(os.path.join(base_dir, dll_name)) # Root next to exe
        paths_to_check.append(os.path.join(base_dir, '_internal', dll_name)) # Inside _internal
        if hasattr(sys, '_MEIPASS'):
             paths_to_check.append(os.path.join(sys._MEIPASS, dll_name))

    # Add the directory of the found DLL to the system DLL search path
    # This fixes the issue where ID_FprCap.dll cannot find ZhiAngCamera.dll dependencies
    for p in paths_to_check:
        if os.path.exists(p):
            dll_dir = os.path.dirname(os.path.abspath(p))
            try:
                os.add_dll_directory(dll_dir)
                print(f"DEBUG: Added DLL directory: {dll_dir}")
            except Exception as e:
                print(f"DEBUG: Could not add DLL directory (might be < Py3.8): {e}")
            return p
            
    # Fallback to simple name (let OS find it)
    return dll_name

def get_resource_path(filename):
    """Helper to find non-DLL resources like JSON files"""
    paths_to_check = [
        filename, # Current directory
        os.path.join(os.path.dirname(__file__), filename), # Script directory
    ]
    
    if getattr(sys, 'frozen', False):
        # PyInstaller paths
        base_dir = os.path.dirname(sys.executable)
        paths_to_check.append(os.path.join(base_dir, filename)) # Root next to exe
        paths_to_check.append(os.path.join(base_dir, '_internal', filename)) # Inside _internal
        if hasattr(sys, '_MEIPASS'):
             paths_to_check.append(os.path.join(sys._MEIPASS, filename))

    for p in paths_to_check:
        if os.path.exists(p):
            return p
            
    return filename

CAPTURE_DLL = get_dll_path("ID_FprCap.dll")
ZHIANG_DLL = get_dll_path("ZhiAngCamera.dll") # Assuming this is also used

SERVICE_KEY = get_resource_path("serviceAccountKey.json")
DEVICE_CH = 0
DEVICE_ID = "PC_SCANNER_01"
# Hardcoded Company ID for Kiosk (Fallback)
FALLBACK_COMPANY_ID = "cf525652-0f91-4b11-93a1-3e08f1ed2977"
COMPANY_ID = FALLBACK_COMPANY_ID

import sys
import urllib.parse

# Parse command line arguments for companyId
# Expected arg: fingerprint://enroll?employeeCode=...&name=...&companyId=...
if len(sys.argv) > 1:
    try:
        url_arg = sys.argv[1]
        print(f"DEBUG: Received URL arg: {url_arg}")
        # Remove protocol if present
        if "://" in url_arg:
             query_part = url_arg.split("?", 1)[1] if "?" in url_arg else ""
        else:
             query_part = url_arg
        
        params = urllib.parse.parse_qs(query_part)
        if "companyId" in params:
            cid = params["companyId"][0]
            if cid and len(cid) > 10: # Basic validation
                COMPANY_ID = cid
                print(f"DEBUG: Using Company ID from args: {COMPANY_ID}")
    except Exception as e:
        print(f"DEBUG: Error parsing args: {e}")
IMG_W = 256
IMG_H = 360
IMG_SIZE = IMG_W * IMG_H

# --- Database Path Fix for Windows Installer ---
# Determine AppData path for writable database
import shutil

APP_NAME = "AttendWatchFingerprint"
if os.name == 'nt':
    app_data_dir = os.path.join(os.getenv('APPDATA'), APP_NAME)
else:
    app_data_dir = os.path.join(os.path.expanduser('~'), '.attendwatch')

if not os.path.exists(app_data_dir):
    try:
        os.makedirs(app_data_dir)
        print(f"DEBUG: Created AppData directory: {app_data_dir}")
    except OSError as e:
        print(f"DEBUG: Failed to create AppData directory: {e}")

# Define writable DB path
DB_FILE = os.path.join(app_data_dir, "fp_local.db")

# Logic to copy bundled DB to writable location on first run
# Check if we are running frozen (PyInstaller)
if getattr(sys, 'frozen', False):
    bundled_db_path = os.path.join(sys._MEIPASS, "fp_local.db")
else:
    bundled_db_path = "fp_local.db" # Dev mode

# If writable DB doesn't exist, copy from bundle (or create empty if bundle missing)
if not os.path.exists(DB_FILE):
    if os.path.exists(bundled_db_path):
        try:
            shutil.copy2(bundled_db_path, DB_FILE)
            print(f"DEBUG: Copied bundled DB to {DB_FILE}")
        except Exception as e:
            print(f"DEBUG: Failed to copy DB: {e}")
    else:
        print("DEBUG: No bundled DB found, a new empty one will be created.")

print(f"DEBUG: Database path set to: {DB_FILE}")

# SOFTER PRESSURE (light touch, not hard press)
MIN_QUALITY = 30  # Increased to filter noise
PRESSURE_TARGET_MEAN = (60, 150)  # Extended range for all finger sizes
STABLE_FRAMES = 2  # Faster stabilization
STABLE_DIFF_MAX = 5.0  # More tolerance for small fingers
# INCREASED THRESHOLD to prevent ghost touches (Auto-Taking Fix)
FINGER_PRESENT_STD = 45  # Increased from 35. Higher = Needs clearer finger image to trigger
FINGER_REMOVED_STD = 20  # Increased from 15
DUPLICATE_MD5_BLOCK_SEC = 2.0
SCORE_ACCEPT = 20  # Lower threshold
ROTATION_TESTS = [-10, -5, 0, 5, 10]
ALLOW_ONE_MARK_PER_DAY = True
COOLDOWN_SECONDS = 30
WARMUP_SEC = 1.5 # Ignore frames for first 1.5s to clear buffer

# -------COLORS------- (Enhanced Modern Palette)
BG_DARK = "#0a0e27"
BG_CARD = "#1a1f3a"
BG_CARD_LIGHT = "#252b4a"
PRIMARY = "#00d4ff"
PRIMARY_DARK = "#0099cc"
SUCCESS = "#00ff88"
SUCCESS_DARK = "#00cc6a"
WARNING = "#ffaa00"
WARNING_DARK = "#cc8800"
ERROR = "#ff4444"
ERROR_DARK = "#cc3333"
TEXT_LIGHT = "#e0e6ed"
TEXT_MUTED = "#8a92a0"
ACCENT_PURPLE = "#a855f7"
ACCENT_BLUE = "#3b82f6"

# ---HELPER FUNCS---
def now_iso():
    return datetime.now().isoformat(timespec="seconds")

def md5_bytes(b: bytes) -> str:
    return hashlib.md5(b).hexdigest()

def raw_to_gray(raw: bytes) -> np.ndarray:
    return np.frombuffer(raw, dtype=np.uint8).reshape((IMG_H, IMG_W))

def img_std(gray: np.ndarray) -> float:
    return float(gray.std())

def quality_score(gray: np.ndarray) -> int:
    lap = cv2.Laplacian(gray, cv2.CV_64F)
    v = float(lap.var())
    return int(min(100, max(0, v / 20.0)))

def preprocess(gray: np.ndarray) -> np.ndarray:
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    g = clahe.apply(gray)
    g = cv2.GaussianBlur(g, (3, 3), 0)
    blur = cv2.GaussianBlur(g, (0, 0), 1.0)
    sharp = cv2.addWeighted(g, 1.6, blur, -0.6, 0)
    return sharp

def center_crop(gray: np.ndarray) -> np.ndarray:
    h, w = gray.shape
    x0 = int(w * 0.10); x1 = int(w * 0.90)
    y0 = int(h * 0.08); y1 = int(h * 0.92)
    return gray[y0:y1, x0:x1]

def rotate_img(gray: np.ndarray, deg: float) -> np.ndarray:
    h, w = gray.shape
    M = cv2.getRotationMatrix2D((w/2, h/2), deg, 1.0)
    return cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=255)

def extract_orb_bytes(gray: np.ndarray) -> bytes:
    orb = cv2.ORB_create(nfeatures=900, scaleFactor=1.2, nlevels=8, edgeThreshold=15, patchSize=31)
    kp, des = orb.detectAndCompute(gray, None)
    if des is None or len(des) == 0:
        return b""
    return des.tobytes()

def bytes_to_des(blob: bytes):
    if not blob:
        return None
    arr = np.frombuffer(blob, dtype=np.uint8)
    if arr.size % 32 != 0:
        return None
    return arr.reshape((-1, 32))

def match_score(desA, desB) -> int:
    if desA is None or desB is None or len(desA) < 10 or len(desB) < 10:
        return 0
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = bf.match(desA, desB)
    if not matches:
        return 0
    good = [m for m in matches if m.distance <= 50]
    return len(good)

def identify_best(probe_gray: np.ndarray, rows):
    probe_gray = preprocess(center_crop(probe_gray))
    best_uid, best_name, best_score = None, None, 0
    probe_descs = []
    for deg in ROTATION_TESTS:
        g = rotate_img(probe_gray, deg)
        des = bytes_to_des(extract_orb_bytes(g))
        probe_descs.append(des)
    for uid, name, tpl_blob in rows:
        db_des = bytes_to_des(tpl_blob)
        if db_des is None:
            continue
        s = 0
        for pdes in probe_descs:
            s = max(s, match_score(pdes, db_des))
        if s > best_score:
            best_score = s
            best_uid, best_name = uid, name
    return best_uid, best_name, best_score

# --------DB--------
class DB:
    def __init__(self, path: str):
        self.path = path
        self.init()

    def init(self):
        con = sqlite3.connect(self.path)
        cur = con.cursor()
        cur.execute("CREATE TABLE IF NOT EXISTS users (uid TEXT PRIMARY KEY, name TEXT)")
        cur.execute("""CREATE TABLE IF NOT EXISTS templates(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uid TEXT NOT NULL,
            tpl BLOB NOT NULL,
            created_at TEXT NOT NULL
        )""")
        cur.execute("""CREATE TABLE IF NOT EXISTS attendance(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT NOT NULL,
            uid TEXT,
            name TEXT,
            score INTEGER,
            result TEXT NOT NULL
        )""")
        con.commit()
        con.close()

    def upsert_user(self, uid, name):
        con = sqlite3.connect(self.path)
        cur = con.cursor()
        cur.execute("INSERT OR REPLACE INTO users(uid,name) VALUES(?,?)", (uid, name))
        con.commit()
        con.close()

    def add_template(self, uid, tpl_bytes):
        con = sqlite3.connect(self.path)
        cur = con.cursor()
        cur.execute("INSERT INTO templates(uid,tpl,created_at) VALUES(?,?,?)", (uid, sqlite3.Binary(tpl_bytes), now_iso()))
        con.commit()
        con.close()

    def get_all_templates(self):
        con = sqlite3.connect(self.path)
        cur = con.cursor()
        cur.execute("""SELECT u.uid, u.name, t.tpl FROM templates t JOIN users u ON u.uid=t.uid""")
        rows = cur.fetchall()
        con.close()
        return rows

    def log_att(self, result, uid=None, name=None, score=None):
        con = sqlite3.connect(self.path)
        cur = con.cursor()
        cur.execute("INSERT INTO attendance(ts,uid,name,score,result) VALUES(?,?,?,?,?)", (now_iso(), uid, name, score, result))
        con.commit()
        con.close()

    def already_marked_today(self, uid):
        if not ALLOW_ONE_MARK_PER_DAY:
            return False
        con = sqlite3.connect(self.path)
        cur = con.cursor()
        today = date.today().isoformat()
        cur.execute("""SELECT 1 FROM attendance WHERE uid=? AND result='MATCH' AND substr(ts,1,10)=? LIMIT 1""", (uid, today))
        ok = cur.fetchone() is not None
        con.close()
        return ok

    def get_last_result(self, uid):
        con = sqlite3.connect(self.path)
        cur = con.cursor()
        # Get the very last event for this user
        cur.execute("""SELECT result FROM attendance WHERE uid=? ORDER BY id DESC LIMIT 1""", (uid,))
        row = cur.fetchone()
        con.close()
        return row[0] if row else None

# --------Firebase--------
class Fire:
    def __init__(self):
        self.db = None

    def connect(self):
        if not FIREBASE_OK:
            print(f"DEBUG: Firebase skipped. Reason: {FIREBASE_ERROR}")
            return "Library Missing: " + str(FIREBASE_ERROR)
        if not os.path.exists(SERVICE_KEY):
            print(f"DEBUG: Firebase skipped. Key file not found: {SERVICE_KEY}")
            return "Key File Missing"
        try:
            if not firebase_admin._apps:
                cred = credentials.Certificate(SERVICE_KEY)
                firebase_admin.initialize_app(cred)
            self.db = firestore.client()
            return "Connected"
        except Exception as e:
            self.db = None
            msg = str(e)
            if "invalid_grant" in msg or "JWT Signature" in msg:
                msg += " (PLEASE ADJUST YOUR PC CLOCK)"
            print(f"DEBUG: Firebase init failed: {msg}")
            return f"Init Error: {msg}"


    def push_user(self, uid, name):
        if not self.db:
            return
        self.db.collection("users").document(uid).set({"name": name, "updated_at": now_iso()}, merge=True)

    def push_template(self, uid, tpl_bytes):
        if not self.db:
            return
        self.db.collection("templates").add({"uid": uid, "tpl_b64": base64.b64encode(tpl_bytes).decode("utf-8"), "created_at": now_iso()})

    def push_attendance(self, uid, name, score, result):
        if not self.db:
            return
        self.db.collection("attendance").add({"uid": uid, "name": name, "score": int(score) if score is not None else None, "result": result, "device_id": DEVICE_ID, "ts": now_iso(), "unix": int(time.time())})

# --------CAPTURE--------
class Capture:
    def __init__(self):
        dll_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), CAPTURE_DLL)
        if not os.path.exists(dll_path):
            raise FileNotFoundError(dll_path)
        self.zk = ctypes.WinDLL(dll_path)
        if hasattr(self.zk, "LIVESCAN_Init"):
            self.zk.LIVESCAN_Init.restype = ctypes.c_int
            rc = int(self.zk.LIVESCAN_Init())
            if rc != 1:
                raise RuntimeError(f"LIVESCAN_Init failed rc={rc}")
        if hasattr(self.zk, "LIVESCAN_BeginCapture"):
            self.zk.LIVESCAN_BeginCapture.argtypes = [ctypes.c_int]
            self.zk.LIVESCAN_BeginCapture.restype = ctypes.c_int
            try:
                self.zk.LIVESCAN_BeginCapture(DEVICE_CH)
            except Exception:
                pass
        self.zk.LIVESCAN_GetFPRawData.argtypes = [ctypes.c_int, ctypes.POINTER(ctypes.c_ubyte)]
        self.zk.LIVESCAN_GetFPRawData.restype = ctypes.c_int
        self.buf = (ctypes.c_ubyte * IMG_SIZE)()

    def capture_raw(self, timeout=10.0):
        start = time.time()
        while time.time() - start < timeout:
            rc = int(self.zk.LIVESCAN_GetFPRawData(DEVICE_CH, self.buf))
            if rc == 1:
                return bytes(self.buf)
            time.sleep(0.04)
        return None

# --------MODERN UI--------
class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("AttendWatch Fingerprint System")
        self.geometry("1200x750")
        self.configure(bg=BG_DARK)
        
        self.db = DB(DB_FILE)
        self.fire = Fire()
        fb_status = self.fire.connect()
        print(f"DEBUG: Firebase Status: {fb_status}")
        
        self.status = tk.StringVar(value="Ready")
        self.result = tk.StringVar(value="")
        self._imgtk = None
        self.last_md5 = None
        self.last_md5_time = 0.0
        self.ready_time = time.time() + WARMUP_SEC # Wait for camera buffer to clear
        self.attendance_on = False
        self.cooldown_uid = {}
        
        self.emp_map = {} # Code -> Name
        self.emp_codes = []
        self.current_mode = tk.StringVar(value="IDLE")
        self.fetch_employees()
        
        self._build_ui()
        
        try:
            self.cap = Capture()
            self.update_status("✓ Device Ready", "green")
        except Exception as e:
            self.cap = None
            self.update_status(f"✗ {str(e)}", "red")
            messagebox.showerror("Init Error", str(e))
        
        # Log firebase status
        if self.fire.db:
            self.log("✓ Firebase Connected")
        else:
            self.log(f"⚠ Firebase Disconnected: {fb_status}")


    def update_status(self, msg: str, color: str = "cyan"):
        self.after(0, lambda: self._update_status_ui(msg, color))

    def _update_status_ui(self, msg: str, color: str):
        self.status.set(msg)
        color_map = {"green": SUCCESS, "red": ERROR, "cyan": PRIMARY, "yellow": WARNING}
        self.status_label.configure(foreground=color_map.get(color, PRIMARY))
    
    def update_progress(self, index: int, completed: bool):
        """Update enrollment progress indicator"""
        def _update():
            if 0 <= index < len(self.progress_labels):
                if completed:
                    self.progress_labels[index].configure(text="✓", fg=SUCCESS)
                else:
                    self.progress_labels[index].configure(text="○", fg=TEXT_MUTED)
        self.after(0, _update)

    def log(self, msg: str):
        def _log():
            ts = time.strftime("%H:%M:%S")
            self.logbox.config(state="normal")
            self.logbox.insert("1.0", f"{ts} │ {msg}\n")
            self.logbox.config(state="disabled")
        self.after(0, _log)

    def _build_ui(self):
        # Header
        header = tk.Frame(self, bg=BG_DARK, height=60)
        header.pack(fill="x", padx=20, pady=(15, 10))
        header.pack_propagate(False)
        
        tk.Label(header, text="🔐 AttendWatch", font=("Segoe UI", 26, "bold"), fg=PRIMARY, bg=BG_DARK).pack(side="left")
        tk.Label(header, text="Fingerprint Enrollment", font=("Segoe UI", 14), fg=TEXT_MUTED, bg=BG_DARK).pack(side="left", padx=(10, 0))
        
        # Mode indicator
        self.mode_label = tk.Label(header, textvariable=self.current_mode, font=("Segoe UI", 11, "bold"), fg=WARNING, bg=BG_CARD_LIGHT, padx=15, pady=5, relief="flat")
        self.mode_label.pack(side="right", padx=(10, 0))
        
        self.status_label = tk.Label(header, textvariable=self.status, font=("Segoe UI", 12, "bold"), fg=SUCCESS, bg=BG_DARK)
        self.status_label.pack(side="right")

        # Main content
        main = tk.Frame(self, bg=BG_DARK)
        main.pack(fill="both", expand=True, padx=20, pady=(10, 20))
        
        # Left panel - Enroll
        left = tk.Frame(main, bg=BG_CARD, relief="flat")
        left.pack(side="left", fill="y", padx=(0, 15))
        
        # Enrollment header
        enroll_header = tk.Frame(left, bg=BG_CARD)
        enroll_header.pack(fill="x", padx=15, pady=(15, 10))
        tk.Label(enroll_header, text="👤 ENROLL NEW USER", font=("Segoe UI", 14, "bold"), fg=PRIMARY, bg=BG_CARD).pack(anchor="w")
        tk.Label(enroll_header, text="Register fingerprint for employee", font=("Segoe UI", 9), fg=TEXT_MUTED, bg=BG_CARD).pack(anchor="w", pady=(2, 0))
        
        self.uid = tk.StringVar()
        self.name = tk.StringVar()
        
        # Employee Code label
        tk.Label(left, text="Employee Code", font=("Segoe UI", 10, "bold"), fg=TEXT_LIGHT, bg=BG_CARD).pack(anchor="w", padx=15, pady=(15, 2))
        
        # Container for Combobox and Refresh Button
        id_frame = tk.Frame(left, bg=BG_CARD)
        id_frame.pack(anchor="w", padx=15, pady=(0, 5), fill="x")
        
        self.uid_cb = ttk.Combobox(id_frame, textvariable=self.uid, font=("Segoe UI", 10), width=23, postcommand=self.on_combo_open)
        self.uid_cb.pack(side="left", fill="x", expand=True)
        self.uid_cb.bind('<<ComboboxSelected>>', self.on_employee_select)
        self.uid_cb.bind('<KeyRelease>', self.on_combo_filter)
        
        # Add trace to auto-fetch name when employee code changes
        self.uid.trace_add('write', lambda *args: self.auto_fetch_name())
        
        btn_refresh = tk.Button(id_frame, text="⟳", command=self.refresh_employees, font=("Segoe UI", 10), bg="#252d38", fg=TEXT_LIGHT, relief="flat", bd=0, width=3, cursor="hand2")
        btn_refresh.pack(side="left", padx=(5, 0))
        
        if hasattr(self, 'emp_codes'):
             self.uid_cb['values'] = self.emp_codes

        # Full Name (Auto-filled)
        tk.Label(left, text="Full Name", font=("Segoe UI", 10), fg=TEXT_LIGHT, bg=BG_CARD).pack(anchor="w", padx=15, pady=(10, 3))
        self.txt_name = tk.Entry(left, textvariable=self.name, font=("Segoe UI", 10), width=28, bg="#252d38", fg=TEXT_LIGHT, relief="flat", bd=1)
        self.txt_name.pack(anchor="w", padx=15, pady=(0, 5))
        
        self.btn_enroll = tk.Button(left, text="▶ Enroll (3 scans)", command=self.enroll, font=("Segoe UI", 11, "bold"), bg=PRIMARY, fg=BG_DARK, activebackground="#00ffff", relief="flat", bd=0, padx=15, pady=10, cursor="hand2")
        self.btn_enroll.pack(fill="x", padx=15, pady=(15, 10))
        
        # Enrollment progress indicator
        progress_frame = tk.Frame(left, bg=BG_CARD)
        progress_frame.pack(fill="x", padx=15, pady=(10, 20))
        
        tk.Label(progress_frame, text="Progress:", font=("Segoe UI", 9), fg=TEXT_MUTED, bg=BG_CARD).pack(side="left", padx=(0, 10))
        
        self.progress_labels = []
        for i in range(3):
            lbl = tk.Label(progress_frame, text="○", font=("Segoe UI", 14), fg=TEXT_MUTED, bg=BG_CARD)
            lbl.pack(side="left", padx=2)
            self.progress_labels.append(lbl)
        
        tk.Frame(left, bg=TEXT_MUTED, height=1).pack(fill="x", padx=15, pady=10)

        # Middle panel - Attendance
        mid = tk.Frame(main, bg=BG_CARD, relief="flat")
        mid.pack(side="left", fill="y", padx=(0, 15))
        
        tk.Label(mid, text="ATTENDANCE", font=("Segoe UI", 13, "bold"), fg=SUCCESS, bg=BG_CARD).pack(anchor="w", padx=15, pady=(15, 15))
        
        self.btn_start = tk.Button(mid, text="▶ Start Attendance Scan", command=self.start_attendance, font=("Segoe UI", 11, "bold"), bg=SUCCESS, fg="#0a0e27", activebackground=SUCCESS_DARK, relief="flat", bd=0, padx=20, pady=12, cursor="hand2", width=25)
        self.btn_start.pack(fill="x", padx=15, pady=(0, 10))
        
        self.btn_stop = tk.Button(mid, text="⏹ Stop Attendance Scan", command=self.stop_attendance, font=("Segoe UI", 11, "bold"), bg=ERROR, fg="white", activebackground=ERROR_DARK, relief="flat", bd=0, padx=20, pady=12, cursor="hand2", state="disabled", width=25)
        self.btn_stop.pack(fill="x", padx=15, pady=(0, 10))
        
        tk.Button(mid, text="🔍 Identify Once", command=self.identify_once, font=("Segoe UI", 11, "bold"), bg=WARNING, fg="#0a0e27", activebackground=WARNING_DARK, relief="flat", bd=0, padx=20, pady=12, cursor="hand2", width=25).pack(fill="x", padx=15, pady=(0, 20))
        
        tk.Frame(mid, bg=TEXT_MUTED, height=1).pack(fill="x", padx=15, pady=10)
        tk.Label(mid, text=f"Threshold: {SCORE_ACCEPT}", font=("Segoe UI", 9), fg=TEXT_MUTED, bg=BG_CARD).pack(anchor="w", padx=15)
        
        # Right panel - Preview + Log
        right = tk.Frame(main, bg=BG_CARD, relief="flat")
        right.pack(side="left", fill="both", expand=True)
        
        tk.Label(right, text="📷 LIVE PREVIEW", font=("Segoe UI", 13, "bold"), fg=PRIMARY, bg=BG_CARD).pack(anchor="w", padx=15, pady=(15, 10))
        
        self.img_label = tk.Label(right, bg="#1a1f26", width=400, height=280)
        self.img_label.pack(padx=15, pady=(0, 15), fill="both", expand=True)
        
        self.result_label = tk.Label(right, textvariable=self.result, font=("Segoe UI", 11), fg=TEXT_LIGHT, bg=BG_CARD, wraplength=400, justify="left")
        self.result_label.pack(anchor="w", padx=15, pady=(0, 15))
        
        tk.Label(right, text="📋 ACTIVITY LOG", font=("Segoe UI", 11, "bold"), fg=TEXT_MUTED, bg=BG_CARD).pack(anchor="w", padx=15)
        
        self.logbox = tk.Text(right, height=8, font=("Segoe UI", 9), bg="#1a1f26", fg=TEXT_LIGHT, relief="flat", bd=0, state="disabled")
        self.logbox.pack(fill="both", expand=True, padx=15, pady=(5, 15))

    def fetch_employees(self):
        try:
            print(f"Fetching employees from backend for Company {COMPANY_ID}...")
            # POINT TO REMOTE BACKEND
            url = f"http://165.232.174.162:8080/api/v1/attendance/employees?companyId={COMPANY_ID}"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req) as response:
                if response.getcode() == 200:
                    data = json.loads(response.read().decode())
                    # data = list of {code, name, id}
                    self.emp_map = {}
                    for e in data:
                        code = e['code']
                        self.emp_map[code] = {
                            "name": e['name'],
                            "id": e.get('id', "") # Backend must provide ID
                        }
                    self.emp_codes = list(self.emp_map.keys())
                    print(f"Fetched {len(self.emp_codes)} employees: {self.emp_codes}")
                    if hasattr(self, 'uid_cb') and self.uid_cb:
                        self.uid_cb['values'] = self.emp_codes
                    
                    if not self.emp_codes:
                        self.log("⚠ No employees found for this Company ID.")
                        # messagebox.showwarning("Config Warning", "No employees found. Check Company ID.")
                else:
                    print(f"Failed to fetch employees. Code: {response.getcode()}")
                    self.emp_codes = []
                    self.log(f"⚠ Fetch Failed: HTTP {response.getcode()}")
        except Exception as e:
            print(f"Error fetching employees: {e}")
            self.emp_codes = []
            self.log(f"⚠ Fetch Error: {str(e)}")

    def refresh_employees(self):
        self.fetch_employees()
        self.log(f"Refreshed: {len(self.emp_codes)} employees found")

    def on_employee_select(self, event=None):
        code = self.uid.get().strip()
        info = self.emp_map.get(code)
        if info:
            name = info["name"]
            self.name.set(name)
            self.log(f"Selected: {code} - {name}")
    
    def auto_fetch_name(self):
        """Automatically fetch name when employee code is entered"""
        code = self.uid.get().strip()
        info = self.emp_map.get(code)
        if info:
            name = info["name"]
            if self.name.get() != name:  # Only update if different
                self.name.set(name)
        elif self.name.get() != "": # Clear name if code is not found
            self.name.set("")

    def on_combo_filter(self, event):
        if event.keysym in ('Up', 'Down', 'Left', 'Right', 'Return', 'Tab'):
            return
        
        typed = self.uid.get().lower()
        if not typed:
            self.uid_cb['values'] = self.emp_codes
            return

        filtered = []
        for c in self.emp_codes:
            info = self.emp_map.get(c)
            name = info["name"] if info else ""
            if typed in c.lower() or typed in name.lower():
                filtered.append(c)
                
        self.uid_cb['values'] = filtered
        
        # Automatically show dropdown if there are results
        if filtered:
            try:
                self.uid_cb.event_generate('<Down>')
            except:
                pass

    def on_combo_open(self):
        # Reset to full list when clicking the arrow, unless there is text
        typed = self.uid.get().lower()
        if not typed:
             self.uid_cb['values'] = self.emp_codes

    def show_raw(self, raw: bytes):
        def _update_ui():
            try:
                img = Image.frombytes("L", (IMG_W, IMG_H), raw)
                img = img.resize((400, 570))
                self._imgtk = ImageTk.PhotoImage(img)
                self.img_label.configure(image=self._imgtk)
            except Exception as e:
                self.log(f"Image error: {e}")
        self.after(0, _update_ui)

    def _read_frame(self, timeout=1.2):
        if time.time() < self.ready_time:
            # Still warming up, ignore frames
            return None
            
        raw = self.cap.capture_raw(timeout=timeout)
        if raw is None:
            return None
        h = md5_bytes(raw)
        now = time.time()
        if self.last_md5 == h and (now - self.last_md5_time) < DUPLICATE_MD5_BLOCK_SEC:
            return None
        self.last_md5 = h
        self.last_md5_time = now
        return raw

    def _pressure_hint(self, gray: np.ndarray) -> str:
        # Simple heuristic
        m = gray.mean()
        if m < PRESSURE_TARGET_MEAN[0]:
            return "Press Harder"
        if m > PRESSURE_TARGET_MEAN[1]:
            return "Lift Slightly"
        return "Good Pressure"

    def wait_finger_removed(self, timeout=5.0):
        start = time.time()
        while time.time() - start < timeout:
            raw = self.cap.capture_raw(timeout=0.1)
            if raw is None:
                return True
            gray = raw_to_gray(raw)
            if img_std(gray) < FINGER_REMOVED_STD:
                return True
            self.result.set("Please lift finger...")
            time.sleep(0.1)
        return False

    def capture_when_stable_hold(self, timeout=20.0):
        self.update_status("Touch scanner lightly...", "cyan")
        start = time.time()
        best_img = None
        best_score = -1
        stable_count = 0
        
        while time.time() - start < timeout:
             raw = self._read_frame(timeout=0.1)
             if raw is None:
                 continue
             
             gray = raw_to_gray(raw)
             score = quality_score(gray)
             
             if score < MIN_QUALITY:
                 stable_count = 0
                 self.result.set(f"Quality Low: {score}/{MIN_QUALITY}")
                 continue
                 
             stable_count += 1
             self.result.set(f"Holding... {stable_count}/{STABLE_FRAMES}")
             
             if score > best_score:
                 best_score = score
                 best_img = raw
                 
             if stable_count >= STABLE_FRAMES:
                 return best_img
                 
        return best_img

    def enroll(self):
        if not self.cap:
            return
        
        def do_enroll():
            self.current_mode.set("📝 ENROLLMENT MODE")
            self.mode_label.configure(fg="white", bg=PRIMARY)
            uid = self.uid.get().strip()
            name = self.name.get().strip()
            if not uid or not name:
                messagebox.showwarning("Missing", "Enter User ID and Name")
                self.current_mode.set("IDLE")
                self.mode_label.configure(fg=WARNING, bg=BG_CARD_LIGHT)
                return

            try:
                tpls = []
                for stage in range(1, 4):
                    self.log(f"Stage {stage}/3: Position finger")
                    raw = self.capture_when_stable_hold(timeout=20.0)
                    if not raw:
                        self.log("Failed: No stable capture")
                        self.update_status("Ready", "cyan")
                        self.current_mode.set("IDLE")
                        self.mode_label.configure(fg=WARNING, bg=BG_CARD_LIGHT)
                        return
                    self.show_raw(raw)
                    gray = preprocess(center_crop(raw_to_gray(raw)))
                    blob = extract_orb_bytes(gray)
                    if not blob:
                        self.log("Failed: Could not extract features")
                        self.update_status("Ready", "cyan")
                        self.current_mode.set("IDLE")
                        self.mode_label.configure(fg=WARNING, bg=BG_CARD_LIGHT)
                        return
                    tpls.append(blob)
                    self.log(f"✓ Scan {stage}/3 captured")
                    
                    # Update progress indicator
                    self.update_progress(stage - 1, True)
                    
                    ok = self.wait_finger_removed(timeout=10.0)
                    if not ok:
                        self.log("Failed: Lift finger fully")
                        self.update_status("Ready", "cyan")
                        self.current_mode.set("IDLE")
                        self.mode_label.configure(fg=WARNING, bg=BG_CARD_LIGHT)
                        return

                self.db.upsert_user(uid, name)
                for b in tpls:
                    self.db.add_template(uid, b)
                self.db.log_att("ENROLL", uid=uid, name=name)

                if self.fire.db:
                    try:
                        self.fire.push_user(uid, name)
                        for b in tpls:
                            self.fire.push_template(uid, b)
                        self.log("✓ Synced to Firebase")
                    except Exception as e:
                        self.log(f"Firebase error: {e}")

                self.log(f"✓ Enrolled: {name}")
                self.result.set(f"✓ {name} enrolled successfully")
                self.update_status("Ready", "green")
                self.play_sound("ENROLLED")
                self.uid.set("")
                self.name.set("")
            except Exception as e:
                self.log(f"Error: {e}")
                self.update_status("Ready", "cyan")
            finally:
                self.current_mode.set("IDLE")
                self.mode_label.configure(fg=WARNING, bg=BG_CARD_LIGHT)
                # Reset progress indicators
                for i in range(3):
                    self.update_progress(i, False)

        threading.Thread(target=do_enroll, daemon=True).start()

    import os, time, sqlite3, ctypes, hashlib, threading, base64, urllib.request, json, winsound, subprocess

    def _cooldown_ok(self, uid: str) -> bool:
        nowu = int(time.time())
        last = self.cooldown_uid.get(uid, 0)
        if nowu - last < COOLDOWN_SECONDS:
            return False
        self.cooldown_uid[uid] = nowu
        return True

    def play_sound(self, category, text=None):
        def _play():
            # Import subprocess locally to ensure it is available
            import subprocess
            import os
            try:
                txt = ""
                if category == "IN":
                    txt = "Clocked In"
                elif category == "OUT":
                    txt = "Clocked Out"
                elif category == "ERROR":
                    txt = "Try Again"
                elif category == "ENROLLED":
                    txt = "Enrolled Successfully"
                
                if category == "IDENTIFIED" and text:
                     txt = f"Identified {text}"
                
                if txt:
                    print(f"DEBUG: Speaking {txt}")
                    # Use VBScript for reliable TTS on Windows
                    import tempfile
                    vbs_filename = f"tts_{int(time.time()*1000)}.vbs"
                    vbs_path = os.path.join(tempfile.gettempdir(), vbs_filename)
                    
                    vbs_content = f"""
Set sapi = CreateObject("SAPI.SpVoice")
On Error Resume Next
Set sapi.Voice = sapi.GetVoices.Item(1)
On Error Goto 0
sapi.Rate = 0
sapi.Volume = 100
sapi.Speak "{txt}"
"""
                    with open(vbs_path, "w") as f:
                        f.write(vbs_content)
                    
                    # Run and wait
                    subprocess.run(["cscript", "//Nologo", vbs_path], check=False, shell=True)
                    
                    # Cleanup
                    if os.path.exists(vbs_path):
                        os.remove(vbs_path)
                        
            except Exception as e:
                print(f"DEBUG: TTS Execution Failed: {e}")
                import winsound
                try:
                     winsound.Beep(1000, 500)
                except:
                    pass
        threading.Thread(target=_play, daemon=True).start()

    def post_attendance_to_backend(self, uid, event_type):
        """Send attendance log to Spring Boot Backend via REST API"""
        info = self.emp_map.get(uid)
        if not info:
            self.log("Skip Backend: Unknown UID")
            return

        emp_id = info.get("id")
        if not emp_id:
             self.log("Skip Backend: No UUID for Employee")
             return

        try:
             # URL = http://165.232.174.162:8080/api/v1/attendance/log
             url = "http://165.232.174.162:8080/api/v1/attendance/log"
             
             # Payload matches AttendanceRequest.java
             payload = {
                 "companyId": COMPANY_ID,
                 "employeeId": emp_id,
                 "eventType": event_type, # CLOCK_IN or CLOCK_OUT
                 "deviceId": DEVICE_ID,
                 "confidenceScore": 100.0,
                 "photoBase64": ""
             }
             
             data = json.dumps(payload).encode('utf-8')
             req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
             
             with urllib.request.urlopen(req) as response:
                 if response.getcode() == 200:
                     self.log(f"✓ Backend Synced: {event_type}")
                 else:
                     self.log(f"⚠ Backend Error: {response.getcode()}")

        except Exception as e:
             self.log(f"⚠ Backend Connection Failed: {e}")

    def _handle_result(self, uid, name, score):
        if uid and score >= SCORE_ACCEPT:
            if not self._cooldown_ok(uid):
                return
            
            # Toggle Logic
            last_res = self.db.get_last_result(uid)
            
            # Determine new state: If last was IN (MATCH/CLOCKED_IN), now is OUT (TIME_OFF). Else IN (CLOCKED_IN).
            if last_res in ["MATCH", "CLOCKED_IN"]:
                new_res = "TIME_OFF"
                event_type = "CLOCK_OUT" # Backend Enum
                msg_ui = f"✓ CLOCKED OUT: {name}"
                msg_status = f"✓ {name} Checked Out (Time Off)"
                color = WARNING # distinct color
                self.play_sound("OUT")
            else:
                new_res = "CLOCKED_IN"
                event_type = "CLOCK_IN" # Backend Enum
                msg_ui = f"✓ CLOCKED IN: {name}"
                msg_status = f"✓ Welcome, {name}! (Checked In)"
                color = SUCCESS
                self.play_sound("IN")

            self.db.log_att(new_res, uid=uid, name=name, score=score)
            self.log(msg_ui)
            self.result.set(msg_status)
            self.result_label.configure(fg=color)
            
            if self.fire.db:
                try:
                    self.fire.push_attendance(uid, name, score, new_res)
                    self.log(f"✓ Synced: {new_res}")
                except Exception as e:
                    self.log(f"FIREBASE FAILED: {str(e)[:30]}...")
            
            # 2. Try Backend API (Primary)
            threading.Thread(target=self.post_attendance_to_backend, args=(uid, event_type), daemon=True).start()
            
        else:
            self.db.log_att("NO_MATCH", score=score)
            self.log(f"✗ No match (score={score})")
            self.result.set(f"✗ Not recognized (score={score})")
            self.result_label.configure(fg=ERROR)
            self.play_sound("ERROR")

    def identify_once(self):
        if not self.cap:
            return
        
        # Set mode indicator
        self.current_mode.set("🔍 IDENTIFY MODE")
        self.mode_label.configure(fg="white", bg=ACCENT_BLUE)

        def worker():
            try:
                rows = self.db.get_all_templates()
                if not rows:
                    self.log("No users enrolled")
                    self.update_status("Ready", "cyan")
                    self.current_mode.set("IDLE")
                    self.mode_label.configure(fg=WARNING, bg=BG_CARD_LIGHT)
                    return
                raw = self.capture_when_stable_hold(timeout=20.0)
                if not raw:
                    self.log("No stable scan")
                    self.update_status("Ready", "cyan")
                    self.current_mode.set("IDLE")
                    self.mode_label.configure(fg=WARNING, bg=BG_CARD_LIGHT)
                    return
                self.show_raw(raw)
                uid, name, score = identify_best(raw_to_gray(raw), rows)
                
                if uid and score >= SCORE_ACCEPT:
                     self.log(f"Identified: {name}")
                     self.result.set(f"Identified: {name}")
                     self.result_label.configure(fg=SUCCESS)
                     self.play_sound("IDENTIFIED", text=name)
                else:
                     self.log("Not Identified")
                     self.result.set("Not Identified")
                     self.result_label.configure(fg=ERROR)
                     self.play_sound("ERROR")

                self.wait_finger_removed(timeout=6.0)
                self.update_status("Ready", "cyan")
            except Exception as e:
                self.log(f"Error: {e}")
                self.update_status("Ready", "cyan")
            finally:
                self.current_mode.set("IDLE")
                self.mode_label.configure(fg=WARNING, bg=BG_CARD_LIGHT)

        threading.Thread(target=worker, daemon=True).start()

    def start_attendance(self):
        self.current_mode.set("🔍 ATTENDANCE MODE")
        self.mode_label.configure(fg="white", bg=SUCCESS)
        if not self.cap:
            return
        if self.attendance_on:
            return
        self.attendance_on = True
        self.btn_start.configure(state="disabled")
        self.btn_stop.configure(state="normal")
        self.log("✓ Attendance mode ON")
        threading.Thread(target=self._attendance_loop, daemon=True).start()

    def stop_attendance(self):
        self.current_mode.set("IDLE")
        self.mode_label.configure(fg=WARNING, bg=BG_CARD_LIGHT)
        self.attendance_on = False
        self.btn_start.configure(state="normal")
        self.btn_stop.configure(state="disabled")
        self.update_status("Ready", "cyan")
        self.log("⏹ Attendance mode OFF")

    def _attendance_loop(self):
        while self.attendance_on:
            rows = self.db.get_all_templates()
            if not rows:
                self.update_status("No users enrolled", "yellow")
                time.sleep(0.8)
                continue
            raw = self.capture_when_stable_hold(timeout=1.2)
            if not raw:
                time.sleep(0.05)
                continue
            self.show_raw(raw)
            uid, name, score = identify_best(raw_to_gray(raw), rows)
            self._handle_result(uid, name, score)
            self.wait_finger_removed(timeout=12.0)
            time.sleep(0.15)
        self.update_status("Ready", "cyan")

if __name__ == "__main__":
    import sys
    from urllib.parse import urlparse, parse_qs
    
    app = App()
    
    # Check if launched with URL parameters
    if len(sys.argv) > 1:
        url = sys.argv[1]
        try:
            # Parse fingerprint://enroll?employeeCode=XXX&name=YYY
            parsed = urlparse(url)
            params = parse_qs(parsed.query)
            
            if 'employeeCode' in params:
                employee_code = params['employeeCode'][0]
                app.uid.set(employee_code)
                app.log(f"✓ Employee Code: {employee_code}")
            
            if 'name' in params:
                name = params['name'][0]
                app.name.set(name)
                app.log(f"✓ Employee Name: {name}")
            
            # Auto-focus on the enrollment section and highlight it
            app.log("━" * 40)
            app.log("🎯 READY FOR ENROLLMENT")
            app.log("Please place finger on scanner to begin")
            app.log("━" * 40)
            app.update_status("Ready to Enroll", "green")
            
            # Flash the enroll button to draw attention
            def flash_enroll():
                try:
                    app.btn_enroll.configure(bg=ACCENT_PURPLE)
                    app.after(300, lambda: app.btn_enroll.configure(bg=PRIMARY))
                    app.after(600, lambda: app.btn_enroll.configure(bg=ACCENT_PURPLE))
                    app.after(900, lambda: app.btn_enroll.configure(bg=PRIMARY))
                except:
                    pass
            app.after(500, flash_enroll)
        except Exception as e:
            app.log(f"⚠ URL parse error: {e}")
    
    app.mainloop()

