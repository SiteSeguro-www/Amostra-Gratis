import React, { useState } from 'react';
import { Mail, Send, CheckCircle } from 'lucide-react';
import { db } from '../firebase';
import { saveToMonio } from '../lib/monio';
import { collection, addDoc } from 'firebase/firestore';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const emailData = {
        ...formData,
        to: 'contato.packzinhu@gmail.com', // For logging context
        type: 'received',
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'site_emails'), emailData);
      
      // Dual-write to MinIO
      saveToMonio('site_emails', emailData);
      
      setIsSent(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erro ao enviar mensagem. Tente novamente mais tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full py-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-[#1C1E32] p-8 md:p-12 rounded-3xl border border-white/5">
          <h1 className="text-4xl font-black text-white mb-8">Contato</h1>
          <div className="space-y-6 text-gray-300">
            <p>Se você tiver dúvidas, sugestões ou precisar de suporte, envie uma mensagem através do formulário ou pelo nosso e-mail oficial.</p>
            
            <div className="flex items-center gap-4 p-6 bg-[#131524] rounded-2xl border border-white/10">
              <Mail className="w-8 h-8 text-purple-500" />
              <div>
                <h3 className="font-bold text-white">E-mail Direto</h3>
                <a href="mailto:contato.packzinhu@gmail.com" className="text-purple-400 hover:text-purple-300">contato.packzinhu@gmail.com</a>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 italic">Responderemos o mais breve possível, geralmente em até 24 horas úteis.</p>
          </div>
        </div>

        <div className="bg-[#1C1E32] p-8 md:p-12 rounded-3xl border border-white/5 shadow-2xl">
          {isSent ? (
            <div className="text-center py-10 flex flex-col items-center gap-4">
              <div className="p-4 bg-green-500/20 rounded-full text-green-500">
                <CheckCircle className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold text-white">Mensagem Enviada!</h2>
              <p className="text-gray-400">Obrigado pelo seu contato. Analisaremos sua mensagem e responderemos em breve.</p>
              <button 
                onClick={() => setIsSent(false)}
                className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors"
              >
                Enviar Outra Mensagem
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Seu nome"
                  className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-2 text-white focus:border-purple-500 outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Seu E-mail</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="seu@email.com"
                    className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-2 text-white focus:border-purple-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Assunto</label>
                  <input 
                    type="text" 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="Assunto"
                    className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-2 text-white focus:border-purple-500 outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Mensagem</label>
                <textarea 
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Como podemos ajudar?"
                  className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-2 text-white focus:border-purple-500 outline-none h-32 resize-none"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div> : <><Send className="w-4 h-4" /> Enviar Mensagem</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
