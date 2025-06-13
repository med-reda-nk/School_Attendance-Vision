import React from 'react';
import { Bell, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { SystemStats } from '../types';

interface HeaderProps {
  stats: SystemStats;
}

export const Header: React.FC<HeaderProps> = ({ stats }) => {
  const getCameraStatusIcon = () => {
    switch (stats.cameraStatus) {
      case 'online':
        return <Wifi className="w-5 h-5 text-green-500" />;
      case 'offline':
        return <WifiOff className="w-5 h-5 text-red-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <WifiOff className="w-5 h-5 text-gray-400" />;
    }
  };

  const getCameraStatusText = () => {
    switch (stats.cameraStatus) {
      case 'online':
        return 'Camera Online';
      case 'offline':
        return 'Camera Offline';
      case 'error':
        return 'Camera Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            School Attendance Dashboard
          </h2>
          <p className="text-sm text-gray-500">
            Real-time face recognition monitoring system
          </p>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            {getCameraStatusIcon()}
            <span className={`text-sm font-medium ${
              stats.cameraStatus === 'online' ? 'text-green-600' : 
              stats.cameraStatus === 'offline' ? 'text-red-600' : 'text-amber-600'
            }`}>
              {getCameraStatusText()}
            </span>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-500">Last Sync</p>
            <p className="text-sm font-medium text-gray-900">{stats.lastSync}</p>
          </div>
          
          <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
};