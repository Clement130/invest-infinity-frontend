import React, { useEffect, useState } from 'react';

export const Header: React.FC = () => {
  const [remainingTime, setRemainingTime] = useState('');
  const [accessCount, setAccessCount] = useState<number | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [afterEnd, setAfterEnd] = useState(false);

  useEffect(() => {
    const updateState = () => {
      const now = new Date();

      const start = new Date();
      start.setHours(11, 0, 0, 0);

      const end = new Date();
      end.setHours(19, 15, 0, 0);

      if (now >= start && now <= end) {
        setShowTimer(true);
        setAfterEnd(false);

        // Timer
        const diff = end.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const formatted = [
          hours.toString().padStart(2, '0'),
          minutes.toString().padStart(2, '0'),
          seconds.toString().padStart(2, '0'),
        ].join(':');
        setRemainingTime(formatted);

        // Décompte dynamique en deux phases
        const totalStart = start.getTime();

        const phase1End = new Date();
        phase1End.setHours(18, 0, 0, 0);
        const phase1EndTime = phase1End.getTime();

        const phase2End = new Date();
        phase2End.setHours(19, 20, 0, 0);
        const phase2EndTime = phase2End.getTime();

        const nowTime = now.getTime();

        const startingCount = 50;
        const endingCount = 5;

        let dynamicCount = startingCount;

        if (nowTime <= phase1EndTime) {
          // Phase 1 : 20% de la descente
          const totalPhase1 = phase1EndTime - totalStart;
          const elapsedPhase1 = nowTime - totalStart;
          const progress1 = elapsedPhase1 / totalPhase1;
          dynamicCount = startingCount - progress1 * (startingCount - endingCount) * 0.2;
        } else if (nowTime <= phase2EndTime) {
          // Phase 2 : 80% de la descente
          const totalPhase2 = phase2EndTime - phase1EndTime;
          const elapsedPhase2 = nowTime - phase1EndTime;
          const progress2 = elapsedPhase2 / totalPhase2;
          dynamicCount = startingCount - (startingCount - endingCount) * (0.2 + 0.8 * progress2);
        } else {
          // Après 19h20
          dynamicCount = endingCount;
        }

        setAccessCount(Math.floor(dynamicCount));
      } else if (now > end) {
        setAfterEnd(true);
        setShowTimer(false);
        setAccessCount(null);
      } else {
        // Avant 11h
        setShowTimer(false);
        setAccessCount(50);
        setAfterEnd(false);
      }
    };

    updateState();
    const interval = setInterval(updateState, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white sticky top-0 z-50 shadow-sm text-center text-sm font-medium">
      <div className="py-2 px-4">
        {afterEnd ? (
          <span>Dernière ligne droite pour rejoindre gratuitement le Discord</span>
        ) : (
          <span>⏳ Il reste seulement {accessCount} accès disponibles</span>
        )}
      </div>

      {showTimer && (
        <div className="bg-pink-100 text-pink-600 font-bold py-1 px-4 text-sm">
          🕒 Se termine dans {remainingTime}
        </div>
      )}
    </div>
  );
};
