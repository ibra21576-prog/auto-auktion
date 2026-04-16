'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endTime: Date;
  size?: 'sm' | 'lg';
}

function getTimeLeft(endTime: Date) {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    total: diff,
  };
}

export default function CountdownTimer({ endTime, size = 'sm' }: CountdownTimerProps) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, total: 1 });

  useEffect(() => {
    setMounted(true);
    setTimeLeft(getTimeLeft(endTime));
    const timer = setInterval(() => setTimeLeft(getTimeLeft(endTime)), 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  const isUrgent = timeLeft.total > 0 && timeLeft.total < 1000 * 60 * 60;
  const isEnded = mounted && timeLeft.total <= 0;

  if (isEnded) {
    return (
      <span className="text-danger font-bold text-sm">Beendet</span>
    );
  }

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (!mounted) {
    // Render placeholder to avoid hydration mismatch
    if (size === 'lg') {
      return (
        <div className="flex gap-2">
          {['Std', 'Min', 'Sek'].map((label, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="text-2xl sm:text-3xl font-mono font-bold px-3 py-2 rounded-lg bg-input-bg text-accent">
                --
              </div>
              <span className="text-xs text-muted mt-1">{label}</span>
            </div>
          ))}
        </div>
      );
    }
    return (
      <span className="font-mono text-sm font-semibold text-accent">--:--:--</span>
    );
  }

  if (size === 'lg') {
    return (
      <div className={`flex gap-2 ${isUrgent ? 'pulse-glow rounded-xl' : ''}`}>
        {[
          { val: timeLeft.hours, label: 'Std' },
          { val: timeLeft.minutes, label: 'Min' },
          { val: timeLeft.seconds, label: 'Sek' },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className={`text-2xl sm:text-3xl font-mono font-bold px-3 py-2 rounded-lg ${
              isUrgent ? 'bg-danger/20 text-danger' : 'bg-input-bg text-accent'
            }`}>
              {pad(item.val)}
            </div>
            <span className="text-xs text-muted mt-1">{item.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <span className={`font-mono text-sm font-semibold ${
      isUrgent ? 'text-danger' : 'text-accent'
    }`}>
      {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
    </span>
  );
}
