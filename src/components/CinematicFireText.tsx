import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  text: string;
  isActive: boolean;
}

export const CinematicFireText: React.FC<Props> = ({ text, isActive }) => {
  const [isHovered, setIsHovered] = useState(false);
  const showFire = isHovered || isActive;
  const videoRef = useRef<HTMLVideoElement>(null);

  // Array to generate some random sparks floating up
  const [sparks, setSparks] = useState<{ id: number, x: number }[]>([]);

  useEffect(() => {
    if (showFire) {
      if (videoRef.current) {
        // Randomize the start slightly so it doesn't always start exactly the same
        videoRef.current.currentTime = Math.random() * 2; 
        videoRef.current.play().catch(() => {}); // catch autoplay restrictions gracefully
      }
      
      // Spawn sparks continuously while active
      const interval = setInterval(() => {
        setSparks(prev => {
          // X offset starts randomly near the center of the text width
          const newSparks = [...prev, { id: Date.now(), x: (Math.random() - 0.5) * 40 }];
          return newSparks.slice(-10); // keep max 10 sparks alive in memory
        });
      }, 150);
      return () => clearInterval(interval);
    } else {
      if (videoRef.current) {
        setTimeout(() => {
          if (videoRef.current) videoRef.current.pause();
        }, 300);
      }
      setSparks([]); // clear sparks immediately
    }
  }, [showFire]);

  return (
    <div 
      className="relative flex items-center justify-center cursor-pointer px-1 py-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Base Text */}
      <span className={`relative z-10 font-medium transition-all duration-300 ${showFire ? 'text-white' : 'text-gray-300 hover:text-white'}`}
        style={{
          textShadow: showFire 
            ? '0 0 10px rgba(255,140,0,0.9), 0 -2px 20px rgba(255,40,0,0.8), 0 -4px 30px rgba(255,0,0,0.6)'
            : 'none'
        }}
      >
        {text}
      </span>

      {/* Cinematic Fire Video Overlay */}
      <AnimatePresence>
        {showFire && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 2 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute z-20 pointer-events-none rounded-t-full overflow-hidden"
            style={{ 
              top: '-35px',
              width: '80px',
              height: '60px',
              mixBlendMode: 'screen', // This seamlessly integrates black backgrounds
              filter: 'contrast(1.4) brightness(1.2)' // punch up the fire colors
            }}
          >
            <video
              ref={videoRef}
              src="https://assets.mixkit.co/videos/download/mixkit-fire-flames-burning-on-a-black-background-43756-medium.mp4"
              muted
              playsInline
              loop
              className="w-full h-full object-cover opacity-90"
              style={{ objectPosition: 'center bottom' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Framer Motion Action Sparks 3D Effect */}
      <AnimatePresence>
        {sparks.map(spark => (
          <motion.div
            key={spark.id}
            initial={{ opacity: 1, y: 0, x: spark.x, scale: Math.random() * 0.6 + 0.4 }}
            animate={{ 
              opacity: 0, 
              y: -Math.random() * 60 - 20, 
              x: spark.x + (Math.random() - 0.5) * 30 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: Math.random() * 0.8 + 0.5, ease: 'easeOut' }}
            className="absolute bottom-2 z-30 pointer-events-none rounded-full"
            style={{
              width: '4px',
              height: '4px',
              background: 'radial-gradient(circle, #fff 0%, #ffeb3b 30%, #ff5722 70%, transparent 100%)',
              boxShadow: '0 0 8px #ff5722'
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
