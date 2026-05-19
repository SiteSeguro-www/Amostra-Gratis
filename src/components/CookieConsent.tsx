import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setShow(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[9998] w-full"
        >
          <div className="bg-[#111827] border-t border-white/10 px-4 md:px-8 py-4 sm:py-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
            <div className="flex-1 max-w-5xl">
              <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                Utilizamos cookies essenciais e tecnologias semelhantes de acordo com a nossa{' '}
                <a href="#" className="text-blue-500 hover:text-blue-400 underline transition-colors">
                  Política de Privacidade
                </a>
                . Ao continuar navegando, você concorda com estas condições.
              </p>
            </div>
            
            <div className="flex w-full md:w-auto flex-row gap-3">
              <button
                onClick={handleReject}
                className="flex-1 md:flex-none px-6 py-3 bg-transparent text-gray-200 font-bold text-sm rounded-lg border border-gray-600 hover:bg-gray-800 transition-all whitespace-nowrap"
              >
                Rejeitar
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-all whitespace-nowrap"
              >
                Aceitar Cookies
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
