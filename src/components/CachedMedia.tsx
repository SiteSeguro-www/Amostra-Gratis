import { useState, useEffect, forwardRef } from 'react';
import { mediaCache } from '../lib/mediaCache';
import { motion } from 'framer-motion';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
}

export const CachedImage = forwardRef<HTMLImageElement, CachedImageProps>(({ src, alt, fallbackSrc, ...props }, ref) => {
  const [displaySrc, setDisplaySrc] = useState<string>(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    async function loadCached() {
      if (!src) return;
      
      if (hasError) {
          setDisplaySrc(fallbackSrc || "https://cdn.packzinhu.online/packzinhu-db/images/default.jpg");
          return;
      }

      if (src.startsWith('blob:') || src.startsWith('data:')) {
        setDisplaySrc(src);
        return;
      }

      try {
        const cachedUrl = await mediaCache.fetchAndCache(src);
        if (isMounted) {
          setDisplaySrc(cachedUrl);
        }
      } catch (e) {
        if (isMounted) setHasError(true);
      }
    }

    loadCached();

    return () => {
      isMounted = false;
    };
  }, [src, hasError]);

  return <img 
    ref={ref} 
    src={displaySrc} 
    alt={alt} 
    onError={() => setHasError(true)}
    {...props} 
    referrerPolicy="no-referrer" 
  />;
});

export const MotionCachedImage = motion(CachedImage);

interface CachedVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
}

export const CachedVideo = forwardRef<HTMLVideoElement, CachedVideoProps>(({ src, ...props }, ref) => {
  const [displaySrc, setDisplaySrc] = useState<string>(src);

  useEffect(() => {
    let isMounted = true;
    
    async function loadCached() {
      if (!src) return;
      
      if (src.startsWith('blob:') || src.startsWith('data:')) {
        setDisplaySrc(src);
        return;
      }

      const cachedUrl = await mediaCache.fetchAndCache(src);
      if (isMounted) {
        setDisplaySrc(cachedUrl);
      }
    }

    loadCached();

    return () => {
      isMounted = false;
    };
  }, [src]);

  return <video ref={ref} src={displaySrc} {...props} />;
});

export const MotionCachedVideo = motion(CachedVideo);
