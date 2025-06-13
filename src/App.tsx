import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LiveRecognition } from './components/LiveRecognition';
import { StudentsManager } from './components/StudentsManager';
import { SystemStats, Student, AttendanceRecord, AttendanceSession } from './types';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Mock data - in real app, this would come from your Python backend
  const [stats] = useState<SystemStats>({
    totalStudents: 125,
    activeStudents: 118,
    todayAttendance: 95,
    averageAttendance: 87,
    cameraStatus: 'online',
    lastSync: '2 minutes ago'
  });

  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      name: 'Alice Johnson',
      studentId: 'ST001',
      class: 'Grade 10A',
      email: 'alice.johnson@school.edu',
      photoUrl: '',
      isActive: true,
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'Bob Smith',
      studentId: 'ST002',
      class: 'Grade 10A',
      email: 'bob.smith@school.edu',
      photoUrl: '',
      isActive: true,
      createdAt: '2024-01-15T10:05:00Z'
    },
    {
      id: '3',
      name: 'Carol Davis',
      studentId: 'ST003',
      class: 'Grade 10B',
      email: 'carol.davis@school.edu',
      photoUrl: '',
      isActive: true,
      createdAt: '2024-01-15T10:10:00Z'
    }
  ]);

  const [recentAttendance] = useState<AttendanceRecord[]>([
    {
      id: '1',
      studentId: '1',
      studentName: 'Alice Johnson',
      className: 'Grade 10A',
      timestamp: new Date().toISOString(),
      confidence: 95,
      status: 'present',
      sessionId: 'session1'
    },
    {
      id: '2',
      studentId: '2',
      studentName: 'Bob Smith',
      className: 'Grade 10A',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      confidence: 88,
      status: 'present',
      sessionId: 'session1'
    }
  ]);

  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [recentRecognitions] = useState<AttendanceRecord[]>(recentAttendance);

  const handleAddStudent = (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    const newStudent: Student = {
      ...studentData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setStudents([...students, newStudent]);
  };

  const handleEditStudent = (id: string, updates: Partial<Student>) => {
    setStudents(students.map(student => 
      student.id === id ? { ...student, ...updates } : student
    ));
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(students.filter(student => student.id !== id));
  };

  const handleStartSession = (className: string, subject: string) => {
    const newSession: AttendanceSession = {
      id: Date.now().toString(),
      className,
      subject,
      startTime: new Date().toISOString(),
      endTime: '',
      isActive: true,
      totalStudents: students.filter(s => s.class === className).length,
      presentCount: 0,
      absentCount: 0
    };
    setActiveSession(newSession);
  };

  const handleStopSession = () => {
    if (activeSession) {
      setActiveSession({
        ...activeSession,
        endTime: new Date().toISOString(),
        isActive: false
      });
    }
    setTimeout(() => setActiveSession(null), 1000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} recentAttendance={recentAttendance} />;
      case 'recognition':
        return (
          <LiveRecognition
            activeSession={activeSession}
            recentRecognitions={recentRecognitions}
            onStartSession={handleStartSession}
            onStopSession={handleStopSession}
          />
        );
      case 'students':
        return (
          <StudentsManager
            students={students}
            onAddStudent={handleAddStudent}
            onEditStudent={handleEditStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        );
      case 'attendance':
        return (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Records</h3>
            <p className="text-gray-500">Attendance management interface coming soon...</p>
          </div>
        );
      case 'sessions':
        return (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Management</h3>
            <p className="text-gray-500">Session management interface coming soon...</p>
          </div>
        );
      case 'reports':
        return (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports & Analytics</h3>
            <p className="text-gray-500">Reports and analytics interface coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
            <p className="text-gray-500">Settings interface coming soon...</p>
          </div>
        );
      default:
        return <Dashboard stats={stats} recentAttendance={recentAttendance} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header stats={stats} />
        
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;