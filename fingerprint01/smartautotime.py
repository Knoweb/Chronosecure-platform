import os, time, sqlite3, ctypes, hashlib, threading, base64
from datetime import datetime, date
import numpy as np
import cv2
import tkinter as tk
from tkinter import ttk, messagebox
from PIL import Image, ImageTk

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_OK = True
except Exception:
    FIREBASE_OK = False

CAPTURE_DLL = "ID_FprCap.dll"
SERVICE_KEY = "serviceAccountKey.json"
DEVICE_CH = 0
DEVICE_ID = "PC_SCANNER_01"
IMG_W = 256
IMG_H = 360
IMG_SIZE = IMG_W * IMG_H
DB_FILE = "fp_local.db"

MIN_QUALITY = 20
PRESSURE_TARGET_MEAN = (60, 150)
STABLE_FRAMES = 2
STABLE_DIFF_MAX = 5.0
FINGER_PRESENT_STD = 28
FINGER_REMOVED_STD = 14
DUPLICATE_MD5_BLOCK_SEC = 2.0
SCORE_ACCEPT = 20
ROTATION_TESTS = [-10, -5, 0, 5, 10]

BG_DARK = "#0f1419"
BG_CARD = "#1a1f26"
PRIMARY = "#00d4ff"
SUCCESS = "#00ff88"
WARNING = "#ffaa00"
ERROR = "#ff4444"
TEXT_LIGHT = "#e0e6ed"
TEXT_MUTED = "#8a92a0"

ATTENDANCE_EVENTS = {
    "CHECK_IN": {"label": "Check In", "color": "#00ff88", "message": "Good Morning! Welcome.", "emoji": "🌅"},
    "LUNCH_START": {"label": "Lunch Break", "color": "#ffaa00", "message": "Enjoy your lunch break!", "emoji": "🍽️"},
    "LUNCH_END": {"label": "Lunch Return", "color": "#00d4ff", "message": "Welcome back from lunch!", "emoji": "🔄"},
    "CHECK_OUT": {"label": "Check Out", "color": "#ff6b6b", "message": "Thank you! Have a great day.", "emoji": "👋"}
}

def now_iso():
    return datetime.now().isoformat(timespec="seconds")

def get_time_period():
    hour = datetime.now().hour
    if 5 <= hour < 12:
        return "CHECK_IN"
    elif 12 <= hour < 14:
        return "LUNCH_START"
    elif 14 <= hour < 18:
        return "LUNCH_END"
    else:
        return "CHECK_OUT"

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

class DB:
    def __init__(self, path: str):
        self.path = path
        self.init()

    def init(self):
        con = sqlite3.connect(self.path)
        cur = con.cursor()
        cur.execute("CREATE TABLE IF NOT EXISTS users (uid TEXT PRIMARY KEY, name TEXT)")
        cur.execute("""CREATE TABLE IF NOT EXISTS templates(
            id INTEGER PRIMARY KEY AUTOINCREMENT, uid TEXT NOT NULL, tpl BLOB NOT NULL, created_at TEXT NOT NULL)""")
        cur.execute("""CREATE TABLE IF NOT EXISTS attendance(
            id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT NOT NULL, uid TEXT, name TEXT, score INTEGER, result TEXT NOT NULL, event_type TEXT DEFAULT 'CHECK_IN')""")
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
        cur.execute("SELECT u.uid, u.name, t.tpl FROM templates t JOIN users u ON u.uid=t.uid")
        rows = cur.fetchall()
        con.close()
        return rows

    def log_att(self, result, uid=None, name=None, score=None, event_type="CHECK_IN"):
        con = sqlite3.connect(self.path)
        cur = con.cursor()
        cur.execute("INSERT INTO attendance(ts,uid,name,score,result,event_type) VALUES(?,?,?,?,?,?)", 
                   (now_iso(), uid, name, score, result, event_type))
        con.commit()
        con.close()

