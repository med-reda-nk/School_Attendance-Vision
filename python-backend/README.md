# Face Recognition Backend Integration Guide

## Overview
This guide explains how to integrate your Python face recognition code with the React frontend interface for real-time attendance tracking.

## Architecture
```
React Frontend (Port 5173) ←→ Python Backend (Port 8000) ←→ Raspberry Pi Camera
```

## Required Python Dependencies
```bash
pip install fastapi uvicorn opencv-python face-recognition numpy pillow websockets python-multipart sqlite3
```

## File Structure
```
python-backend/
├── main.py                 # FastAPI main application
├── face_recognition_service.py  # Your face recognition logic
├── database.py            # Database operations
├── models.py              # Data models
├── camera_service.py      # Camera handling
├── websocket_manager.py   # Real-time communication
└── requirements.txt       # Python dependencies
```

## Integration Steps

### 1. Replace the mock camera feed in LiveRecognition.tsx
The React component will connect to your Python backend via WebSocket for real-time video streaming and recognition results.

### 2. API Endpoints
Your Python backend should implement these endpoints:
- `GET /api/students` - Get all students
- `POST /api/students` - Add new student
- `PUT /api/students/{id}` - Update student
- `DELETE /api/students/{id}` - Delete student
- `POST /api/sessions/start` - Start attendance session
- `POST /api/sessions/stop` - Stop attendance session
- `GET /api/attendance` - Get attendance records
- `POST /api/upload-photo` - Upload student photo for training

### 3. WebSocket Connection
Real-time communication for:
- Live camera feed
- Recognition results
- System status updates
- Attendance notifications

## Quick Start
1. Install Python dependencies
2. Run the Python backend: `python main.py`
3. The React frontend will automatically connect to the backend
4. Start a session and begin face recognition

## Camera Integration
The system supports both USB cameras and Raspberry Pi camera modules. Configure in the settings panel.