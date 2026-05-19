import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { getApiUrl } from '../config';
import { Send, Loader2, Bell, Trash2 } from 'lucide-react';
import { collection, addDoc, query, where, orderBy, limit, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { saveToMonio } from '../lib/monio';

export default function NotificationsAdmin() {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  
  const [notification, setNotification] = useState({
    title: '',
    message: '',
    url: ''
  });

  useEffect(() => {
    fetchHistory();
  }, []);

    const fetchHistory = async () => {
    setLoading(true);
    try {
        const qHistory = query(
          collection(db, 'notifications'), 
          where('type', '==', 'system'),
          where('recipient_id', '==', 'global'),
          orderBy('created_at', 'desc'),
          limit(20)
        );
        const snapshot = await getDocs(qHistory);
        setHistory(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Firestore history fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notification.title || !notification.message) {
      alert("Título e mensagem são obrigatórios!");
      return;
    }
    
    setSending(true);
    try {
      const notifObj = {
        sender_id: 'admin',
        sender_name: notification.title,
        sender_photo: '/icon-neon.png',
        recipient_id: 'global',
        type: 'system',
        message: notification.url ? `${notification.message} (Link: ${notification.url})` : notification.message,
        created_at: new Date().toISOString(),
        read: false
      };

      try {
        // Primary: Firestore
        const docRef = await addDoc(collection(db, 'notifications'), notifObj);
        saveToMonio('notifications', { id: docRef.id, ...notifObj });
      } catch (fsErr) {
        console.error("Firestore global notification failed", fsErr);
      }

      // also trigger web push!
      try {
          const user = auth.currentUser;
          if (user) {
              const token = await user.getIdToken();
              await fetch(getApiUrl('/api/admin/send-webpush'), {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                      title: notification.title,
                      message: notification.message,
                      url: notification.url
                  })
              });
          }
      } catch (pushErr) {
          console.error('[Web Push Error]', pushErr);
      }

      alert("Notificação global enviada para todos os usuários com sucesso!");
      setNotification({ title: '', message: '', url: '' });
      fetchHistory(); // Atualizar o histórico após o envio
    } catch (err: any) {
      console.error("Erro ao enviar notificação:", err);
      alert(`Erro: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Certeza que deseja deletar esta notificação do histórico?")) return;
    try {
      await deleteDoc(doc(db, 'notifications', id));
      
      // Dual-delete from MinIO
      const { deleteFromMonio } = await import('../lib/monio');
      deleteFromMonio('notifications', id);
      
      setHistory(history.filter(n => n.id !== id));
    } catch (err) {
      console.error("Erro ao deletar:", err);
    }
  };

  return (
    <div className="bg-[#1C1E32] rounded-2xl p-6 border border-white/5 shadow-xl max-w-3xl">
      <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
        <div className="p-3 bg-blue-500/20 rounded-xl">
          <Bell className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Notificações da Plataforma</h2>
          <p className="text-sm text-gray-400">Envie alertas, novidades e recados que aparecerão diretamente no painel (sininho) de todos os usuários logados.</p>
        </div>
      </div>
      
      <form onSubmit={handleSend} className="space-y-4 border-b border-white/5 pb-8 mb-8">
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-1.5 ml-1">Título</label>
          <input 
            type="text" 
            placeholder="Ex: Nova atualização disponível!" 
            value={notification.title} 
            onChange={(e) => setNotification({...notification, title: e.target.value})} 
            className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-colors" 
            required
            maxLength={60}
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-1.5 ml-1">Mensagem</label>
          <textarea 
            placeholder="Ex: Lançamos o novo recurso de PIX na plataforma!" 
            value={notification.message} 
            onChange={(e) => setNotification({...notification, message: e.target.value})} 
            className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-colors min-h-[100px] resize-y" 
            required
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-300 mb-1.5 ml-1">URL (Opcional - link para a notificação)</label>
          <input 
            type="url" 
            placeholder="https://..." 
            value={notification.url} 
            onChange={(e) => setNotification({...notification, url: e.target.value})} 
            className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-colors" 
          />
        </div>
        
        <div className="pt-2 flex justify-end">
          <button 
            type="submit" 
            disabled={sending} 
            className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} 
            Enviar para Todos os Usuários
          </button>
        </div>
      </form>

      <div>
        <h3 className="text-lg font-bold text-white mb-4">Histórico de Envios Recentes</h3>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 text-gray-400 animate-spin" /></div>
        ) : history.length === 0 ? (
          <div className="text-gray-500 text-sm py-4">Nenhuma notificação enviada ainda.</div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="bg-[#131524] p-4 rounded-xl border border-white/5 flex items-start gap-4 justify-between">
                <div>
                  <h4 className="text-white font-bold">{item.sender_name}</h4>
                  <p className="text-sm text-gray-400 mt-1">{item.message}</p>
                </div>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0"
                  title="Deletar Notificação"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
