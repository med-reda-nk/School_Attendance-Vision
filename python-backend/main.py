from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json
import asyncio
from typing import List, Dict, Any
import cv2
import base64
from datetime import datetime
import sqlite3
import os

from face_recognition_service import FaceRecognitionService
from database import Database
from models import Student, AttendanceRecord, AttendanceSession
from websocket_manager import WebSocketManager
from camera_service import CameraService

app = FastAPI(title="Face Recognition Attendance API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
db = Database()
face_service = FaceRecognitionService()
camera_service = CameraService()
websocket_manager = WebSocketManager()

# Global state
current_session: AttendanceSession = None
recognition_active = False

@app.on_event("startup")
async def startup_event():
    """Initialize database and services"""
    await db.init_db()
    await face_service.load_known_faces()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    await websocket_manager.connect(websocket)
    try:
        while True:
            # Send camera frame and recognition results
            if recognition_active and camera_service.is_active():
                frame = camera_service.get_frame()
                if frame is not None:
                    # Perform face recognition
                    results = face_service.recognize_faces(frame)
                    
                    # Encode frame as base64 for transmission
                    _, buffer = cv2.imencode('.jpg', frame)
                    frame_base64 = base64.b64encode(buffer).decode('utf-8')
                    
                    # Send data to frontend
                    await websocket_manager.send_personal_message({
                        "type": "camera_frame",
                        "frame": frame_base64,
                        "recognition_results": results,
                        "timestamp": datetime.now().isoformat()
                    }, websocket)
                    
                    # Process attendance if session is active
                    if current_session and results:
                        for result in results:
                            await process_attendance(result)
            
            await asyncio.sleep(0.1)  # 10 FPS
            
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)

async def process_attendance(recognition_result: Dict[str, Any]):
    """Process recognition result and update attendance"""
    student_id = recognition_result.get('student_id')
    confidence = recognition_result.get('confidence', 0)
    
    if student_id and confidence > 0.8:  # Confidence threshold
        # Check if already marked present in current session
        existing = await db.get_attendance_by_session_and_student(
            current_session.id, student_id
        )
        
        if not existing:
            # Create attendance record
            attendance = AttendanceRecord(
                student_id=student_id,
                session_id=current_session.id,
                timestamp=datetime.now().isoformat(),
                confidence=confidence,
                status='present'
            )
            
            await db.create_attendance_record(attendance)
            
            # Broadcast to all connected clients
            await websocket_manager.broadcast({
                "type": "new_attendance",
                "attendance": attendance.dict(),
                "timestamp": datetime.now().isoformat()
            })

# API Routes

@app.get("/api/students")
async def get_students():
    """Get all students"""
    students = await db.get_all_students()
    return {"students": students}

@app.post("/api/students")
async def create_student(student: Student):
    """Create new student"""
    student_id = await db.create_student(student)
    
    # Retrain face recognition model
    await face_service.retrain_model()
    
    return {"id": student_id, "message": "Student created successfully"}

@app.put("/api/students/{student_id}")
async def update_student(student_id: str, student: Student):
    """Update student"""
    await db.update_student(student_id, student)
    await face_service.retrain_model()
    return {"message": "Student updated successfully"}

@app.delete("/api/students/{student_id}")
async def delete_student(student_id: str):
    """Delete student"""
    await db.delete_student(student_id)
    await face_service.retrain_model()
    return {"message": "Student deleted successfully"}

@app.post("/api/upload-photo")
async def upload_photo(student_id: str, file: UploadFile = File(...)):
    """Upload student photo for face recognition training"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Save photo
    photo_path = f"photos/{student_id}_{file.filename}"
    os.makedirs("photos", exist_ok=True)
    
    with open(photo_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Update student photo path
    await db.update_student_photo(student_id, photo_path)
    
    # Retrain face recognition model
    await face_service.retrain_model()
    
    return {"message": "Photo uploaded successfully", "path": photo_path}

@app.post("/api/sessions/start")
async def start_session(session_data: Dict[str, str]):
    """Start attendance session"""
    global current_session, recognition_active
    
    current_session = AttendanceSession(
        id=f"session_{datetime.now().timestamp()}",
        class_name=session_data["className"],
        subject=session_data["subject"],
        start_time=datetime.now().isoformat(),
        is_active=True
    )
    
    await db.create_session(current_session)
    recognition_active = True
    
    # Start camera
    camera_service.start()
    
    # Broadcast session start
    await websocket_manager.broadcast({
        "type": "session_started",
        "session": current_session.dict()
    })
    
    return {"message": "Session started", "session": current_session.dict()}

@app.post("/api/sessions/stop")
async def stop_session():
    """Stop attendance session"""
    global current_session, recognition_active
    
    if current_session:
        current_session.end_time = datetime.now().isoformat()
        current_session.is_active = False
        
        await db.update_session(current_session)
        
        # Stop camera and recognition
        recognition_active = False
        camera_service.stop()
        
        # Broadcast session end
        await websocket_manager.broadcast({
            "type": "session_ended",
            "session": current_session.dict()
        })
        
        session_data = current_session.dict()
        current_session = None
        
        return {"message": "Session ended", "session": session_data}
    
    return {"message": "No active session"}

@app.get("/api/attendance")
async def get_attendance(session_id: str = None):
    """Get attendance records"""
    if session_id:
        records = await db.get_attendance_by_session(session_id)
    else:
        records = await db.get_all_attendance()
    
    return {"attendance": records}

@app.get("/api/system/status")
async def get_system_status():
    """Get system status"""
    return {
        "camera_status": "online" if camera_service.is_active() else "offline",
        "recognition_active": recognition_active,
        "current_session": current_session.dict() if current_session else None,
        "total_students": await db.count_students(),
        "last_sync": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)