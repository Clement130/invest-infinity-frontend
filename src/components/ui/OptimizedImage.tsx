import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  lazy?: boolean;
  webpSrc?: string;
  avifSrc?: string;
  sizes?: string;
  quality?: number;
  className?: string;
  containerClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  fallbackSrc,
  lazy = true,
  webpSrc,
  avifSrc,
  sizes,
  quality = 80,
  className,
  containerClassName,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer pour lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Commencer le chargement 50px avant que l'image soit visible
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Générer les sources pour les formats modernes
  const generateSources = () => {
    const sources = [];

    if (avifSrc) {
      sources.push(
        <source
          key="avif"
          srcSet={avifSrc}
          type="image/avif"
          sizes={sizes}
        />
      );
    }

    if (webpSrc) {
      sources.push(
        <source
          key="webp"
          srcSet={webpSrc}
          type="image/webp"
          sizes={sizes}
        />
      );
    }

    return sources;
  };

  const currentSrc = hasError && fallbackSrc ? fallbackSrc : src;

  return (
    <div
      ref={containerRef}
      className={clsx('relative overflow-hidden', containerClassName)}
    >
      {/* Placeholder/Skeleton */}
      {!isLoaded && (
        <div
          className={clsx(
            'absolute inset-0 bg-gray-800 animate-pulse rounded',
            className
          )}
          aria-hidden="true"
        />
      )}

      {/* Image optimisée */}
      {isInView && (
        <picture>
          {generateSources()}
          <img
            ref={imgRef}
            src={currentSrc}
            alt={alt}
            className={clsx(
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              className
            )}
            loading={lazy ? 'lazy' : 'eager'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            sizes={sizes}
            {...props}
          />
        </picture>
      )}

      {/* Fallback pour navigateurs anciens */}
      {isInView && !webpSrc && !avifSrc && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          className={clsx(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          sizes={sizes}
          {...props}
        />
      )}
    </div>
  );
}

// Hook pour précharger des images critiques
export function useImagePreloader(srcs: string[]) {
  useEffect(() => {
    srcs.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [srcs]);
}
