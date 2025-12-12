import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
}

export default function AnimatedSection({ children, className = '' }: AnimatedSectionProps) {
  const { shouldReduceMotion } = useReducedMotion();
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sur mobile, on affiche directement sans animation
    if (shouldReduceMotion) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [shouldReduceMotion]);

  return (
    <div
      ref={ref}
      className={`transform transition-all ${
        shouldReduceMotion ? 'duration-200' : 'duration-1000'
      } ${
        isInView
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-20'
      } ${className}`}
    >
      {children}
    </div>
  );
}