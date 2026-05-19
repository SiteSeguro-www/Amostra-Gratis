import { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, Shield, Lock } from 'lucide-react';
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
  const [timer, setTimer] = useState(5);
  const [canUnlock, setCanUnlock] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setTimer(5);
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
          <div className="w-full bg-black flex-1 flex flex-col items-center justify-center relative min-h-[400px] py-12 px-4 shadow-inner">
             {/* Desktop Banner 728x90 */}
             <div className="hidden md:flex flex-col items-center justify-center w-full max-w-[728px] min-h-[90px] bg-white/5 rounded-xl border border-white/10 overflow-hidden mb-8 relative">
                <div className="absolute inset-0 flex items-center justify-center -z-10 bg-[#0a0a0f]">
                  <span className="text-[10px] text-white/10 font-black tracking-widest uppercase">Publicidade</span>
                </div>
                {isDesktop && <AdsterraDesktop />}
             </div>

             {/* Mobile Banner 300x250 */}
             <div className="flex md:hidden flex-col items-center justify-center w-full max-w-[300px] min-h-[250px] bg-white/5 rounded-xl border border-white/10 overflow-hidden mb-8 relative">
               <div className="absolute inset-0 flex items-center justify-center -z-10 bg-[#0a0a0f]">
                  <span className="text-[10px] text-white/10 font-black tracking-widest uppercase">Publicidade</span>
               </div>
               {!isDesktop && <AdsterraMobile />}
             </div>

             <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.1)] mb-6">
                <Shield className="w-8 h-8 text-purple-500/60" />
             </div>
             
             <div className="space-y-4 px-6 max-w-md mx-auto text-center">
                {!canUnlock ? (
                  <>
                    <div className="text-2xl font-black text-white tracking-widest uppercase animate-pulse">
                      Desbloqueando em {timer}s
                    </div>
                    <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-[0.2em] font-medium leading-relaxed">
                      Aguarde a verificação para liberar o conteúdo secreto. Seu apoio ajuda a manter nossos conteúdos exclusivos.
                    </p>
                  </>
                ) : (
                  <button 
                    onClick={onComplete}
                    className="group relative px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-2xl font-black text-sm md:text-base uppercase tracking-[0.2em] transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
                  >
                    <span>ACESSAR CONTEÚDO</span>
                    <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                )}
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

