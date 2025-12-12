import React, { useRef } from 'react';
import { motion, useInView, UseInViewOptions } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-in' | 'scale-up' | 'slide-left' | 'slide-right';
  delay?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
}

export const ScrollReveal = ({
  children,
  className,
  animation = 'fade-up',
  delay = 0,
  duration = 0.5,
  threshold = 0.1,
  once = true
}: ScrollRevealProps) => {
  const { shouldReduceMotion } = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: threshold, once });

  const getVariants = () => {
    // Sur mobile, on simplifie toutes les animations
    if (shouldReduceMotion) {
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
      };
    }

    switch (animation) {
      case 'fade-up':
        return {
          hidden: { opacity: 0, y: 40 },
          visible: { opacity: 1, y: 0 }
        };
      case 'fade-in':
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 }
        };
      case 'scale-up':
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { opacity: 1, scale: 1 }
        };
      case 'slide-left':
        return {
          hidden: { opacity: 0, x: -50 },
          visible: { opacity: 1, x: 0 }
        };
      case 'slide-right':
        return {
          hidden: { opacity: 0, x: 50 },
          visible: { opacity: 1, x: 0 }
        };
      default:
        return {
          hidden: { opacity: 0, y: 40 },
          visible: { opacity: 1, y: 0 }
        };
    }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={getVariants()}
      transition={{ 
        duration: shouldReduceMotion ? 0.2 : duration, 
        delay: shouldReduceMotion ? 0 : delay, 
        ease: "easeOut" 
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
};

