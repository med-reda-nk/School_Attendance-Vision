export interface Student {
  id: string;
  name: string;
  studentId: string;
  class: string;
  email: string;
  photoUrl: string;
  isActive: boolean;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  timestamp: string;
  confidence: number;
  status: 'present' | 'absent' | 'late';
  sessionId: string;
}

export interface AttendanceSession {
  id: string;
  className: string;
  subject: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
}

export interface SystemStats {
  totalStudents: number;
  activeStudents: number;
  todayAttendance: number;
  averageAttendance: number;
  cameraStatus: 'online' | 'offline' | 'error';
  lastSync: string;
}