import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs, limit, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { CATEGORIES, CATEGORY_SLUG_MAP } from '../constants';
import { CachedImage, MotionCachedImage } from './CachedMedia';
import VideoAdItem from './VideoAdItem';

export default function CategoryLayout({ children, activeCategory }: { children: React.ReactNode, activeCategory: string }) {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [banners, setBanners] = useState<any[]>([]);
  const [featuredServices, setFeaturedServices] = useState<any[]>([]);
  const [adConfig, setAdConfig] = useState({ videoAdEnabled: true, videoAdPosition: 'second' });
  const [carouselDuration, setCarouselDuration] = useState(6000);
  
  useEffect(() => {
    // Fetch Ad Config
    const unsubConfig = onSnapshot(doc(db, 'settings', 'video_ad_config'), (snap) => {
      if (snap.exists()) {
        setAdConfig({
          videoAdEnabled: snap.data().videoAdEnabled ?? true,
          videoAdPosition: snap.data().videoAdPosition ?? 'second'
        });
      }
    });

    const unsubCarouselConfig = onSnapshot(doc(db, 'settings', 'carousel_config'), (snap) => {
      if (snap.exists() && snap.data().duration) {
        setCarouselDuration(snap.data().duration);
      }
    });

    // 1. Fetch Manual Banners
    const qBanners = query(collection(db, 'banners'), where('active', '==', true), orderBy('order', 'asc'));
    const unsubBanners = onSnapshot(qBanners, (snap) => setBanners(snap.docs.map(d => ({ id: d.id, ...d.data(), isBanner: true }))));

    // 2. Fetch Featured Services
    const qFeatured = query(collection(db, 'services'), where('featured', '==', true));
    const unsubFeatured = onSnapshot(qFeatured, (snap) => {
        const services = snap.docs.map(d => ({ id: d.id, ...d.data(), isService: true }));
        if (services.length > 0) {
            setFeaturedServices(services);
        } else {
             // Fallback: Random services if no banners/featured
             fetchRandomServices();
        }
    });

    return () => { unsubBanners(); unsubFeatured(); unsubConfig(); unsubCarouselConfig(); };
  }, []);

  const fetchRandomServices = async () => {
      const q = query(collection(db, 'services'), limit(10));
      const snap = await getDocs(q);
      const services = snap.docs.map(d => ({ id: d.id, ...d.data(), isService: true }));
      setFeaturedServices(services.sort(() => 0.5 - Math.random()));
  };

  const activeItems = React.useMemo(() => {
    const items = [...banners, ...featuredServices];
    
    // Dynamically insert Ad into the carousel if we have content and it's enabled
    if (items.length > 0 && adConfig.videoAdEnabled) {
      let insertIndex = 0;
      if (adConfig.videoAdPosition === 'first') {
        insertIndex = 0;
      } else if (adConfig.videoAdPosition === 'second') {
        insertIndex = Math.min(1, items.length);
      } else if (adConfig.videoAdPosition === 'last') {
        insertIndex = items.length;
      }
      
      items.splice(insertIndex, 0, { id: 'native-video-ad', isAd: true });
    }
    return items;
  }, [banners, featuredServices, adConfig]);

  useEffect(() => {
    if (activeItems.length <= 1 || !carouselDuration) return;
    
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % activeItems.length);
    }, carouselDuration);
    
    return () => clearInterval(interval);
  }, [activeItems.length, carouselDuration]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white selection:bg-purple-500/30">
      <main className="max-w-[1920px] mx-auto">
        {/* Professional Header Section */}
        <div className="px-4 md:px-8 pt-8">
          <div className="relative group ring-1 ring-white/5 rounded-[2.5rem] overflow-hidden bg-[#141414] shadow-2xl">
            <AnimatePresence mode='wait'>
              {activeItems.length > 0 ? (
                <motion.div
                  key={bannerIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="relative w-full h-[300px] md:h-[450px] cursor-pointer" 
                  onClick={() => {
                    const item = activeItems[bannerIndex];
                    if (item.isAd) return; // VideoAdItem handles its own clicks
                    if (item.isBanner) item.linkUrl && navigate(item.linkUrl);
                    else navigate(`/services/${item.id}`);
                  }}
                >
                  {activeItems[bannerIndex].isAd ? (
                    <VideoAdItem />
                  ) : (
                    <>
                      <MotionCachedImage 
                        key={activeItems[bannerIndex].id}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 8, ease: "easeOut" }}
                        src={activeItems[bannerIndex].imageUrl || activeItems[bannerIndex].coverUrl} 
                        className="w-full h-full object-cover" 
                      />
                      
                      {!activeItems[bannerIndex].hideOverlay && (
                        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="max-w-4xl"
                          >
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                              <span className="px-3 py-1 bg-white text-black text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-lg">Featured</span>
                              {activeItems[bannerIndex].isService && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-black text-green-500 uppercase tracking-widest backdrop-blur-md">
                                  <ShieldCheck className="w-3.5 h-3.5" /> Verificado pela Curadoria
                                </div>
                              )}
                            </div>
                            
                            <h2 className="text-4xl md:text-7xl font-black mb-6 text-white tracking-tighter leading-none uppercase italic">
                              {activeItems[bannerIndex].title}
                            </h2>
                            
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-xl">
                                <div className="w-10 h-10 rounded-full border border-white/20 bg-purple-600/20 flex items-center justify-center">
                                  <CachedImage 
                                    src={activeItems[bannerIndex].isService 
                                      ? activeItems[bannerIndex].sellerPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeItems[bannerIndex].sellerId}`
                                      : "/selo.png"
                                    } 
                                    className="w-full h-full rounded-full object-cover"
                                    alt=""
                                  />
                                </div>
                                <div>
                                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Publicado por</p>
                                 <div className="flex items-center gap-1.5">
                                   <p className="text-sm font-black text-white">
                                     {activeItems[bannerIndex].isService ? activeItems[bannerIndex].sellerName : "PackZinhu Oficial"}
                                   </p>
                                   {(activeItems[bannerIndex].isService ? activeItems[bannerIndex].sellerVerified : true) && (
                                     <img src="/selo.png" alt="Verificado" className="w-4 h-4" referrerPolicy="no-referrer" />
                                   )}
                                 </div>
                                </div>
                              </div>
                              
                              <div className="hidden sm:flex flex-col">
                                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Preço Sugerido</p>
                                 <p className="text-2xl font-black text-green-500">R$ {Number(activeItems[bannerIndex].price || 0).toFixed(2)}</p>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Pagination Indicators */}
                  <div className="absolute right-8 bottom-8 flex gap-2">
                    {activeItems.map((_, idx) => (
                      <div 
                        key={idx} 
                        className="relative h-1.5 rounded-full bg-white/20 overflow-hidden" 
                        style={{ width: idx === bannerIndex ? '40px' : '8px' }}
                      >
                        {idx === bannerIndex && (
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            key={bannerIndex}
                            transition={{ duration: carouselDuration / 1000, ease: "linear" }}
                            className="absolute inset-0 bg-white"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="w-full h-[300px] md:h-[450px] bg-white/5 animate-pulse" />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Professional Navigation Rails */}
        <div className="sticky top-0 z-40 mt-12 px-4 md:px-8">
           <div className="bg-[#0f0f0f]/90 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => navigate(`/category/${CATEGORY_SLUG_MAP[cat]}`)}
                    className={`whitespace-nowrap px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-[0.15em] transition-all border ${
                      activeCategory === cat 
                      ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]" 
                      : "bg-transparent text-gray-400 border-transparent hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              
              <div className="hidden lg:flex items-center gap-6 px-6 border-l border-white/10">
                 <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Marketplace Seguro</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Entrega Imediata</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="pb-20">
          {children}
        </div>

        {/* Anti-Scam Footer Signal */}
        <footer className="px-4 md:px-8 py-20 border-t border-white/5 bg-gradient-to-b from-transparent to-white/[0.02]">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
              <div className="col-span-1">
                 <h3 className="text-xl font-black mb-4 uppercase tracking-tighter">PackZinhu <br /> <span className="text-gray-600">Verified Marketplace</span></h3>
                 <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    Plataforma líder em curadoria de ativos digitais. Nossos vendedores passam por rigorosos processos de verificação de identidade.
                 </p>
              </div>
              <div className="col-span-2 grid grid-cols-2 md:grid-cols-4 gap-8">
                 {[
                   { label: 'Segurança', value: 'SSL 256-bit' },
                   { label: 'Pagamentos', value: 'Mercado Pago' },
                   { label: 'Verificação', value: 'KYC Completo' },
                   { label: 'Suporte', value: '24/7 Ativo' }
                 ].map((stat, i) => (
                   <div key={i} className="flex flex-col">
                      <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2">{stat.label}</span>
                      <span className="text-lg font-black text-white">{stat.value}</span>
                   </div>
                 ))}
              </div>
           </div>
        </footer>
      </main>
    </div>
  );
}
