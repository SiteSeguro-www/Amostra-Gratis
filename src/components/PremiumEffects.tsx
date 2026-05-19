import React from 'react';
import { ShieldCheck, Crown } from 'lucide-react';

interface PremiumEffectsProps {
  children: React.ReactNode;
  fontStyle?: string;
  borderStyle?: string;
  backgroundStyle?: string;
  badges?: string[];
  isVerified?: boolean;
  isAdmin?: boolean;
  className?: string;
}

export const PremiumName: React.FC<PremiumEffectsProps> = ({ 
  children, 
  fontStyle, 
  badges, 
  isVerified, 
  isAdmin,
  className = "" 
}) => {
  const getFontClass = () => {
    switch (fontStyle) {
      case 'font_gradient':
        return 'bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent animate-gradient';
      case 'font_neon':
        return 'text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]';
      case 'font_rainbow':
        return 'animate-rainbow-text bg-clip-text text-transparent bg-[linear-gradient(to_right,#ef4444,#f59e0b,#10b981,#3b82f6,#8b5cf6,#ef4444)] bg-[length:200%_auto]';
      case 'font_glitch':
        return 'animate-glitch text-white relative';
      default:
        return 'text-white';
    }
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {badges?.includes('extra_crown') && (
        <Crown className="w-4 h-4 text-yellow-400 animate-bounce-slow" />
      )}
      <span className={`font-black ${getFontClass()}`}>
        {children}
      </span>
      {(isVerified || badges?.includes('extra_verified')) && (
        <img 
          src="/selo-roxo.png" 
          alt="Verificado" 
          className="w-5 h-5 object-contain" 
          referrerPolicy="no-referrer" 
        />
      )}
      {isAdmin && (
        <img src="/selo.png" alt="Admin" className="w-4 h-4" referrerPolicy="no-referrer" />
      )}
      {badges?.includes('extra_vip') && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
          VIP
        </div>
      )}
    </div>
  );
};

export const PremiumAvatar: React.FC<PremiumEffectsProps> = ({ 
  children, 
  borderStyle,
  className = "" 
}) => {
  const getBorderClass = () => {
    switch (borderStyle) {
      case 'border_neon_rotate':
        return 'p-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 animate-spin-slow';
      case 'border_pulse':
        return 'p-1 bg-purple-500 animate-pulse-slow shadow-[0_0_20px_rgba(168,85,247,0.5)]';
      case 'border_rgb':
        return 'p-1 animate-rainbow bg-[linear-gradient(to_right,#ef4444,#f59e0b,#10b981,#3b82f6,#8b5cf6,#ef4444)] bg-[length:200%_auto]';
      case 'border_fire_ice':
        return 'p-1 bg-gradient-to-tr from-orange-600 via-yellow-400 to-blue-400 animate-gradient';
      default:
        return 'p-0.5 bg-white/10';
    }
  };

  return (
    <div className={`rounded-full overflow-hidden ${getBorderClass()} ${className}`}>
      <div className="w-full h-full rounded-full bg-black p-0.5 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export const PremiumBackground: React.FC<PremiumEffectsProps> = ({ 
  children, 
  backgroundStyle,
  className = "" 
}) => {
  const getBackgroundClass = () => {
    switch (backgroundStyle) {
      case 'bg_gradient':
        return 'bg-gradient-to-br from-purple-900/40 via-black to-pink-900/40 animate-gradient bg-[length:400%_400%] relative';
      case 'bg_particles':
        return 'bg-[#0a0a0a] relative overflow-hidden after:content-[""] after:absolute after:inset-0 after:bg-[url("https://www.transparenttextures.com/patterns/stardust.png")] after:opacity-20 after:pointer-events-none';
      case 'bg_cyberpunk':
        return 'bg-black border-y border-purple-500/20 shadow-[inset_0_0_100px_rgba(168,85,247,0.1)] relative';
      case 'bg_dark_premium':
        return 'bg-[#050505] border border-white/5 shadow-2xl relative';
      default:
        return 'bg-black relative';
    }
  };

  return (
    <div className={`${getBackgroundClass()} ${className}`}>
      {children}
    </div>
  );
};