class Fire:
    def __init__(self):
        self.db = None

    def connect(self):
        if not FIREBASE_OK or not os.path.exists(SERVICE_KEY):
            return
        try:
            if not firebase_admin._apps:
                cred = credentials.Certificate(SERVICE_KEY)
                firebase_admin.initialize_app(cred)
            self.db = firestore.client()
        except Exception:
            self.db = None

    def push_user(self, uid, name):
        if not self.db:
            return
        self.db.collection("users").document(uid).set({"name": name, "updated_at": now_iso()}, merge=True)

    def push_template(self, uid, tpl_bytes):
        if not self.db:
            return
        self.db.collection("templates").add({"uid": uid, "tpl_b64": base64.b64encode(tpl_bytes).decode("utf-8"), "created_at": now_iso()})

    def push_attendance(self, uid, name, score, result, event_type):
        if not self.db:
            return
        self.db.collection("attendance").add({
            "uid": uid, "name": name, "score": int(score) if score else None,
            "result": result, "event_type": event_type, "device_id": DEVICE_ID,
            "ts": now_iso(), "unix": int(time.time())
        })

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

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Industrial Attendance System")
        self.geometry("1400x850")
        self.configure(bg=BG_DARK)
        
        self.db = DB(DB_FILE)
        self.fire = Fire()
        self.fire.connect()
        
        self.status = tk.StringVar(value="Ready")
        self.result = tk.StringVar(value="")
        self.event_message = tk.StringVar(value="")
        self._imgtk = None
        self.last_md5 = None
        self.last_md5_time = 0.0
        self.attendance_on = False
        self.last_uid_time = {}
        
        self._build_ui()
        
        try:
            self.cap = Capture()
            self.update_status("✓ Device Ready", "green")
        except Exception as e:
            self.cap = None
            self.update_status(f"✗ {str(e)}", "red")
            messagebox.showerror("Init Error", str(e))

    def update_status(self, msg: str, color: str = "cyan"):
        self.after(0, lambda: self._update_status_ui(msg, color))

    def _update_status_ui(self, msg: str, color: str):
        self.status.set(msg)
        color_map = {"green": SUCCESS, "red": ERROR, "cyan": PRIMARY, "yellow": WARNING}
        self.status_label.configure(foreground=color_map.get(color, PRIMARY))

    def log(self, msg: str):
        def _log():
            ts = time.strftime("%H:%M:%S")
            self.logbox.config(state="normal")
            self.logbox.insert("1.0", f"{ts} │ {msg}\n")
            self.logbox.config(state="disabled")
        self.after(0, _log)

    def _build_ui(self):
        header = tk.Frame(self, bg=BG_DARK, height=80)
        header.pack(fill="x", padx=20, pady=(15, 10))
        header.pack_propagate(False)
        
        tk.Label(header, text="🏭 INDUSTRIAL", font=("Segoe UI", 28, "bold"), fg=PRIMARY, bg=BG_DARK).pack(side="left", anchor="w")
        tk.Label(header, text="ATTENDANCE", font=("Segoe UI", 28), fg=TEXT_LIGHT, bg=BG_DARK).pack(side="left", padx=(5, 0), anchor="w")
        
        time_label = tk.Label(header, text="", font=("Segoe UI", 12), fg=TEXT_MUTED, bg=BG_DARK)
        time_label.pack(side="right", anchor="e")
        
        self.status_label = tk.Label(header, textvariable=self.status, font=("Segoe UI", 12), fg=PRIMARY, bg=BG_DARK)
        self.status_label.pack(side="right", padx=(0, 20), anchor="e")
        
        def update_time():
            time_label.configure(text=datetime.now().strftime("%H:%M:%S  %Y-%m-%d"))
            self.after(1000, update_time)
        update_time()

        main = tk.Frame(self, bg=BG_DARK)
        main.pack(fill="both", expand=True, padx=20, pady=(10, 20))
        
        left = tk.Frame(main, bg=BG_CARD, relief="flat")
        left.pack(side="left", fill="y", padx=(0, 15))
        
        tk.Label(left, text="📝 ENROLL NEW", font=("Segoe UI", 13, "bold"), fg=PRIMARY, bg=BG_CARD).pack(anchor="w", padx=15, pady=(15, 10))
        
        self.uid = tk.StringVar()
        self.name = tk.StringVar()
        
        for label_text, var in [("User ID", self.uid), ("Full Name", self.name)]:
            tk.Label(left, text=label_text, font=("Segoe UI", 10), fg=TEXT_LIGHT, bg=BG_CARD).pack(anchor="w", padx=15, pady=(10, 3))
            tk.Entry(left, textvariable=var, font=("Segoe UI", 10), width=28, bg="#252d38", fg=TEXT_LIGHT, relief="flat", bd=1).pack(anchor="w", padx=15, pady=(0, 5))
        
        tk.Button(left, text="▶ Enroll (3 scans)", command=self.enroll, font=("Segoe UI", 11, "bold"), bg=PRIMARY, fg=BG_DARK, activebackground="#00ffff", relief="flat", bd=0, padx=15, pady=10, cursor="hand2").pack(fill="x", padx=15, pady=(15, 20))
        
        tk.Frame(left, bg=TEXT_MUTED, height=1).pack(fill="x", padx=15, pady=10)
        
        mid = tk.Frame(main, bg=BG_CARD, relief="flat")
        mid.pack(side="left", fill="y", padx=(0, 15))
        
        tk.Label(mid, text="📍 MARK ATTENDANCE", font=("Segoe UI", 13, "bold"), fg=SUCCESS, bg=BG_CARD).pack(anchor="w", padx=15, pady=(15, 15))
        
        for event_key, event_data in ATTENDANCE_EVENTS.items():
            tk.Button(mid, text=f"{event_data['emoji']} {event_data['label']}", command=lambda ek=event_key: self.start_scan(ek),
                     font=("Segoe UI", 10, "bold"), bg=event_data['color'], fg=BG_DARK, activebackground="#ffffff", 
                     relief="flat", bd=0, padx=15, pady=8, cursor="hand2", width=25).pack(fill="x", padx=15, pady=(0, 8))
        
        right = tk.Frame(main, bg=BG_CARD, relief="flat")
        right.pack(side="left", fill="both", expand=True)
        
        tk.Label(right, text="📸 LIVE PREVIEW", font=("Segoe UI", 11, "bold"), fg=PRIMARY, bg=BG_CARD).pack(anchor="w", padx=15, pady=(15, 10))
        
        self.img_label = tk.Label(right, bg="#0a0d12", width=400, height=280)
        self.img_label.pack(padx=15, pady=(0, 15), fill="both", expand=True)
        
        self.message_label = tk.Label(right, textvariable=self.event_message, font=("Segoe UI", 16, "bold"), 
                                     fg=SUCCESS, bg=BG_CARD, wraplength=450, justify="center", height=3)
        self.message_label.pack(anchor="center", padx=15, pady=(0, 15), fill="x")
        
        self.result_label = tk.Label(right, textvariable=self.result, font=("Segoe UI", 12), fg=TEXT_LIGHT, bg=BG_CARD, wraplength=450)
        self.result_label.pack(anchor="w", padx=15, pady=(0, 15))
        
        tk.Label(right, text="LOG", font=("Segoe UI", 10, "bold"), fg=TEXT_MUTED, bg=BG_CARD).pack(anchor="w", padx=15)
        
        self.logbox = tk.Text(right, height=6, font=("Segoe UI", 9), bg="#1a1f26", fg=TEXT_LIGHT, relief="flat", bd=0, state="disabled")
        self.logbox.pack(fill="both", expand=True, padx=15, pady=(5, 15))

    def show_raw(self, raw: bytes):
        try:
            img = Image.frombytes("L", (IMG_W, IMG_H), raw)
            img = img.resize((400, 570))
            self._imgtk = ImageTk.PhotoImage(img)
            self.img_label.configure(image=self._imgtk)
        except Exception as e:
            self.log(f"Image error: {e}")

    def _read_frame(self, timeout=1.2):
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
        m = int(gray.mean())
        lo, hi = PRESSURE_TARGET_MEAN
        if m > hi:
            return f"Lift slightly (pressure={m})"
        if m < lo:
            return f"Touch lightly (pressure={m})"
        return f"Perfect (pressure={m})"

    def wait_finger_removed(self, timeout=8.0):
        self.update_status("Lift finger...", "yellow")
        start = time.time()
        stable_removed = 0
        while time.time() - start < timeout:
            raw = self._read_frame(timeout=0.8)
            if raw is None:
                time.sleep(0.08)
                continue
            gray = raw_to_gray(raw)
            s = img_std(gray)
            if s <= FINGER_REMOVED_STD:
                stable_removed += 1
                if stable_removed >= 3:
                    return True
            else:
                stable_removed = 0
            time.sleep(0.08)
        return False

    def capture_when_stable_hold(self, timeout=20.0):
        self.update_status("Touch scanner...", "cyan")
        start = time.time()
        prev = None
        stable = 0
        last_hint_time = 0
        while time.time() - start < timeout:
            raw = self._read_frame(timeout=1.0)
            if raw is None:
                time.sleep(0.05)
                continue
            gray = raw_to_gray(raw)
            s = img_std(gray)
            if s < FINGER_PRESENT_STD:
                stable = 0
                prev = None
                if time.time() - last_hint_time > 2:
                    self.update_status("Waiting for contact...", "cyan")
                    last_hint_time = time.time()
                time.sleep(0.08)
                continue
            q = quality_score(gray)
            hint = self._pressure_hint(gray)
            remaining = int(timeout - (time.time() - start))
            self.update_status(f"Quality: {q}% | {hint} | {remaining}s", "cyan")
            last_hint_time = time.time()
            
            if q < MIN_QUALITY:
                stable = 0
                prev = None
                time.sleep(0.08)
                continue
            if prev is not None:
                diff = float(np.mean(np.abs(gray.astype(np.int16) - prev.astype(np.int16))))
                stable = stable + 1 if diff <= STABLE_DIFF_MAX else 0
            prev = gray
            if stable >= STABLE_FRAMES:
                return raw
            time.sleep(0.07)
        return None

    def enroll(self):
        if not self.cap:
            return
        uid = self.uid.get().strip()
        name = self.name.get().strip()
        if not uid or not name:
            messagebox.showwarning("Missing", "Enter User ID and Name")
            return

        def worker():
            try:
                tpls = []
                for stage in range(1, 4):
                    self.log(f"Stage {stage}/3: Position finger")
                    raw = self.capture_when_stable_hold(timeout=20.0)
                    if not raw:
                        self.log("Failed: No stable capture")
                        self.update_status("Ready", "cyan")
                        return
                    self.show_raw(raw)
                    gray = preprocess(center_crop(raw_to_gray(raw)))
                    blob = extract_orb_bytes(gray)
                    if not blob:
                        self.log("Failed: Could not extract features")
                        self.update_status("Ready", "cyan")
                        return
                    tpls.append(blob)
                    self.log(f"✓ Scan {stage}/3 captured")
                    ok = self.wait_finger_removed(timeout=10.0)
                    if not ok:
                        self.log("Failed: Lift finger fully")
                        self.update_status("Ready", "cyan")
                        return

                self.db.upsert_user(uid, name)
                for b in tpls:
                    self.db.add_template(uid, b)
                self.db.log_att("ENROLL", uid=uid, name=name, event_type="CHECK_IN")

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
                self.uid.set("")
                self.name.set("")
            except Exception as e:
                self.log(f"Error: {e}")
                self.update_status("Ready", "cyan")

        threading.Thread(target=worker, daemon=True).start()

    def start_scan(self, event_type="CHECK_IN"):
        if not self.cap:
            return

        def worker():
            try:
                rows = self.db.get_all_templates()
                if not rows:
                    self.log("No users enrolled")
                    self.update_status("Ready", "cyan")
                    return
                
                event_data = ATTENDANCE_EVENTS.get(event_type, ATTENDANCE_EVENTS["CHECK_IN"])
                raw = self.capture_when_stable_hold(timeout=20.0)
                if not raw:
                    self.log("No stable scan")
                    self.update_status("Ready", "cyan")
                    return
                
                self.show_raw(raw)
                uid, name, score = identify_best(raw_to_gray(raw), rows)
                
                if uid and score >= SCORE_ACCEPT:
                    now = time.time()
                    last_time = self.last_uid_time.get(uid, 0)
                    if now - last_time < 30:
                        self.log(f"⏳ Too fast! Wait {int(30 - (now - last_time))}s")
                        self.result.set(f"⏳ Please wait, {name}")
                        self.event_message.set("Please wait 30 seconds")
                        self.update_status("Ready", "yellow")
                        self.wait_finger_removed(timeout=6.0)
                        self.update_status("Ready", "cyan")
                        return
                    
                    self.last_uid_time[uid] = now
                    self.db.log_att("MATCH", uid=uid, name=name, score=score, event_type=event_type)
                    self.log(f"✓ {event_data['label']}: {name}")
                    self.result.set(f"✓ {name} | Score: {score}")
                    self.message_label.configure(fg=event_data['color'])
                    self.event_message.set(f"{event_data['emoji']}\n{event_data['message']}")
                    
                    if self.fire.db:
                        try:
                            self.fire.push_attendance(uid, name, score, "MATCH", event_type)
                        except Exception:
                            pass
                else:
                    self.db.log_att("NO_MATCH", score=score, event_type=event_type)
                    self.log(f"✗ No match (score={score})")
                    self.result.set(f"✗ Not recognized (score={score})")
                    self.message_label.configure(fg=ERROR)
                    self.event_message.set("❌\nNot recognized")
                
                self.wait_finger_removed(timeout=6.0)
                self.update_status("Ready", "cyan")
            except Exception as e:
                self.log(f"Error: {e}")
                self.update_status("Ready", "cyan")

        threading.Thread(target=worker, daemon=True).start()

if __name__ == "__main__":
    App().mainloop()
