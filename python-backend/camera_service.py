import cv2
import threading
import time
from typing import Optional
import numpy as np

class CameraService:
    def __init__(self, camera_index: int = 0):
        self.camera_index = camera_index
        self.cap: Optional[cv2.VideoCapture] = None
        self.frame: Optional[np.ndarray] = None
        self.running = False
        self.thread: Optional[threading.Thread] = None
        self.lock = threading.Lock()
        
    def start(self):
        """Start camera capture"""
        if self.running:
            return
            
        self.cap = cv2.VideoCapture(self.camera_index)
        
        # Set camera properties for better performance
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        self.cap.set(cv2.CAP_PROP_FPS, 30)
        
        if not self.cap.isOpened():
            raise Exception(f"Could not open camera {self.camera_index}")
        
        self.running = True
        self.thread = threading.Thread(target=self._capture_frames)
        self.thread.daemon = True
        self.thread.start()
        
        print(f"Camera {self.camera_index} started")
    
    def stop(self):
        """Stop camera capture"""
        self.running = False
        
        if self.thread:
            self.thread.join()
        
        if self.cap:
            self.cap.release()
            self.cap = None
        
        print("Camera stopped")
    
    def _capture_frames(self):
        """Capture frames in separate thread"""
        while self.running:
            if self.cap:
                ret, frame = self.cap.read()
                if ret:
                    with self.lock:
                        self.frame = frame.copy()
                else:
                    print("Failed to read frame from camera")
                    time.sleep(0.1)
            else:
                time.sleep(0.1)
    
    def get_frame(self) -> Optional[np.ndarray]:
        """Get latest frame"""
        with self.lock:
            return self.frame.copy() if self.frame is not None else None
    
    def is_active(self) -> bool:
        """Check if camera is active"""
        return self.running and self.cap is not None and self.cap.isOpened()
    
    def get_camera_info(self) -> dict:
        """Get camera information"""
        if not self.cap:
            return {"status": "inactive"}
        
        return {
            "status": "active" if self.is_active() else "inactive",
            "width": int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            "height": int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            "fps": int(self.cap.get(cv2.CAP_PROP_FPS))
        }

# Raspberry Pi Camera Service (alternative implementation)
class RaspberryPiCameraService:
    def __init__(self):
        try:
            from picamera import PiCamera
            from picamera.array import PiRGBArray
            self.PiCamera = PiCamera
            self.PiRGBArray = PiRGBArray
            self.pi_camera_available = True
        except ImportError:
            self.pi_camera_available = False
            print("PiCamera not available, using USB camera")
        
        self.camera = None
        self.raw_capture = None
        self.frame = None
        self.running = False
        self.thread = None
        self.lock = threading.Lock()
    
    def start(self):
        """Start Raspberry Pi camera"""
        if not self.pi_camera_available:
            raise Exception("PiCamera not available")
        
        if self.running:
            return
        
        self.camera = self.PiCamera()
        self.camera.resolution = (640, 480)
        self.camera.framerate = 30
        self.raw_capture = self.PiRGBArray(self.camera, size=(640, 480))
        
        # Allow camera to warm up
        time.sleep(0.1)
        
        self.running = True
        self.thread = threading.Thread(target=self._capture_frames)
        self.thread.daemon = True
        self.thread.start()
        
        print("Raspberry Pi camera started")
    
    def stop(self):
        """Stop Raspberry Pi camera"""
        self.running = False
        
        if self.thread:
            self.thread.join()
        
        if self.camera:
            self.camera.close()
            self.camera = None
        
        print("Raspberry Pi camera stopped")
    
    def _capture_frames(self):
        """Capture frames from Pi camera"""
        for frame in self.camera.capture_continuous(self.raw_capture, format="bgr", use_video_port=True):
            if not self.running:
                break
            
            with self.lock:
                self.frame = frame.array.copy()
            
            self.raw_capture.truncate(0)
    
    def get_frame(self) -> Optional[np.ndarray]:
        """Get latest frame"""
        with self.lock:
            return self.frame.copy() if self.frame is not None else None
    
    def is_active(self) -> bool:
        """Check if camera is active"""
        return self.running and self.camera is not None