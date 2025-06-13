from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Student(BaseModel):
    id: str
    name: str
    student_id: str
    class_name: str
    email: Optional[str] = None
    photo_path: Optional[str] = None
    is_active: bool = True
    created_at: Optional[str] = None
    
    @classmethod
    def from_db_row(cls, row):
        """Create Student from database row"""
        return cls(
            id=row[0],
            name=row[1],
            student_id=row[2],
            class_name=row[3],
            email=row[4],
            photo_path=row[5],
            is_active=bool(row[6]),
            created_at=row[7]
        )

class AttendanceRecord(BaseModel):
    id: str
    student_id: str
    session_id: str
    timestamp: str
    confidence: float
    status: str  # 'present', 'absent', 'late'
    student_name: Optional[str] = None
    class_name: Optional[str] = None
    
    @classmethod
    def from_db_row(cls, row):
        """Create AttendanceRecord from database row"""
        return cls(
            id=row[0],
            student_id=row[1],
            session_id=row[2],
            timestamp=row[3],
            confidence=row[4],
            status=row[5],
            student_name=row[6] if len(row) > 6 else None,
            class_name=row[7] if len(row) > 7 else None
        )

class AttendanceSession(BaseModel):
    id: str
    class_name: str
    subject: str
    start_time: str
    end_time: Optional[str] = None
    is_active: bool = True
    total_students: int = 0
    present_count: int = 0
    absent_count: int = 0
    
    @classmethod
    def from_db_row(cls, row):
        """Create AttendanceSession from database row"""
        return cls(
            id=row[0],
            class_name=row[1],
            subject=row[2],
            start_time=row[3],
            end_time=row[4],
            is_active=bool(row[5]),
            total_students=row[6],
            present_count=row[7],
            absent_count=row[8]
        )