import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glowEffect?: boolean;
  magnetic?: boolean;
  className?: string;
}

export const PremiumButton = ({
  children,
  variant = 'primary',
  size = 'md',
  glowEffect = true,
  magnetic = true,
  className,
  ...props
}: PremiumButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!magnetic || !buttonRef.current) return;

    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - (left + width / 2);
    const y = e.clientY - (top + height / 2);

    setPosition({ x: x * 0.1, y: y * 0.1 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const variants = {
    primary: "bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-white border-none",
    secondary: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20",
    outline: "bg-transparent border border-pink-500/50 text-pink-500 hover:bg-pink-500/10",
    ghost: "bg-transparent text-gray-300 hover:text-white"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative rounded-xl font-medium overflow-hidden transition-all duration-300",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {/* Glow Effect */}
      {glowEffect && variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      )}
      
      {/* Content */}
      <span className="relative z-10 flex items-center gap-2 justify-center">
        {children}
      </span>

      {/* Background Glow for Primary */}
      {glowEffect && variant === 'primary' && (
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 hover:opacity-100 transition-opacity duration-500 blur-xl" />
      )}
    </motion.button>
  );
};

