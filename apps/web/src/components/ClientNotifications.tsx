'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { AlertCircle, Info, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'amendment' | 'job_update';
  title: string;
  message: string;
  timestamp: Date;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
}

interface ClientNotificationsProps {
  clientId: string;
  companyId: string;
}

export default function ClientNotifications({
  clientId,
  companyId,
}: ClientNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize Socket.io connection
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

    const newSocket = io(`${socketUrl}/tracking-v2`, {
      transports: ['polling', 'websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Client notifications connected');
      setConnected(true);

      // Join client tracking room
      newSocket.emit('join-client-tracking', { clientId });
    });

    newSocket.on('disconnect', () => {
      console.log('Client notifications disconnected');
      setConnected(false);
    });

    // Listen for job amendments
    newSocket.on('job:amended:client', (data: {
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

      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        dismissNotification(notification.id);
      }, 10000);

      // Play notification sound
      playNotificationSound();
    });

    // Listen for tracking updates
    newSocket.on('job-tracking-update', (data: any) => {
      console.log('Tracking update received:', data);
      // This can be used to update real-time tracking if needed
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [clientId, companyId]);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 600;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      console.log('Could not play notification sound');
    }
  };

  return (
    <>
      {/* Notifications Container */}
      <div className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] space-y-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -20, x: 100 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 shadow-lg backdrop-blur-sm pointer-events-auto"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-0.5">
                    {notification.type === 'amendment' ? (
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Info className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-gray-700 mt-1">
                      {notification.message}
                    </p>

                    {notification.changes && notification.changes.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {notification.changes.map((change, idx) => (
                          <div key={idx} className="text-xs text-gray-600">
                            <strong>{change.field}:</strong>{' '}
                            {String(change.newValue)}
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
