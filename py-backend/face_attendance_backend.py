# face_attendance_backend.py
import io, threading, datetime, time
from fastapi import FastAPI, UploadFile, File, Body
from pymongo import MongoClient
import numpy as np
import face_recognition
import cv2
from bson.objectid import ObjectId
from dotenv import load_dotenv
import os

app = FastAPI(title="Face Recognition Attendance Backend")

# MongoDB

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")client = MongoClient(MONGO_URI)
SERVER_CAMERA_INDEX = int(os.getenv("SERVER_CAMERA_INDEX", 0))
FACE_MATCH_TOLERANCE = float(os.getenv("FACE_MATCH_TOLERANCE", 0.5))
db = client.attendance_system
students_col = db.students
sessions_col = db.sessions
attendance_col = db.attendance

# Globals
_running_sessions = {}
_running_lock = threading.Lock()
SERVER_CAMERA_INDEX = 0
FACE_MATCH_TOLERANCE = 0.5

def now_utc():
    return datetime.datetime.utcnow()

def serialize_encoding(enc: np.ndarray):
    return enc.tolist()

def deserialize_encoding(blob):
    return np.array(blob, dtype=np.float64)

# Student Enrollment
@app.post("/students/enroll")
async def enroll_student(name: str = Body(...), matric_no: str = Body(...), file: UploadFile = File(...)):
    content = await file.read()
    img = face_recognition.load_image_file(io.BytesIO(content))
    face_locs = face_recognition.face_locations(img)
    if not face_locs:
        return {"error": "No face detected"}
    enc = face_recognition.face_encodings(img, face_locs)[0]
    res = students_col.insert_one({
        "name": name,
        "matric_no": matric_no,
        "face_encoding": serialize_encoding(enc),
        "created_at": now_utc()
    })
    return {"student_id": str(res.inserted_id)}

# Session Engine
def _session_loop(session_id_obj):
    session_id_str = str(session_id_obj)
    print(f"[session {session_id_str}] starting camera...")
    students = list(students_col.find({}))
    encs = [deserialize_encoding(s["face_encoding"]) for s in students]
    ids = [s["_id"] for s in students]

    cap = cv2.VideoCapture(SERVER_CAMERA_INDEX)
    if not cap.isOpened():
        print("Camera not available")
        return

    last_seen = {}
    try:
        while True:
            with _running_lock:
                if not _running_sessions.get(session_id_str, {}).get("active"):
                    break
            ret, frame = cap.read()
            if not ret:
                time.sleep(0.05)
                continue
            rgb = frame[:, :, ::-1]
            try:
                face_locs = face_recognition.face_locations(rgb, model="hog")
                face_encodings = face_recognition.face_encodings(rgb, face_locs)
            except:
                face_encodings = []
            now = now_utc()
            for fe in face_encodings:
                if not encs:
                    continue
                distances = face_recognition.face_distance(encs, fe)
                best_idx = int(np.argmin(distances))
                if distances[best_idx] <= FACE_MATCH_TOLERANCE:
                    student_id = ids[best_idx]
                    key = str(student_id)
                    if last_seen.get(key) and (now - last_seen[key]).total_seconds() < 30:
                        continue
                    last_seen[key] = now
                    attendance_col.update_one(
                        {"session_id": session_id_obj, "student_id": student_id},
                        {"$setOnInsert": {
                            "session_id": session_id_obj,
                            "student_id": student_id,
                            "first_seen": now,
                            "last_seen": now,
                            "status": "present"
                        }, "$set": {"last_seen": now}},
                        upsert=True
                    )
            cv2.waitKey(1)
    finally:
        cap.release()
        print(f"[session {session_id_str}] stopped")

# Start Session
@app.post("/sessions/start")
def start_session():
    session_doc = {"start_time": now_utc(), "active": True}
    res = sessions_col.insert_one(session_doc)
    session_id = res.inserted_id
    with _running_lock:
        _running_sessions[str(session_id)] = {"thread": None, "active": True}
    t = threading.Thread(target=_session_loop, args=(session_id,), daemon=True)
    _running_sessions[str(session_id)]["thread"] = t
    t.start()
    return {"session_id": str(session_id)}

# Stop Session
@app.post("/sessions/stop")
def stop_session(session_id: str = Body(...)):
    with _running_lock:
        if _running_sessions.get(session_id):
            _running_sessions[session_id]["active"] = False
    return {"ok": True}

# List Running Sessions
@app.get("/sessions/running")
def list_running_sessions():
    with _running_lock:
        return list(_running_sessions.keys())
