import { useState, useEffect } from 'react';

interface TypingEffectProps {
  text: string;
  speed?: number;
  deleteSpeed?: number;
  pauseDuration?: number;
}

export default function TypingEffect({ 
  text, 
  speed = 80, 
  deleteSpeed = 40,
  pauseDuration = 3000 
}: TypingEffectProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'deleting'>('typing');

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (phase === 'typing') {
      if (displayedText.length < text.length) {
        timeout = setTimeout(() => {
          setDisplayedText(text.slice(0, displayedText.length + 1));
        }, speed);
      } else {
        timeout = setTimeout(() => {
          setPhase('deleting');
        }, pauseDuration);
      }
    } else if (phase === 'deleting') {
      if (displayedText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedText(text.slice(0, displayedText.length - 1));
        }, deleteSpeed);
      } else {
        timeout = setTimeout(() => {
          setPhase('typing');
        }, 500); // short pause before re-typing
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedText, phase, text, speed, deleteSpeed, pauseDuration]);

  return (
    <span className="inline-flex items-center">
      {displayedText}
      <span className="animate-pulse ml-1 text-2xl leading-none" style={{ filter: 'drop-shadow(0 0 5px rgba(236, 72, 153, 0.5))' }}>💋</span>
    </span>
  );
}
