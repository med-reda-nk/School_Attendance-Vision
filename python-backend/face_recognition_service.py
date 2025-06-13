import face_recognition
import cv2
import numpy as np
import os
from typing import List, Dict, Any
import pickle
from database import Database

class FaceRecognitionService:
    def __init__(self):
        self.known_face_encodings = []
        self.known_face_names = []
        self.known_face_ids = []
        self.db = Database()
        
    async def load_known_faces(self):
        """Load known faces from database and photos"""
        students = await self.db.get_active_students()
        
        self.known_face_encodings = []
        self.known_face_names = []
        self.known_face_ids = []
        
        for student in students:
            if student.photo_path and os.path.exists(student.photo_path):
                # Load image
                image = face_recognition.load_image_file(student.photo_path)
                
                # Get face encoding
                face_encodings = face_recognition.face_encodings(image)
                
                if face_encodings:
                    self.known_face_encodings.append(face_encodings[0])
                    self.known_face_names.append(student.name)
                    self.known_face_ids.append(student.id)
        
        print(f"Loaded {len(self.known_face_encodings)} known faces")
    
    def recognize_faces(self, frame) -> List[Dict[str, Any]]:
        """Recognize faces in frame and return results"""
        if not self.known_face_encodings:
            return []
        
        # Resize frame for faster processing
        small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
        rgb_small_frame = small_frame[:, :, ::-1]
        
        # Find faces in frame
        face_locations = face_recognition.face_locations(rgb_small_frame)
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
        
        results = []
        
        for face_encoding, face_location in zip(face_encodings, face_locations):
            # Compare with known faces
            matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding)
            face_distances = face_recognition.face_distance(self.known_face_encodings, face_encoding)
            
            best_match_index = np.argmin(face_distances)
            
            if matches[best_match_index]:
                confidence = 1 - face_distances[best_match_index]
                
                # Scale back face location
                top, right, bottom, left = face_location
                top *= 4
                right *= 4
                bottom *= 4
                left *= 4
                
                results.append({
                    "student_id": self.known_face_ids[best_match_index],
                    "student_name": self.known_face_names[best_match_index],
                    "confidence": float(confidence),
                    "face_location": {
                        "top": top,
                        "right": right,
                        "bottom": bottom,
                        "left": left
                    }
                })
        
        return results
    
    async def retrain_model(self):
        """Retrain the face recognition model with updated data"""
        await self.load_known_faces()
        
    def draw_results(self, frame, results: List[Dict[str, Any]]):
        """Draw recognition results on frame"""
        for result in results:
            location = result["face_location"]
            name = result["student_name"]
            confidence = result["confidence"]
            
            # Draw rectangle around face
            color = (0, 255, 0) if confidence > 0.8 else (0, 255, 255)
            cv2.rectangle(frame, (location["left"], location["top"]), 
                         (location["right"], location["bottom"]), color, 2)
            
            # Draw label
            label = f"{name} ({confidence:.2f})"
            cv2.rectangle(frame, (location["left"], location["bottom"] - 35),
                         (location["right"], location["bottom"]), color, cv2.FILLED)
            cv2.putText(frame, label, (location["left"] + 6, location["bottom"] - 6),
                       cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)
        
        return frame