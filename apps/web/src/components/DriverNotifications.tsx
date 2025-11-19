'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'amendment' | 'job_update' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
}

interface DriverNotificationsProps {
  driverId: string;
  companyId: string;
  token?: string;
}

export default function DriverNotifications({
  driverId,
  companyId,
  token,
}: DriverNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize Socket.io connection
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

    const newSocket = io(`${socketUrl}/tracking-v2`, {
      auth: {
        token: token || '',
      },
      transports: ['polling', 'websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Driver notifications connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Driver notifications disconnected');
      setConnected(false);
    });

    // Listen for job amendments
    newSocket.on('job:amended:driver', (data: {
      jobId: string;
      changes: Array<{ field: string; oldValue: any; newValue: any }>;
      summary: string;
      timestamp: Date;
    }) => {
      const notification: Notification = {
        id: `${Date.now()}-${Math.random()}`,
        type: 'amendment',
        title: 'Job Updated',
        message: data.summary,
        timestamp: new Date(data.timestamp),
        changes: data.changes,
      };

      setNotifications((prev) => [notification, ...prev]);

      // Auto-dismiss after 8 seconds
      setTimeout(() => {
        dismissNotification(notification.id);
      }, 8000);

      // Play notification sound
      playNotificationSound();
    });

    // Listen for generic notifications
    newSocket.on('notification:new', (data: {
      type: string;
      title: string;
      message: string;
      timestamp: Date;
    }) => {
      const notification: Notification = {
        id: `${Date.now()}-${Math.random()}`,
        type: 'info',
        title: data.title,
        message: data.message,
        timestamp: new Date(data.timestamp),
      };

      setNotifications((prev) => [notification, ...prev]);

      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        dismissNotification(notification.id);
      }, 6000);

      playNotificationSound();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [driverId, companyId, token]);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const playNotificationSound = () => {
    // Simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      console.log('Could not play notification sound');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'amendment':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'job_update':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'amendment':
        return 'bg-orange-50 border-orange-200';
      case 'job_update':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <>
      {/* Connection Status Indicator */}
      {!connected && (
        <div className="fixed top-4 left-4 z-40 flex items-center space-x-2 bg-red-50 border border-red-200 px-3 py-2 rounded-lg shadow-sm">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs text-red-700 font-medium">Disconnected</span>
        </div>
      )}

      {/* Notifications Container */}
      <div className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] space-y-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -20, x: 100 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`${getNotificationBg(notification.type)} border-2 rounded-2xl p-4 shadow-lg backdrop-blur-sm pointer-events-auto`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">
                      {notification.message}
                    </p>

                    {notification.changes && notification.changes.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {notification.changes.map((change, idx) => (
                          <div key={idx} className="text-xs text-gray-600">
                            <strong>{change.field}:</strong>{' '}
                            <span className="line-through text-gray-400">
                              {String(change.oldValue || 'None')}
                            </span>{' '}
                            → <span className="font-semibold">{String(change.newValue)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                      {notification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
