import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AgeVerification() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isVerified = localStorage.getItem('age-verified');
    if (!isVerified) {
      setShow(true);
      document.body.style.overflow = 'hidden';
    }
  }, []);

  const handleVerify = () => {
    localStorage.setItem('age-verified', 'true');
    setShow(false);
    document.body.style.overflow = 'auto';
  };

  const handleExit = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        >
          <div className="max-w-md w-full bg-[#131524]/95 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 text-center shadow-2xl">
            <div className="w-20 h-20 bg-purple-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-purple-500/20">
              <span className="text-3xl font-black text-purple-500 italic">18+</span>
            </div>
            
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">
              Conteúdo Restrito
            </h2>
            
            <p className="text-gray-400 mb-10 italic leading-relaxed">
              Este site contém conteúdo adulto e é destinado apenas a maiores de 18 anos. Ao entrar, você confirma que possui idade legal.
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={handleVerify}
                className="w-full py-5 bg-white text-black font-black uppercase italic tracking-widest rounded-full hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                Tenho +18 anos / Entrar
              </button>
              
              <button
                onClick={handleExit}
                className="w-full py-5 bg-white/5 text-gray-500 font-black uppercase italic tracking-widest rounded-full border border-white/5 hover:bg-white/10 transition-all"
              >
                Sair do site
              </button>
            </div>
            
            <p className="mt-8 text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">
              Copyright © 2026 PackZinhu
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
