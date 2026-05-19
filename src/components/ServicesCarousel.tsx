import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ServicesCarousel({ services }: { services: any[] }) {
  if (!services || services.length === 0) return null;

  // Duplicate services for infinite scroll effect
  const displayServices = [...services, ...services, ...services];

  return (
    <div className="w-full overflow-hidden py-10 relative">
      <motion.div 
        className="flex gap-0"
        animate={{
          x: [0, -33.33 + "%"]
        }}
        transition={{
          duration: 50,
          ease: "linear",
          repeat: Infinity,
        }}
        style={{ width: "max-content" }}
      >
        {displayServices.map((service, idx) => (
          <motion.div
            key={`${service.id}-${idx}`}
            whileHover={{ 
              y: -10,
              scale: 1.02,
              boxShadow: "0 25px 50px -12px rgba(168, 85, 247, 0.4)",
            }}
            className="relative w-72 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden group transition-all duration-500 flex flex-col flex-shrink-0"
          >
            {/* Glass Shine Effect */}
            <div className="glass-shine-effect" />
            
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <Link to={`/profile/${service?.sellerId}`} className="relative aspect-[4/3] overflow-hidden bg-[#131524] block">
              {service?.coverUrl ? (
                service?.coverType === 'video' || service?.coverUrl?.includes('.mp4') ? (
                  <video src={service.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" autoPlay loop muted playsInline />
                ) : (
                  <img src={service.coverUrl} alt={service?.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">Sem imagem</div>
              )}
              <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-white/10 z-20">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-xs font-bold text-white">{service?.rating || 'Novo'}</span>
              </div>
            </Link>
            
            <div className="p-5 flex-1 flex flex-col relative z-10">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="relative">
                  <img src={service?.sellerPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${service?.sellerId}`} alt={service?.sellerName} className="w-7 h-7 rounded-full object-cover ring-2 ring-purple-500/30" />
                </div>
                <Link to={`/profile/${service?.sellerId}`} className="shining-name text-sm font-medium truncate hover:opacity-80 transition-opacity flex items-center gap-1">
                  {service?.sellerName}
                  {service?.sellerVerified && (
                    <img src="/selo.png" alt="Verificado" className="w-4 h-4" referrerPolicy="no-referrer" />
                  )}
                </Link>
              </div>
              
              <Link to={`/profile/${service?.sellerId}`} className="block mb-2">
                <h3 className="font-bold text-lg line-clamp-1 group-hover:text-purple-400 transition-colors duration-300">{service?.title}</h3>
              </Link>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">A partir de</span>
                  <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                    R$ {(Number(service?.price) || 0).toFixed(2)}
                  </div>
                </div>
                
                <Link 
                  to={`/services/${service?.id}`}
                  className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all shadow-lg hover:scale-110 active:scale-90"
                >
                  <ShoppingCart className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
