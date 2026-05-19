import { useState, useEffect } from 'react';
import { collection, query, limit, orderBy, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ShoppingBag, Zap, ShieldCheck, MoreVertical, CheckCircle2, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { CATEGORY_SLUG_MAP } from '../constants';
import { CachedImage, CachedVideo } from './CachedMedia';
import MobileBannerAd from './MobileBannerAd';
import HorizontalBannerAd from './HorizontalBannerAd';
import AdPlacement from './AdPlacement';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  coverUrl?: string;
  coverType?: string;
  sellerId: string;
  sellerName: string;
  sellerPhoto: string;
  sellerVerified?: boolean;
  featured?: boolean;
  salesCount?: number;
  createdAt?: any;
  category?: string;
}

export default function FeedView({ initialCategory = "Todos" }: { initialCategory?: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    setLoading(true);
    
    // Determine the slug for the category
    let categorySlug = activeCategory;
    
    // If it's a display name, convert to slug
    if (CATEGORY_SLUG_MAP[activeCategory]) {
      categorySlug = CATEGORY_SLUG_MAP[activeCategory];
    }

    let q = query(collection(db, 'services'), orderBy('createdAt', 'desc'), limit(50));
    
    if (categorySlug !== "todos" && categorySlug !== "Todos") {
      q = query(
        collection(db, 'services'), 
        where('category', '==', categorySlug),
        limit(50)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      
      if (categorySlug !== "todos" && categorySlug !== "Todos") {
        data = data.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      }

      
      setServices(data);
      setLoading(false);
    }, (err) => {
      console.error("Error in FeedView Snapshot:", err);
      setLoading(false);
      if (err.message.includes('Quota exceeded')) {
        // Handle quota exceeded gracefully in state if needed, or just log
        setServices([]);
      }
    });

    return () => unsubscribe();
  }, [activeCategory]);

  return (
    <div className="px-4 md:px-8 py-10 relative">
      {/* Category Trust Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-10">
         <div className="flex-1 w-full">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic mb-8 text-center md:text-left">
               {activeCategory === 'todos' || activeCategory === 'Todos' ? 'Explorar Acervo' : `Coleção: ${activeCategory}`}
            </h2>
            
            {/* Mobile View with Centered Ad */}
            <div className="flex md:hidden justify-center w-full mb-8">
              {isMobile && (
                <div className="flex items-center justify-center p-2 bg-white/5 rounded-3xl border border-white/5">
                  <MobileBannerAd />
                </div>
              )}
            </div>
         </div>
         
         {/* Desktop-only buttons */}
         <div className="hidden md:flex flex-wrap items-center gap-4">
            <Link to="/faq" className="flex items-center gap-3 px-6 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-purple-500/30 rounded-2xl backdrop-blur-md transition-all cursor-pointer">
               <HelpCircle className="w-5 h-5 text-pink-500" />
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Suporte</span>
                  <span className="text-xs font-black text-white uppercase">Dúvidas (FAQ)</span>
               </div>
            </Link>
            <div className="flex items-center gap-3 px-6 py-3 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-md">
               <ShieldCheck className="w-5 h-5 text-purple-500" />
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Proteção</span>
                  <span className="text-xs font-black text-white uppercase">Checkout Seguro</span>
               </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-md">
               <CheckCircle2 className="w-5 h-5 text-blue-500" />
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Vendedores</span>
                  <span className="text-xs font-black text-white uppercase">100% Verificados</span>
               </div>
            </div>
         </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-8 gap-x-3 sm:gap-y-10 sm:gap-x-4">
          {[1,2,3,4,5,6,7,8,9,10].map(i => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-video bg-white/5 animate-pulse rounded-xl" />
            </div>
          ))}
        </div>
      ) : services.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-y-8 gap-x-3 sm:gap-y-10 sm:gap-x-4">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Nenhum serviço encontrado</h3>
        </div>
      )}

      {/* Horizontal Banner Ad (728x90) - Only shown on PC */}
      {!isMobile && <HorizontalBannerAd />}

      {/* Adsterra Native Ad Container */}
      <div className="mt-20 flex flex-col items-center">
        <div className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em] mb-4">Recomendado para você</div>
        <AdPlacement placementKey="feed-middle" className="w-full max-w-7xl" />
      </div>
    </div>
  );
}

