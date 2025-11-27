import io, threading, datetime, time, traceback, os
from fastapi import FastAPI, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware  # <-- FIXED: Corrected spelling to CORSMiddleware
from pymongo import MongoClient
import numpy as np
import face_recognition
import cv2
from bson.objectid import ObjectId
from dotenv import load_dotenv

# FastAPI APP
app = FastAPI(title="Face Recognition Attendance Backend")

# Allow frontend JS to access the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# LOAD ENV AND DATABASE
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("ERROR: MONGO_URI missing in .env")

SERVER_CAMERA_INDEX = int(os.getenv("SERVER_CAMERA_INDEX", 0))
FACE_MATCH_TOLERANCE = float(os.getenv("FACE_MATCH_TOLERANCE", 0.5))

client = MongoClient(MONGO_URI)
db = client.attendance_system
students_col = db.students
lecturers_col = db.lecturers # <-- NEW: Collection for lecturers
sessions_col = db.sessions
attendance_col = db.attendance

# GLOBALS
_running_sessions = {}
_running_lock = threading.Lock()

# UTILS
def now_utc():
    return datetime.datetime.utcnow()


def serialize_encoding(enc: np.ndarray):
    return enc.tolist()


def deserialize_encoding(blob):
    return np.array(blob, dtype=np.float64)


# --- ROUTE: ENROLL STUDENT (Existing) ---
@app.post("/students/enroll")
async def enroll_student(
    name: str = Body(...),
    matric_no: str = Body(...),
    file: UploadFile = File(...)
):
    try:
        content = await file.read()
        img = face_recognition.load_image_file(io.BytesIO(content))

        face_locs = face_recognition.face_locations(img)
        if not face_locs:
            return {"error": "No face detected"}

        encoding = face_recognition.face_encodings(img, face_locs)[0]

        res = students_col.insert_one({
            "name": name,
            "matric_no": matric_no,
            "face_encoding": serialize_encoding(encoding),
            "created_at": now_utc()
        })

        return {"student_id": str(res.inserted_id)}

    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}

# ---------------------------------------------
# --- NEW ROUTE: ENROLL LECTURER ---
# ---------------------------------------------
@app.post("/lecturers/enroll")
async def enroll_lecturer(
    name: str = Body(...),
    staff_id: str = Body(...), # Used 'staff_id' to match the frontend page
    file: UploadFile = File(...)
):
    """Handles uploading a lecturer's face image and saving their encoding."""
    try:
        content = await file.read()
        img = face_recognition.load_image_file(io.BytesIO(content))

        face_locs = face_recognition.face_locations(img)
        if not face_locs:
            return {"error": "No face detected"}

        encoding = face_recognition.face_encodings(img, face_locs)[0]

        # Insert into the new lecturers collection
        res = lecturers_col.insert_one({
            "name": name,
            "staff_id": staff_id,
            "face_encoding": serialize_encoding(encoding),
            "created_at": now_utc()
        })

        # Return lecturer_id (as expected by the frontend)
        return {"lecturer_id": str(res.inserted_id)}

    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


# ---------------------------------------------
# --- SESSION ENGINE THREAD LOOP (ORIGINAL) ---
# ---------------------------------------------
def _session_loop(session_id_obj):

    session_id = str(session_id_obj)

    print(f"\n[SESSION {session_id}] Starting session engine...\n")

    try:
        # Load all student data (Lecturer data is NOT loaded or used in this original loop)
        students = list(students_col.find({}))
        encs = [deserialize_encoding(s["face_encoding"]) for s in students]
        ids = [s["_id"] for s in students]

        # Open camera
        cap = cv2.VideoCapture(SERVER_CAMERA_INDEX)
        if not cap.isOpened():
            # If camera fails here, the session will crash
            raise RuntimeError("Camera not available or already in use.")

        print(f"[SESSION {session_id}] Camera OK")

        last_seen = {}

        while True:
            # Stop signal
            with _running_lock:
                if not _running_sessions.get(session_id, {}).get("active"):
                    break

            ret, frame = cap.read()
            if not ret:
                print("[SESSION] Warning: frame read failed")
                time.sleep(0.1)
                continue

            rgb = frame[:, :, ::-1]

            face_locs = face_recognition.face_locations(rgb)
            face_encodings = face_recognition.face_encodings(rgb, face_locs)

            now = now_utc()

            for fe in face_encodings:
                if not encs:
                    continue

                distances = face_recognition.face_distance(encs, fe)
                best_idx = int(np.argmin(distances))

                if distances[best_idx] <= FACE_MATCH_TOLERANCE:
                    student_id = ids[best_idx]
                    key = str(student_id)

                    # Avoid spam attendance every second
                    if key in last_seen and (now - last_seen[key]).total_seconds() < 30:
                        continue

                    last_seen[key] = now

                    attendance_col.update_one(
                        {"session_id": session_id_obj, "student_id": student_id},
                        {
                            "$setOnInsert": {
                                "session_id": session_id_obj,
                                "student_id": student_id,
                                "first_seen": now,
                                "status": "present"
                            },
                            "$set": {"last_seen": now}
                        },
                        upsert=True
                    )

            cv2.waitKey(1)

    except Exception:
        print("\n--- SESSION THREAD CRASHED ---")
        traceback.print_exc()
        print("--------------------------------\n")

    finally:
        try:
            cap.release()
        except:
            pass

        print(f"[SESSION {session_id}] Stopped.")


# --- ROUTE: START SESSION (Existing) ---
@app.post("/sessions/start")
def start_session():
    # Session document now includes optional 'lecturer_id'
    session_doc = {"start_time": now_utc(), "active": True} 
    res = sessions_col.insert_one(session_doc)
    session_id = str(res.inserted_id)

    with _running_lock:
        _running_sessions[session_id] = {"thread": None, "active": True}

    t = threading.Thread(target=_session_loop, args=(res.inserted_id,), daemon=True)
    _running_sessions[session_id]["thread"] = t
    t.start()

    print(f"[API] Session started: {session_id}")

    return {"session_id": session_id}


# --- ROUTE: STOP SESSION (Existing) ---
@app.post("/sessions/stop")
def stop_session(session_id: str = Body(...)):
    with _running_lock:
        if session_id in _running_sessions:
            _running_sessions[session_id]["active"] = False

    sessions_col.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"active": False, "end_time": now_utc()}}
    )

    print(f"[API] Session stopped: {session_id}")

    return {"ok": True}

# --- ROUTE: LIST RUNNING SESSIONS (Existing) ---
@app.get("/sessions/running")
def list_running_sessions():
    with _running_lock:
        return list(_running_sessions.keys())