import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Lock, Eye, AlertTriangle, Flame, ShieldAlert, Sparkles, ChevronRight, CheckCircle2, Zap, X, Maximize, Bell } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import AdPlayerModal from '../components/AdPlayerModal';
import NotificationGateway from '../components/NotificationGateway';
import { isNotificationActive, useNotificationStatus } from '../utils/notifications';
import { getApiUrl } from '../config';

export default function Exclusivos() {
  const status = useNotificationStatus();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockedPosts, setUnlockedPosts] = useState<string[]>([]);
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [viewingContent, setViewingContent] = useState<any | null>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [showNotificationGateway, setShowNotificationGateway] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Immediate check on mount and status change
    if (status !== 'granted') {
      setShowNotificationGateway(true);
    } else {
      setShowNotificationGateway(false);
    }
  }, [status]);

  useEffect(() => {
    const fetchBg = async () => {
      try {
        const response = await fetch(getApiUrl('/api/random-background'));
        const data = await response.json();
        if (data.success && data.url) {
          setBgImage(data.url);
        }
      } catch (err) {
        console.error('Error fetching bg:', err);
      }
    };
    fetchBg();
  }, []);

  useEffect(() => {
    const fetchExclusivos = async () => {
      try {
        // Sincroniza todos os conteúdos secretos de todos os usuários
        const q = query(
          collection(db, 'secret_contents'),
          orderBy('createdAt', 'desc'),
          limit(30)
        );
        const querySnapshot = await getDocs(q);
        const fetchedPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error fetching exclusivos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExclusivos();
  }, []);

  const handleUnlockRequest = (postId: string) => {
    if (!isNotificationActive()) {
      setShowNotificationGateway(true);
      return;
    }
    setActivePostId(postId);
    setAdModalOpen(true);
  };

  const handleAdComplete = () => {
    if (activePostId) {
      setUnlockedPosts(prev => [...prev, activePostId]);
      
      const content = posts.find(c => c.id === activePostId);
      if (content) {
        setViewingContent(content);
      }
      
      setAdModalOpen(false);
      setActivePostId(null);
    }
  };

  const getRandomLabel = () => {
    const labels = ["🔒 Desbloquear Conteúdo", "🔐 Acessar Segredo", "🔓 Ver Mesmo Assim"];
    return labels[Math.floor(Math.random() * labels.length)];
  };

  const getRandomOverlayText = () => {
    const texts = [
      "🔓 Ver Mesmo Assim",
      "🔒 Conteúdo bloqueado",
      "👀 Só para curiosos",
      "🔥 Conteúdo sensível",
      "⚠️ Você foi avisado",
      "💜 Não deveria estar vendo isso"
    ];
    return texts[Math.floor(Math.random() * texts.length)];
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-20 pb-32 overflow-hidden relative">
      <Helmet>
        <title>🔒 Conteúdos Secretos | PackZinhu Exclusivos</title>
        <meta name="description" content="Acesse conteúdos exclusivos e secretos. Só para quem tem coragem. Vídeos e fotos privadas sem filtro." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Dynamic Background */}
      {bgImage && (
        <div className="fixed inset-0 z-0 bg-[#0f0f0f]">
          <motion.img 
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.5, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src={bgImage} 
            alt="background" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f0f]/70 via-black/50 to-[#0f0f0f] z-10" />
        </div>
      )}
      {!bgImage && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-purple-900/20 via-[#0f0f0f] to-transparent pointer-events-none blur-[100px] z-0" />
      )}

      {/* Hero Section */}
      <div className="max-w-3xl mx-auto px-4 mb-16 text-center relative z-10">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8"
        >
          <Lock className="w-3 h-3" />
          Acesso VIP Exclusivo
        </motion.div>

        <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter leading-tight mb-4">
          Conteúdos Secretos
        </h1>
        
        <div className="space-y-4 max-w-xl mx-auto text-gray-400 italic">
          <p className="text-lg md:text-xl font-medium leading-relaxed">
            Momentos intensos, pedidos privados e conteúdo sem filtro. 
          </p>
          <p className="opacity-60 text-sm">
            Somente para quem não tem medo de ver o que os criadores escondem. Clique por sua conta e risco.
          </p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 z-10 relative">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
             {[1, 2, 3, 4, 5, 6].map(i => (
               <div key={i} className="aspect-[3/4] bg-white/5 rounded-[1.5rem] md:rounded-[2.5rem] animate-pulse" />
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
            {posts.map((post) => {
              const isUnlocked = unlockedPosts.includes(post.id);
              
              return (
                <div key={post.id} className="relative group aspect-[3/4] rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border border-white/10 bg-black shadow-2xl transition-all duration-500 hover:border-purple-500/30">
                  {/* Media Content */}
                  <div className="absolute inset-0 z-0 bg-black">
                    {post.type === 'video' ? (
                      <video 
                        src={post.url} 
                        className={`w-full h-full object-cover transition-all duration-1000 ${isUnlocked ? 'blur-0 scale-100' : 'blur-[80px] scale-125 opacity-40 group-hover:scale-150'}`}
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img 
                        src={post.url || post.coverUrl || post.mediaUrl || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=800&q=80"} 
                        alt="Exclusivo" 
                        className={`w-full h-full object-cover transition-all duration-1000 ${isUnlocked ? 'blur-0 scale-100' : 'blur-[80px] scale-125 opacity-40 group-hover:scale-150'}`}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90 pointer-events-none" />
                  </div>

                    {/* UI Overlay */}
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 md:p-8 text-center cursor-pointer" onClick={() => {
                    console.log("Post clicked:", post);
                    isUnlocked ? setViewingContent(post) : handleUnlockRequest(post.id);
                  }}>
                    {!isUnlocked ? (
                      <>
                        <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-500">
                          <Lock className="w-5 h-5 md:w-8 md:h-8 text-purple-500" />
                        </div>
                        <h3 className="text-xs md:text-xl font-black text-white uppercase italic tracking-tighter mb-1 md:mb-2 line-clamp-2 px-1">
                          {getRandomOverlayText()}
                        </h3>
                        <p className="text-gray-500 text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-4 md:mb-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          Clique por sua conta e risco…
                        </p>
                        <button 
                          onClick={() => handleUnlockRequest(post.id)}
                          className="px-4 py-2.5 md:px-8 md:py-4 w-full bg-purple-600 rounded-xl md:rounded-2xl text-white font-black uppercase italic tracking-widest text-[9px] md:text-sm shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:bg-purple-500 active:scale-95 transition-all"
                        >
                          {getRandomLabel()}
                        </button>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-6 text-left cursor-pointer" onClick={() => navigate(`/creator/${post.authorId}`)}>
                         <div className="p-3 md:p-4 rounded-2xl md:rounded-3xl bg-black/60 backdrop-blur-md border border-white/10">
                            <h4 className="text-sm md:text-lg font-black text-white italic uppercase tracking-tighter line-clamp-1">Conteúdo Secreto</h4>
                            <div className="mt-2 md:mt-4 flex items-center gap-1.5 md:gap-2 text-purple-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                               <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3" />
                               Ver Perfil do Criador
                            </div>
                         </div>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="absolute top-2 left-2 md:top-4 md:left-4 z-20 flex flex-col gap-1.5 md:gap-2">
                     <div className="px-2 py-1 rounded bg-[#0f0f0f]/80 backdrop-blur-md border border-white/10 text-[8px] font-black italic text-gray-300 tracking-[0.2em] uppercase">
                        +18 Apenas
                     </div>
                     <div className="px-2 py-1 rounded bg-purple-900/40 backdrop-blur-md border border-purple-500/30 text-[8px] font-black italic text-purple-300 tracking-[0.2em] uppercase">
                        Restrito
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Real Ad Modal Integration */}
      <AdPlayerModal 
        isOpen={adModalOpen}
        onClose={() => setAdModalOpen(false)}
        onComplete={handleAdComplete}
      />

      {/* Notification Gateway Overlay */}
      <AnimatePresence>
        {showNotificationGateway && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-3xl p-4"
          >
            <div className="relative w-full max-w-2xl px-2">
              <NotificationGateway onActivated={() => setShowNotificationGateway(false)} />
              
              {/* Optional escape button for accessibility, but very subtle */}
              <button 
                onClick={() => setShowNotificationGateway(false)}
                className="mt-6 text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors block mx-auto underline"
              >
                Continuar sem notificações (Não recomendado)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

       {/* Full Screen Viewer */}
       <AnimatePresence>
        {viewingContent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4"
          >
            <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
              <button 
                onClick={() => {
                   if (!document.fullscreenElement) {
                     document.documentElement.requestFullscreen().catch(console.error);
                   } else {
                     document.exitFullscreen().catch(console.error);
                   }
                }}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <Maximize className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setViewingContent(null)}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl"
            >
              {viewingContent.type === 'video' || (viewingContent.url && viewingContent.url.includes('.mp4')) ? (
                <video 
                  src={viewingContent.url} 
                  className="max-w-full max-h-[90vh] object-contain rounded-3xl"
                  controls
                  autoPlay
                  playsInline
                />
              ) : viewingContent.url ? (
                <img 
                  src={viewingContent.url} 
                  alt="Full view" 
                  className="max-w-full max-h-[90vh] object-contain rounded-3xl" 
                />
              ) : (
                <div className="text-white p-4">Conteúdo não disponível</div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Guards */}
      <div className="fixed bottom-10 right-4 pointer-events-none opacity-20 hidden md:block">
         <div className="text-[8px] font-black text-gray-500 uppercase tracking-[0.5em] rotate-90 origin-right whitespace-nowrap">
            CONTEÚDO PRIVADO • ACESSO RESTRITO
         </div>
      </div>
    </div>
  );
}