const FALLBACK_MEDIA: Record<string, string> = {
  "sexting": "https://cdn.packzinhu.online/packzinhu-db/images/sexting.jpeg",
  "avaliacao": "https://cdn.packzinhu.online/packzinhu-db/images/avalia%C3%A7%C3%A3o.jpeg",
  "chamada-video": "https://cdn.packzinhu.online/packzinhu-db/images/chamada%20de%20video.jpeg",
  "pack-pe": "https://cdn.packzinhu.online/packzinhu-db/images/pack%20do%20p%C3%A9.jpeg",
  "pack-explicito": "https://cdn.packzinhu.online/packzinhu-db/images/pack%20de%20fotos%20e%20videos.jpeg",
  "pack-sensual": "https://cdn.packzinhu.online/packzinhu-db/images/pack%20de%20fotos%20e%20videos.jpeg"
};

function ServiceCard({ service }: { service: Service }) {
  const navigate = useNavigate();

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/checkout/${service.id}`);
  };
  
  const categorySlug = service.category || 'sexting';
  const fallback = FALLBACK_MEDIA[categorySlug] || "https://cdn.packzinhu.online/packzinhu-db/images/default.jpg";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group cursor-pointer flex flex-col gap-3 sm:gap-4 bg-[#141414] ring-1 ring-white/5 p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem] hover:ring-white/10 hover:bg-[#1a1a1a] transition-all duration-500 shadow-xl"
      onClick={() => navigate(`/services/${service.id}`)}
    >
    <div className="relative aspect-[4/3] rounded-[1rem] sm:rounded-[1.5rem] overflow-hidden bg-black flex items-center justify-center">
      {service.coverUrl?.includes('.mp4') || service.coverType?.startsWith('video') || service.coverUrl?.includes('video') ? (
        <CachedVideo 
          src={service.coverUrl || ""}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
        />
      ) : (
        <CachedImage 
          src={service.coverUrl || fallback}
          fallbackSrc={fallback}
          alt={`Capa de ${service.title} - Venda de fotos de pés no PackZinhu`}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
          loading="lazy"
        />
      )}
        
        {/* Floating Badges */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-wrap gap-1.5 sm:gap-2 z-10">
          <div className="bg-black/60 backdrop-blur-xl text-white text-[8px] sm:text-[9px] font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/10 flex items-center gap-1 sm:gap-1.5 uppercase tracking-widest shadow-2xl">
            <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400" /> Instant
          </div>
          {service.featured && (
             <div className="bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.5)] text-white text-[8px] sm:text-[9px] font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-full uppercase tracking-widest">
                Elite
             </div>
          )}
        </div>

        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-10">
           <div className="bg-white text-green-600 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black shadow-2xl transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
              R$ {service.price.toFixed(2)}
           </div>
        </div>

        {/* Professional Buy Button */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center z-20 backdrop-blur-sm">
           <motion.button 
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={handleBuy}
             className="px-8 py-3 bg-white text-black font-black rounded-2xl shadow-[0_10px_30px_rgba(255,255,255,0.2)]"
           >
             ADQUIRIR ACESSO
           </motion.button>
        </div>
      </div>

      <div className="px-1 flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col gap-1.5">
           <h3 className="text-sm sm:text-lg font-black text-white line-clamp-2 leading-tight tracking-tight uppercase italic group-hover:text-purple-400 transition-colors">
             {service.title}
           </h3>
           <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={(e) => { e.stopPropagation(); navigate(`/profile/${service.sellerId}`); }}
                className="flex items-center gap-1.5 sm:gap-2 group/seller"
              >
                <img 
                  src={service.sellerPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${service.sellerId}`} 
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white/10"
                  alt=""
                />
                <span className="text-[9px] sm:text-[11px] font-bold text-gray-500 group-hover/seller:text-white transition-colors uppercase tracking-widest">
                  {service.sellerName}
                </span>
                {service.sellerVerified && <CheckCircle2 size={9} className="text-blue-400" />}
              </button>
              <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white/10 rounded-full" />
              <span className="text-[9px] sm:text-[11px] font-black text-gray-600 uppercase tracking-widest">
                 {service.salesCount || 0} Ativ.
              </span>
           </div>
        </div>
        
        <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-white/5">
           <div className="flex flex-col">
              <span className="text-[8px] sm:text-[10px] text-gray-600 font-bold uppercase tracking-widest">Preço</span>
              <span className="text-base sm:text-xl font-black text-green-500">R$ {service.price.toFixed(2)}</span>
           </div>
           <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 group-hover:border-purple-500/50 group-hover:text-purple-500 transition-all">
              <MoreVertical size={14} />
           </div>
        </div>
      </div>
    </motion.div>
  );
}
