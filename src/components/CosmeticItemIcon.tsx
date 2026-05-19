import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Frame, ImageIcon, Star } from 'lucide-react';

interface Props {
  item: {
    id: string;
    type: string;
    name?: string;
  };
  className?: string;
}

export const CosmeticItemIcon: React.FC<Props> = ({ item, className = "w-16 h-16" }) => {
  // --- Nomes (Fonts) - IMAGENS DO USUÁRIO ---
  if (item.type === 'font') {
    let imageUrl = '';
    
    // Nomes dos arquivos de imagem que o sistema vai buscar:
    if (item.id === 'font_gradient') imageUrl = '/icon-gradient.png';
    if (item.id === 'font_neon')     imageUrl = '/icon-neon.png';
    if (item.id === 'font_rainbow')  imageUrl = '/icon-rainbow.png';
    if (item.id === 'font_glitch')   imageUrl = '/icon-glitch.png';

    return (
      <motion.div 
        whileHover={{ scale: 1.1 }}
        className={`relative flex items-center justify-center ${className}`}
      >
        <img 
          src={imageUrl} 
          alt={item.name} 
          className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          // Oculta caso a imagem ainda não tenha sido enviada para a pasta public:
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        
        {/* Fallback de paleta que só aparece caso a pessoa não envie a foto png pra pasta public */}
        <Palette className="absolute w-1/2 h-1/2 text-purple-400/20 -z-10" />
      </motion.div>
    );
  }

  // Fallbacks for other types
  if (item.type === 'border') return <Frame className="w-full h-full text-blue-400 p-2" />;
  if (item.type === 'background') return <ImageIcon className="w-full h-full text-green-400 p-2" />;
  
  return <Star className="w-full h-full text-gray-400 p-2" />;
};
