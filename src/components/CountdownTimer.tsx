import React, { useState, useEffect } from 'react';
import { Clock, Flame } from 'lucide-react';

interface CountdownTimerProps {
  /** Durée en minutes */
  durationMinutes?: number;
  /** Texte à afficher */
  label?: string;
  /** Callback quand le timer expire */
  onExpire?: () => void;
  /** Variante de style */
  variant?: 'default' | 'compact' | 'banner';
}

export default function CountdownTimer({
  durationMinutes = 15,
  label = "Offre spéciale expire dans",
  onExpire,
  variant = 'default'
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    // Récupérer le timestamp de fin depuis localStorage ou en créer un nouveau
    const storageKey = 'countdown_end_time';
    const storedEndTime = localStorage.getItem(storageKey);
    
    if (storedEndTime) {
      const endTime = parseInt(storedEndTime, 10);
      const remaining = Math.max(0, endTime - Date.now());
      if (remaining > 0) {
        return Math.floor(remaining / 1000);
      }
    }
    
    // Créer un nouveau timer
    const newEndTime = Date.now() + durationMinutes * 60 * 1000;
    localStorage.setItem(storageKey, newEndTime.toString());
    return durationMinutes * 60;
  });

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  if (timeLeft <= 0) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-sm font-medium">
        <Clock className="w-4 h-4" />
        <span>{formatTime(minutes)}:{formatTime(seconds)}</span>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="w-full bg-gradient-to-r from-red-600/90 to-orange-600/90 py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-3 text-white">
          <Flame className="w-5 h-5 animate-pulse" />
          <span className="font-medium">{label}</span>
          <div className="flex items-center gap-1 bg-black/30 px-3 py-1 rounded-lg font-mono font-bold text-lg">
            <span>{formatTime(minutes)}</span>
            <span className="animate-pulse">:</span>
            <span>{formatTime(seconds)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl p-4">
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2 text-red-400">
          <Flame className="w-5 h-5 animate-pulse" />
          <span className="font-medium text-sm">{label}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Minutes */}
          <div className="bg-black/50 rounded-lg px-3 py-2 min-w-[3rem] text-center">
            <span className="text-2xl font-bold text-white font-mono">{formatTime(minutes)}</span>
          </div>
          
          <span className="text-2xl font-bold text-red-400 animate-pulse">:</span>
          
          {/* Seconds */}
          <div className="bg-black/50 rounded-lg px-3 py-2 min-w-[3rem] text-center">
            <span className="text-2xl font-bold text-white font-mono">{formatTime(seconds)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

