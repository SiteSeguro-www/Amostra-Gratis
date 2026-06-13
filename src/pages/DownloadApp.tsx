import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, ShieldCheck, Download, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

// Interface customizada para o evento beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function DownloadApp() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      // Impede o Chrome de exibir o mini-infobar padrão na tela inicial
      e.preventDefault();
      // Salva o evento para ser acionado posteriormente pelo botão
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleDownload = async () => {
    if (installPrompt) {
      // Mostra o prompt de instalação nativo
      installPrompt.prompt();
      // Aguarda a resposta do usuário
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        // Se aceito, não precisamos mais do prompt armazenado neste estado
        setInstallPrompt(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-24 pb-32">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-pink-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-xs mb-6 uppercase tracking-widest"
          >
            <ShieldCheck className="w-4 h-4" />
            Download 100% Seguro & Verificado
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tighter uppercase italic"
          >
            Leve o <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">PackZinhu</span> <br />
            para o seu dispositivo
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Acesse seus conteúdos favoritos com mais velocidade, notificações em tempo real e privacidade total através do nosso aplicativo oficial.
          </motion.p>
        </div>

        {/* Main Download Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-[#131524]/50 border border-white/10 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-xl shadow-2xl overflow-hidden relative"
        >
          {/* Subtle Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
          
          <div className="flex flex-col items-center">
            {/* Device Icons Transition */}
            <div className="flex items-center gap-8 mb-10">
              <div className="flex flex-col items-center gap-3">
                <Smartphone className="w-12 h-12 text-purple-500" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Mobile / APK</span>
              </div>
              <div className="h-px w-12 bg-white/10" />
              <div className="flex flex-col items-center gap-3">
                <Monitor className="w-12 h-12 text-blue-500" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Desktop / PC</span>
              </div>
            </div>

            <h2 className="text-2xl font-black text-white mb-8 text-center uppercase tracking-tight">
              Instalador Unificado
            </h2>

            <button
              onClick={handleDownload}
              className="group relative w-full max-w-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity" />
              <div className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6 rounded-2xl text-white font-black text-xl uppercase tracking-wider transition-transform active:scale-95">
                <Download className="w-6 h-6" />
                Baixar Aplicativo
              </div>
            </button>

            <p className="mt-6 text-gray-500 text-sm font-medium">
              Versão 2.4.0 • 12MB • Compatível com Android & Windows
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Livre de Vírus</p>
                <p className="text-gray-500 text-[10px] uppercase">Auditado diariamente</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Privacidade Total</p>
                <p className="text-gray-500 text-[10px] uppercase">Criptografia de ponta</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <div className="w-5 h-5 rounded-full border-2 border-purple-500 flex items-center justify-center">
                   <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                </div>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Auto-Atualizável</p>
                <p className="text-gray-500 text-[10px] uppercase">Sempre a última versão</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Warning Block */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.5 }}
           className="mt-12 bg-amber-500/5 border border-amber-500/20 p-6 rounded-3xl flex items-start gap-4"
        >
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-amber-500 font-bold text-sm uppercase tracking-widest mb-1">Aviso Importante</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              O PackZinhu preza pela sua segurança. Baixe o aplicativo <span className="text-white font-bold">apenas através deste canal oficial</span>. Nunca compartilhe sua senha ou instale arquivos de fontes desconhecidas que se passam por nosso serviço.
            </p>
          </div>
        </motion.div>

        {/* Steps Section */}
        <div className="mt-20">
          <h3 className="text-2xl font-black text-white text-center mb-10 uppercase italic">Como Instalar</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Baixe o Arquivo", desc: "Clique no botão acima para iniciar o download do instalador." },
              { step: "02", title: "Autorize Fontes", desc: "No Android, habilite 'Instalar de fontes desconhecidas' se solicitado." },
              { step: "03", title: "Tudo Pronto", desc: "Abra o aplicativo e entre com sua conta PackZinhu normalmente." }
            ].map((item, idx) => (
              <div key={idx} className="relative group">
                <span className="text-6xl font-black text-white/5 absolute -top-4 -left-2 transition-colors group-hover:text-purple-500/10">
                  {item.step}
                </span>
                <div className="relative pt-6">
                  <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                    {item.title}
                    <ArrowRight className="w-3 h-3 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
