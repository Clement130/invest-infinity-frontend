import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Star, Zap } from 'lucide-react';

interface SocialProofBannerProps {
  variant?: 'inline' | 'card' | 'minimal';
}

// Données de social proof (peuvent être dynamiques via API)
const socialProofData = {
  membersOnline: 127,
  todaySignups: 23,
  avgRating: 4.8,
  successRate: 94,
};

export default function SocialProofBanner({ variant = 'inline' }: SocialProofBannerProps) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Messages rotatifs de social proof
  const messages = [
    {
      icon: Users,
      text: `${socialProofData.membersOnline} membres en ligne`,
      color: 'text-green-400',
    },
    {
      icon: TrendingUp,
      text: `${socialProofData.todaySignups} inscriptions aujourd'hui`,
      color: 'text-blue-400',
    },
    {
      icon: Star,
      text: `${socialProofData.avgRating}/5 de satisfaction`,
      color: 'text-yellow-400',
    },
    {
      icon: Zap,
      text: `${socialProofData.successRate}% de traders satisfaits`,
      color: 'text-pink-400',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentMessage((prev) => (prev + 1) % messages.length);
        setIsVisible(true);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, [messages.length]);

  const CurrentIcon = messages[currentMessage].icon;

  if (variant === 'minimal') {
    return (
      <div 
        className={`inline-flex items-center gap-2 text-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className={messages[currentMessage].color}>
          {messages[currentMessage].text}
        </span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {messages.map((msg, index) => {
            const Icon = msg.icon;
            return (
              <div key={index} className="text-center">
                <Icon className={`w-6 h-6 mx-auto mb-2 ${msg.color}`} />
                <p className="text-white font-bold text-lg">
                  {msg.text.split(' ')[0]}
                </p>
                <p className="text-gray-400 text-xs">
                  {msg.text.split(' ').slice(1).join(' ')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Default inline variant
  return (
    <div 
      className={`flex items-center justify-center gap-2 py-2 px-4 bg-white/5 rounded-full border border-white/10 transition-all duration-300 ${
        isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'
      }`}
    >
      <CurrentIcon className={`w-4 h-4 ${messages[currentMessage].color}`} />
      <span className="text-sm text-gray-300">
        {messages[currentMessage].text}
      </span>
    </div>
  );
}

