'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string | Date;
  urgentThresholdHours?: number;
  onExpired?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
  urgent: boolean;
}

function calculateTimeRemaining(targetDate: string | Date): TimeRemaining {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true, urgent: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const hoursRemaining = days * 24 + hours;
  const urgent = hoursRemaining < 24; // Less than 24 hours

  return {
    days,
    hours,
    minutes,
    seconds,
    expired: false,
    urgent,
  };
}

export function CountdownTimer({
  targetDate,
  urgentThresholdHours = 24,
  onExpired,
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    calculateTimeRemaining(targetDate)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining(targetDate);
      setTimeRemaining(remaining);

      if (remaining.expired && onExpired) {
        onExpired();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpired]);

  const { days, hours, minutes, seconds, expired, urgent } = timeRemaining;

  if (expired) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-100 border border-red-300 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <span className="font-semibold text-red-700">BL CUTOFF EXPIRED</span>
      </div>
    );
  }

  const bgColor = urgent ? 'bg-orange-100 border-orange-300' : 'bg-yellow-100 border-yellow-300';
  const textColor = urgent ? 'text-orange-700' : 'text-yellow-700';

  return (
    <div className={`flex items-center gap-2 px-3 py-2 ${bgColor} border rounded-lg`}>
      <Clock className={`w-5 h-5 ${textColor}`} />
      <span className={`font-semibold ${textColor}`}>
        {days > 0
          ? `${days}d ${hours}h ${minutes}m remaining`
          : hours > 0
          ? `${hours}h ${minutes}m remaining`
          : `${minutes}m ${seconds}s remaining`}
      </span>
    </div>
  );
}
