import io, threading, datetime, time, traceback, os
from fastapi import FastAPI, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
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
    staff_id: str = Body(...), # Matches the client-side change
    file: UploadFile = File(...)
):
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

        # Return lecturer_id (matching the client-side expectation)
        return {"lecturer_id": str(res.inserted_id)}

    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


# ---------------------------------------------
# --- SESSION ENGINE THREAD LOOP (MODIFIED) ---
# ---------------------------------------------
def _session_loop(session_id_obj):

    session_id = str(session_id_obj)

    print(f"\n[SESSION {session_id}] Starting session engine...\n")

    try:
        # Load all student data
        students = list(students_col.find({}))
        student_encs = [deserialize_encoding(s["face_encoding"]) for s in students]
        student_ids = [s["_id"] for s in students]
        
        # Load all lecturer data (for optional identification)
        lecturers = list(lecturers_col.find({}))
        lecturer_encs = [deserialize_encoding(l["face_encoding"]) for l in lecturers]
        lecturer_ids = [l["_id"] for l in lecturers]

        # Combine all known faces and IDs for matching
        all_encs = student_encs + lecturer_encs
        all_ids = student_ids + lecturer_ids
        
        # Determine if an ID belongs to a student or lecturer
        def get_type_and_id(matched_id):
            if matched_id in student_ids:
                return "student", matched_id
            if matched_id in lecturer_ids:
                return "lecturer", matched_id
            return "unknown", None

        # Open camera
        cap = cv2.VideoCapture(SERVER_CAMERA_INDEX)
        if not cap.isOpened():
            raise RuntimeError("Camera not available or already in use.")

        print(f"[SESSION {session_id}] Camera OK")

        last_seen = {} # Tracks all seen individuals (students and lecturer)
        identified_lecturer = None # Tracks the lecturer for the current session

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
                if not all_encs:
                    continue

                distances = face_recognition.face_distance(all_encs, fe)
                best_idx = int(np.argmin(distances))

                if distances[best_idx] <= FACE_MATCH_TOLERANCE:
                    matched_id = all_ids[best_idx]
                    entity_type, entity_id = get_type_and_id(matched_id)
                    key = str(entity_id)

                    # Avoid spamming updates (Check for all entities)
                    if key in last_seen and (now - last_seen[key]).total_seconds() < 30:
                        continue

                    last_seen[key] = now

                    if entity_type == "student":
                        # Record student attendance
                        attendance_col.update_one(
                            {"session_id": session_id_obj, "student_id": entity_id},
                            {
                                "$setOnInsert": {
                                    "session_id": session_id_obj,
                                    "student_id": entity_id,
                                    "first_seen": now,
                                    "status": "present"
                                },
                                "$set": {"last_seen": now}
                            },
                            upsert=True
                        )
                    
                    elif entity_type == "lecturer" and identified_lecturer is None:
                        # Identify the lecturer running the session and update the session doc
                        identified_lecturer = entity_id
                        sessions_col.update_one(
                            {"_id": session_id_obj},
                            {"$set": {"lecturer_id": identified_lecturer, "lecturer_seen_at": now}}
                        )
                        print(f"[SESSION {session_id}] Lecturer {identified_lecturer} identified and assigned.")
            
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