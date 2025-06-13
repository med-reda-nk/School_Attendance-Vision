import React from 'react';
import { Users, UserCheck, UserX, TrendingUp, Camera, Clock } from 'lucide-react';
import { SystemStats, AttendanceRecord } from '../types';

interface DashboardProps {
  stats: SystemStats;
  recentAttendance: AttendanceRecord[];
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, recentAttendance }) => {
  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents.toString(),
      icon: Users,
      color: 'blue',
      change: '+5%'
    },
    {
      title: 'Present Today',
      value: stats.todayAttendance.toString(),
      icon: UserCheck,
      color: 'green',
      change: '+12%'
    },
    {
      title: 'Average Attendance',
      value: `${stats.averageAttendance}%`,
      icon: TrendingUp,
      color: 'purple',
      change: '+2%'
    },
    {
      title: 'Active Students',
      value: stats.activeStudents.toString(),
      icon: UserX,
      color: 'amber',
      change: '0%'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-500 text-blue-600 bg-blue-50',
    green: 'bg-green-500 text-green-600 bg-green-50',
    purple: 'bg-purple-500 text-purple-600 bg-purple-50',
    amber: 'bg-amber-500 text-amber-600 bg-amber-50'
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClass = colorClasses[stat.color as keyof typeof colorClasses];
          const [bgClass, textClass, cardBgClass] = colorClass.split(' ');
          
          return (
            <div key={index} className={`${cardBgClass} rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${textClass} mt-1`}>
                    {stat.change} from last week
                  </p>
                </div>
                <div className={`${bgClass} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Camera Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Camera Status</h3>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
              stats.cameraStatus === 'online' 
                ? 'bg-green-100 text-green-800' 
                : stats.cameraStatus === 'offline'
                ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                stats.cameraStatus === 'online' ? 'bg-green-500 animate-pulse' : 
                stats.cameraStatus === 'offline' ? 'bg-red-500' : 'bg-amber-500'
              }`}></div>
              <span className="capitalize">{stats.cameraStatus}</span>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
            {stats.cameraStatus === 'online' ? (
              <div className="text-center">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400">Live Camera Feed</p>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 animate-pulse"></div>
              </div>
            ) : (
              <div className="text-center">
                <Camera className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500">Camera Disconnected</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {recentAttendance.slice(0, 5).map((record, index) => (
              <div key={record.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{record.studentName}</p>
                    <p className="text-sm text-gray-500">{record.className}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    record.status === 'present' ? 'text-green-600' : 
                    record.status === 'late' ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(record.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {recentAttendance.length === 0 && (
            <div className="text-center py-8">
              <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent attendance records</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};