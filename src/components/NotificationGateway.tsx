
import React, { useState, useEffect } from 'react';
import { Bell, Lock, ShieldCheck, ChevronRight, AlertCircle, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { requestNotificationPermission, getNotificationPermission, useNotificationStatus } from '../utils/notifications';

interface NotificationGatewayProps {
  onActivated?: () => void;
  showAlways?: boolean;
}

export default function NotificationGateway({ onActivated, showAlways = false }: NotificationGatewayProps) {
  const status = useNotificationStatus();
  const [isVisible, setIsVisible] = useState(false);

  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (status !== 'granted' || showAlways) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
      onActivated?.();
    }
  }, [status, showAlways, onActivated]);

  const handleActivate = async () => {
    setRequesting(true);
    const result = await requestNotificationPermission();
    setRequesting(false);
    
    if (result === 'granted') {
      onActivated?.();
    }
  };

  if (!isVisible && !showAlways) return null;

  return (
    <div className="bg-[#0f0f0f]/80 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] border border-white/10 text-center flex flex-col items-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-colors duration-1000" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors duration-1000" />

      <div className="relative mb-8">
        <div className="w-24 h-24 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-xl shadow-purple-500/20 animate-pulse">
           <Bell className="w-10 h-10 text-white" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center border-4 border-[#0f0f0f] shadow-lg">
           <Lock className="w-4 h-4" />
        </div>
      </div>

      <h3 className="text-3xl md:text-4xl font-black mb-4 text-white uppercase italic tracking-tighter leading-none">
        Conteúdo Secretos & Exclusivos
      </h3>
      
      <p className="text-gray-400 text-sm md:text-base mb-8 max-w-md font-medium leading-relaxed">
        Para desbloquear imagens e vídeos exclusivos, você <span className="text-purple-400 font-bold">deve ativar as notificações nativas</span> do navegador. Este é um requisito de segurança e fidelidade.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 w-full">
        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 text-left">
          <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-[10px] font-bold uppercase text-gray-300 tracking-wider">Acesso Imediato Liberado</span>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 text-left">
          <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-[10px] font-bold uppercase text-gray-300 tracking-wider">Notificações Secretas</span>
        </div>
      </div>

      <button
        onClick={handleActivate}
        disabled={requesting}
        className="group relative w-full h-16 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 bg-[length:200%_auto] hover:bg-[100%_center] p-[1px] rounded-2xl transition-all duration-500 active:scale-95 shadow-xl shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="w-full h-full bg-[#0f0f0f] group-hover:bg-transparent rounded-2xl flex items-center justify-center transition-all duration-500">
          <span className="text-white text-lg font-black uppercase italic tracking-tighter flex items-center gap-3">
            {requesting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Verificando...
              </>
            ) : (
              <>
                Ativar Notificações do Navegador <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </span>
        </div>
      </button>

      <p className="mt-6 text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">
        Ambiente Seguro & Protegido
      </p>
      
      {status === 'denied' && (
        <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-bounce">
          <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-400 font-bold text-left leading-relaxed lowercase tracking-tight">
            Parece que você bloqueou as notificações. Vá nas configurações do site (cadeado na barra de endereços) e selecione "Permitir" para as notificações.
          </p>
        </div>
      )}
    </div>
  );
}
