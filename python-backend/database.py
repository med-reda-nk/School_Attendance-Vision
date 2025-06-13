import sqlite3
import aiosqlite
from typing import List, Optional
from models import Student, AttendanceRecord, AttendanceSession
import json

class Database:
    def __init__(self, db_path: str = "attendance.db"):
        self.db_path = db_path
    
    async def init_db(self):
        """Initialize database tables"""
        async with aiosqlite.connect(self.db_path) as db:
            # Students table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS students (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    student_id TEXT UNIQUE NOT NULL,
                    class_name TEXT NOT NULL,
                    email TEXT,
                    photo_path TEXT,
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Sessions table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    class_name TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    start_time TIMESTAMP NOT NULL,
                    end_time TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1,
                    total_students INTEGER DEFAULT 0,
                    present_count INTEGER DEFAULT 0,
                    absent_count INTEGER DEFAULT 0
                )
            """)
            
            # Attendance table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS attendance (
                    id TEXT PRIMARY KEY,
                    student_id TEXT NOT NULL,
                    session_id TEXT NOT NULL,
                    timestamp TIMESTAMP NOT NULL,
                    confidence REAL NOT NULL,
                    status TEXT NOT NULL,
                    FOREIGN KEY (student_id) REFERENCES students (id),
                    FOREIGN KEY (session_id) REFERENCES sessions (id)
                )
            """)
            
            await db.commit()
            print("Database initialized")
    
    async def create_student(self, student: Student) -> str:
        """Create new student"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO students (id, name, student_id, class_name, email, photo_path, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (student.id, student.name, student.student_id, student.class_name, 
                  student.email, student.photo_path, student.is_active))
            await db.commit()
            return student.id
    
    async def get_all_students(self) -> List[Student]:
        """Get all students"""
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute("SELECT * FROM students ORDER BY name") as cursor:
                rows = await cursor.fetchall()
                return [Student.from_db_row(row) for row in rows]
    
    async def get_active_students(self) -> List[Student]:
        """Get active students only"""
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute("SELECT * FROM students WHERE is_active = 1 ORDER BY name") as cursor:
                rows = await cursor.fetchall()
                return [Student.from_db_row(row) for row in rows]
    
    async def update_student(self, student_id: str, student: Student):
        """Update student"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                UPDATE students 
                SET name = ?, student_id = ?, class_name = ?, email = ?, 
                    photo_path = ?, is_active = ?
                WHERE id = ?
            """, (student.name, student.student_id, student.class_name, 
                  student.email, student.photo_path, student.is_active, student_id))
            await db.commit()
    
    async def delete_student(self, student_id: str):
        """Delete student"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("DELETE FROM students WHERE id = ?", (student_id,))
            await db.commit()
    
    async def update_student_photo(self, student_id: str, photo_path: str):
        """Update student photo path"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("UPDATE students SET photo_path = ? WHERE id = ?", 
                           (photo_path, student_id))
            await db.commit()
    
    async def create_session(self, session: AttendanceSession):
        """Create attendance session"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO sessions (id, class_name, subject, start_time, is_active, total_students)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (session.id, session.class_name, session.subject, session.start_time, 
                  session.is_active, session.total_students))
            await db.commit()
    
    async def update_session(self, session: AttendanceSession):
        """Update session"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                UPDATE sessions 
                SET end_time = ?, is_active = ?, present_count = ?, absent_count = ?
                WHERE id = ?
            """, (session.end_time, session.is_active, session.present_count, 
                  session.absent_count, session.id))
            await db.commit()
    
    async def create_attendance_record(self, record: AttendanceRecord):
        """Create attendance record"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO attendance (id, student_id, session_id, timestamp, confidence, status)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (record.id, record.student_id, record.session_id, record.timestamp, 
                  record.confidence, record.status))
            await db.commit()
    
    async def get_attendance_by_session(self, session_id: str) -> List[AttendanceRecord]:
        """Get attendance records for session"""
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute("""
                SELECT a.*, s.name as student_name, s.class_name 
                FROM attendance a 
                JOIN students s ON a.student_id = s.id 
                WHERE a.session_id = ?
                ORDER BY a.timestamp
            """, (session_id,)) as cursor:
                rows = await cursor.fetchall()
                return [AttendanceRecord.from_db_row(row) for row in rows]
    
    async def get_attendance_by_session_and_student(self, session_id: str, student_id: str) -> Optional[AttendanceRecord]:
        """Check if student already marked present in session"""
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute("""
                SELECT * FROM attendance 
                WHERE session_id = ? AND student_id = ?
            """, (session_id, student_id)) as cursor:
                row = await cursor.fetchone()
                return AttendanceRecord.from_db_row(row) if row else None
    
    async def count_students(self) -> int:
        """Count total students"""
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute("SELECT COUNT(*) FROM students") as cursor:
                result = await cursor.fetchone()
                return result[0] if result else 0