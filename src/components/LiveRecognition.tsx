import React, { useState, useEffect, useRef } from 'react';
import { Camera, Play, Square, Settings, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { AttendanceSession, AttendanceRecord } from '../types';
import { apiService } from '../services/api';

interface LiveRecognitionProps {
  activeSession: AttendanceSession | null;
  recentRecognitions: AttendanceRecord[];
  onStartSession: (className: string, subject: string) => void;
  onStopSession: () => void;
}

export const LiveRecognition: React.FC<LiveRecognitionProps> = ({
  activeSession,
  recentRecognitions,
  onStartSession,
  onStopSession
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [newSessionClass, setNewSessionClass] = useState('');
  const [newSessionSubject, setNewSessionSubject] = useState('');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [cameraFrame, setCameraFrame] = useState<string | null>(null);
  const [recognitionResults, setRecognitionResults] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    apiService.connectWebSocket(
      (data) => {
        switch (data.type) {
          case 'camera_frame':
            setCameraFrame(data.frame);
            setRecognitionResults(data.recognition_results || []);
            drawRecognitionResults(data.recognition_results || []);
            break;
          case 'new_attendance':
            // Handle new attendance record
            console.log('New attendance:', data.attendance);
            break;
          case 'session_started':
            console.log('Session started:', data.session);
            break;
          case 'session_ended':
            console.log('Session ended:', data.session);
            break;
        }
      },
      (connected) => {
        setConnectionStatus(connected);
      }
    );

    return () => {
      apiService.disconnectWebSocket();
    };
  }, []);

  const drawRecognitionResults = (results: any[]) => {
    const canvas = canvasRef.current;
    if (!canvas || !cameraFrame) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Draw recognition results
      results.forEach((result) => {
        const { face_location, student_name, confidence } = result;
        const { top, right, bottom, left } = face_location;

        // Draw rectangle
        const color = confidence > 0.8 ? '#10B981' : '#F59E0B';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(left, top, right - left, bottom - top);

        // Draw label background
        ctx.fillStyle = color;
        ctx.fillRect(left, bottom, right - left, 30);

        // Draw label text
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText(`${student_name} (${(confidence * 100).toFixed(1)}%)`, left + 5, bottom + 20);
      });
    };
    img.src = `data:image/jpeg;base64,${cameraFrame}`;
  };

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      // The Python backend will automatically start sending camera frames
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setCameraFrame(null);
    setRecognitionResults([]);
  };

  const handleStartSession = async () => {
    if (newSessionClass && newSessionSubject) {
      try {
        await apiService.startSession(newSessionClass, newSessionSubject);
        onStartSession(newSessionClass, newSessionSubject);
        setShowSessionForm(false);
        setNewSessionClass('');
        setNewSessionSubject('');
      } catch (error) {
        console.error('Error starting session:', error);
      }
    }
  };

  const handleStopSession = async () => {
    try {
      await apiService.stopSession();
      onStopSession();
      handleStopRecording();
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      {!connectionStatus && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 font-medium">
              Connection to Python backend lost. Please ensure the backend server is running on port 8000.
            </span>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Live Recognition Control</h3>
          <div className="flex items-center space-x-3">
            {activeSession ? (
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Session Active</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>No Active Session</span>
              </div>
            )}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
              connectionStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              <span>{connectionStatus ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Camera Feed */}
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
              {cameraFrame && isRecording ? (
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full object-contain"
                />
              ) : isRecording ? (
                <div className="text-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/20 animate-pulse"></div>
                  <Camera className="w-16 h-16 text-white mx-auto mb-3" />
                  <p className="text-white font-medium">Waiting for camera feed...</p>
                  <p className="text-gray-300 text-sm">Connecting to Python backend...</p>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="w-16 h-16 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">Camera Ready</p>
                  <p className="text-gray-500 text-sm">Click start to begin recognition</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-center space-x-4">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  disabled={!activeSession || !connectionStatus}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <Play className="w-5 h-5" />
                  <span>Start Recognition</span>
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <Square className="w-5 h-5" />
                  <span>Stop Recognition</span>
                </button>
              )}
              
              <button className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Session Management */}
          <div className="space-y-4">
            {activeSession ? (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-blue-900">Active Session</h4>
                  <button
                    onClick={handleStopSession}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    End Session
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="text-blue-700 font-medium">Class:</span> {activeSession.className}</p>
                  <p><span className="text-blue-700 font-medium">Subject:</span> {activeSession.subject}</p>
                  <p><span className="text-blue-700 font-medium">Started:</span> {new Date(activeSession.startTime).toLocaleTimeString()}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-blue-200">
                    <span className="text-blue-700 font-medium">Attendance:</span>
                    <span className="text-blue-900 font-bold">{activeSession.presentCount}/{activeSession.totalStudents}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {!showSessionForm ? (
                  <button
                    onClick={() => setShowSessionForm(true)}
                    disabled={!connectionStatus}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-4 rounded-lg font-medium transition-colors"
                  >
                    Start New Session
                  </button>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">New Session</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                        <input
                          type="text"
                          value={newSessionClass}
                          onChange={(e) => setNewSessionClass(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Grade 10A"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <input
                          type="text"
                          value={newSessionSubject}
                          onChange={(e) => setNewSessionSubject(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Mathematics"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={handleStartSession}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                        >
                          Start Session
                        </button>
                        <button
                          onClick={() => setShowSessionForm(false)}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recognition Statistics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Recognition Stats</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {recognitionResults.length}
                  </p>
                  <p className="text-gray-600">Current Faces</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {recognitionResults.length > 0 ? 
                      Math.round(recognitionResults.reduce((acc, r) => acc + r.confidence, 0) / recognitionResults.length * 100) : 0}%
                  </p>
                  <p className="text-gray-600">Avg Confidence</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Recognitions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Recognitions</h3>
        
        {recentRecognitions.length > 0 ? (
          <div className="space-y-3">
            {recentRecognitions.slice(0, 10).map((recognition) => (
              <div key={recognition.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    recognition.confidence > 80 ? 'bg-green-500' : 
                    recognition.confidence > 60 ? 'bg-amber-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900">{recognition.studentName}</p>
                    <p className="text-sm text-gray-500">{recognition.className}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    {recognition.confidence > 80 ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      recognition.confidence > 80 ? 'text-green-600' : 
                      recognition.confidence > 60 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {recognition.confidence}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(recognition.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No recognitions yet</p>
            <p className="text-gray-400 text-sm">Start a session and begin recording to see results</p>
          </div>
        )}
      </div>
    </div>
  );
};