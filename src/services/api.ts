const API_BASE_URL = 'http://localhost:8000';

export class ApiService {
  private static instance: ApiService;
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // WebSocket connection for real-time updates
  connectWebSocket(onMessage: (data: any) => void, onStatusChange: (connected: boolean) => void) {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.websocket = new WebSocket('ws://localhost:8000/ws');
      
      this.websocket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        onStatusChange(true);
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('WebSocket disconnected');
        onStatusChange(false);
        this.attemptReconnect(onMessage, onStatusChange);
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        onStatusChange(false);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      onStatusChange(false);
    }
  }

  private attemptReconnect(onMessage: (data: any) => void, onStatusChange: (connected: boolean) => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connectWebSocket(onMessage, onStatusChange);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnectWebSocket() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  // API Methods
  async getStudents() {
    const response = await fetch(`${API_BASE_URL}/api/students`);
    if (!response.ok) throw new Error('Failed to fetch students');
    return response.json();
  }

  async createStudent(student: any) {
    const response = await fetch(`${API_BASE_URL}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    });
    if (!response.ok) throw new Error('Failed to create student');
    return response.json();
  }

  async updateStudent(id: string, student: any) {
    const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    });
    if (!response.ok) throw new Error('Failed to update student');
    return response.json();
  }

  async deleteStudent(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete student');
    return response.json();
  }

  async uploadPhoto(studentId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/api/upload-photo?student_id=${studentId}`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Failed to upload photo');
    return response.json();
  }

  async startSession(className: string, subject: string) {
    const response = await fetch(`${API_BASE_URL}/api/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ className, subject })
    });
    if (!response.ok) throw new Error('Failed to start session');
    return response.json();
  }

  async stopSession() {
    const response = await fetch(`${API_BASE_URL}/api/sessions/stop`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to stop session');
    return response.json();
  }

  async getAttendance(sessionId?: string) {
    const url = sessionId 
      ? `${API_BASE_URL}/api/attendance?session_id=${sessionId}`
      : `${API_BASE_URL}/api/attendance`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch attendance');
    return response.json();
  }

  async getSystemStatus() {
    const response = await fetch(`${API_BASE_URL}/api/system/status`);
    if (!response.ok) throw new Error('Failed to fetch system status');
    return response.json();
  }
}

export const apiService = ApiService.getInstance();