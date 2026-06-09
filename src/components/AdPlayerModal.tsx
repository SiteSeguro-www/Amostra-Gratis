import { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, Shield, Lock, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const AdsterraDesktop = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    
    const params = document.createElement('script');
    params.type = 'text/javascript';
    params.text = `window.atOptions = {
      'key' : '522b21a4c1dd8d4dc41ce8d9ad4e4976',
      'format' : 'iframe',
      'height' : 90,
      'width' : 728,
      'params' : {}
    };`;
    
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//www.highperformanceformat.com/522b21a4c1dd8d4dc41ce8d9ad4e4976/invoke.js';
    
    containerRef.current.appendChild(params);
    containerRef.current.appendChild(script);
  }, []);
  
  return <div ref={containerRef} className="w-[728px] h-[90px] flex justify-center items-center overflow-hidden" />;
};

const AdsterraMobile = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    
    const params = document.createElement('script');
    params.type = 'text/javascript';
    params.text = `window.atOptions = {
      'key' : '127a5cb8bbc9df2492b630fca9793ab2',
      'format' : 'iframe',
      'height' : 250,
      'width' : 300,
      'params' : {}
    };`;
    
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//www.highperformanceformat.com/127a5cb8bbc9df2492b630fca9793ab2/invoke.js';
    
    containerRef.current.appendChild(params);
    containerRef.current.appendChild(script);
  }, []);
  
  return <div ref={containerRef} className="w-[300px] h-[250px] flex justify-center items-center overflow-hidden" />;
};

export default function AdPlayerModal({ isOpen, onClose, onComplete }: AdPlayerModalProps) {
  const [timer, setTimer] = useState(10);
  const [canUnlock, setCanUnlock] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [clickUrl, setClickUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Fetch ExoClick Video Ad
      const fetchVast = async () => {
        try {
          const response = await fetch('https://s.magsrv.com/v1/vast.php?idz=5946478');
          const xml = await response.text();
          
          const parser = new DOMParser();
          const doc = parser.parseFromString(xml, "application/xml");
          
          const mediaFile = doc.querySelector('MediaFile')?.textContent;
          const clickThrough = doc.querySelector('ClickThrough')?.textContent;
          const impressions = Array.from(doc.querySelectorAll('Impression')).map(imp => imp.textContent);

          if (mediaFile) {
            setVideoUrl(mediaFile.trim());
            impressions.forEach(url => {
              if (url) {
                const img = new Image();
                img.src = url.trim();
              }
            });
          }
          if (clickThrough) setClickUrl(clickThrough.trim());
        } catch (err) {
          console.error("Error loading ExoClick Video Ad:", err);
        }
      };
      fetchVast();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setTimer(10);
      setCanUnlock(false);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanUnlock(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div 
          key="ad-player-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-xl overflow-y-auto"
        >
        <div className="relative w-full max-w-4xl flex flex-col bg-[#0a0a0f] border border-white/10 rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl my-auto">
          {/* Header */}
          <div className="p-4 md:p-6 flex-shrink-0 border-b border-white/5 flex justify-between items-center bg-black/40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                 <Lock className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-black uppercase tracking-widest text-white leading-none">Acesso Secreto</h2>
                <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Apoie para desbloquear</p>
              </div>
            </div>
            {canUnlock && (
              <button onClick={onClose} className="p-2 flex-shrink-0 hover:bg-white/10 rounded-full transition-colors text-gray-400">
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            )}
          </div>

           {/* Ad Content */}
          <div className="w-full bg-[#050505] flex-1 flex flex-col items-center relative overflow-hidden min-h-[400px] md:min-h-[500px]">
            {/* ExoClick Video Background/Player */}
            {videoUrl && (
              <div 
                className="absolute inset-0 z-0 cursor-pointer"
                onClick={() => clickUrl && window.open(clickUrl, '_blank')}
              >
                <video 
                  src={videoUrl} 
                  autoPlay 
                  loop 
                  className="w-full h-full object-contain bg-black"
                  playsInline
                />
              </div>
            )}
            
             <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent z-10 pointer-events-none" />

             <div className="absolute bottom-6 right-0 z-30 pointer-events-none">
                  {!canUnlock ? (
                    <div className="bg-black/80 backdrop-blur-sm px-4 py-3 rounded-l border border-r-0 border-white/10 pointer-events-auto">
                      <div className="text-white text-sm font-medium">
                        O vídeo será liberado em <span className="font-bold tracking-widest">{timer}s</span>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={onComplete}
                      className="group relative px-6 py-3 bg-black/80 hover:bg-black/90 backdrop-blur-sm text-white rounded-l border border-r-0 border-white/10 font-bold text-sm tracking-wider uppercase transition-colors pointer-events-auto flex items-center gap-2"
                    >
                      <span>Pular anúncio</span>
                      <SkipForward className="w-5 h-5 fill-current" />
                    </button>
                  )}
             </div>
             
             {/* Ad Tag Badge */}
             <div className="absolute top-4 right-4 z-30 pointer-events-none">
                <div className="bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-black text-white/50 uppercase tracking-widest">
                   Publicidade
                </div>
             </div>
          </div>

          {/* Footer */}
          <div className="p-4 md:p-6 flex-shrink-0 text-center bg-black/60 border-t border-white/5">
             <div className="flex items-center justify-center gap-2 mb-1 text-green-500/50">
               <Shield className="w-3 h-3" />
               <span className="text-[9px] font-black uppercase tracking-widest">Conexão Segura e Criptografada</span>
             </div>
             <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest italic opacity-60">
               O segredo será revelado e não será necessário realizar o desbloqueio novamente nesta sessão.
             </p>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
  );
}

