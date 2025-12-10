import React from 'react';
import { cn } from '../../../utils/cn';

interface TextGradientProps {
  children: React.ReactNode;
  className?: string;
  from?: string;
  to?: string;
  via?: string;
}

export const TextGradient = ({ 
  children, 
  className,
  from = "from-pink-400",
  to = "to-purple-500",
  via = "via-pink-500"
}: TextGradientProps) => {
  return (
    <span 
      className={cn(
        "bg-clip-text text-transparent bg-gradient-to-r bg-[length:200%_auto] animate-gradient",
        from,
        via,
        to,
        className
      )}
    >
      {children}
    </span>
  );
};

