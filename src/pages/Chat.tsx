import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { uploadToStorage } from '../utils/upload';
import { saveToMonio } from '../lib/monio';
import { CachedImage, CachedVideo } from '../components/CachedMedia';
import { useAuth } from '../components/FirebaseAuthProvider';
import { Send, ArrowLeft, Paperclip } from 'lucide-react';

export default function Chat() {
  const { id } = useParams<{ id: string }>(); // sellerId or other user Id
  const { user, profile: currentUserProfile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch other user info
  useEffect(() => {
    if (!id) return;
    const fetchOtherUser = async () => {
      const docRef = doc(db, 'users', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setOtherUser(docSnap.data());
      }
    };
    fetchOtherUser();
  }, [id]);

  // Find or create chat in Supabase
  useEffect(() => {
    if (!user || !id) return;

    const fetchChat = async () => {
      if (!user || !id) return;
      try {
        // Use Firestore as primary
        const qC = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', user.uid)
        );
        const fsSnap = await getDocs(qC);
        const fsChat = fsSnap.docs.find(doc => {
          const parts = doc.data().participants;
          return parts.includes(id);
        });

        if (fsChat) {
          setChatId(fsChat.id);
        } else {
          // Create New Chat (Primary in Firestore)
          const newFsChatId = [user.uid, id].sort().join('_');
          const chatData = {
            participants: [user.uid, id],
            updated_at: new Date().toISOString(),
            last_message: ''
          };
          await setDoc(doc(db, 'chats', newFsChatId), chatData);
          setChatId(newFsChatId);
        }
      } catch (err) {
        console.error("Chat sync error:", err);
      }
    };

    fetchChat();
  }, [user, id]);

  // Listen to messages (Primary Firestore Realtime)
  useEffect(() => {
    if (!chatId) return;

    // Setup Firestore Listen
    const qM = query(
      collection(db, 'messages'),
      where('chat_id', '==', chatId),
      orderBy('created_at', 'asc')
    );

    const unsubscribe = onSnapshot(qM, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      
      // Auto scroll
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }, (error) => {
      console.warn("Firestore messages listen failed:", error);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `chat_media/${chatId}/${fileName}`;
      
      let downloadURL = '';

      try {
        downloadURL = await uploadToStorage(file, `chat_media/${chatId}`);
        console.log('Upload concluído via proxy:', downloadURL);
      } catch (uploadError: any) {
        console.error('Upload error:', uploadError);
        throw new Error('Falha no envio do arquivo: ' + uploadError.message);
      }
      
      let fileType = 'FILE';
      if (file.type.startsWith('image/')) fileType = 'IMAGE';
      else if (file.type.startsWith('video/')) fileType = 'VIDEO';
      else if (file.type.startsWith('audio/')) fileType = 'AUDIO';

      const text = `FILE:${fileType}:${downloadURL}`;
      const messageObj = {
        chat_id: chatId,
        sender_id: user.uid,
        text,
        created_at: new Date().toISOString()
      };

      try { await addDoc(collection(db, 'messages'), messageObj); } catch(err) {}
      
      // Dual-write to MinIO
      saveToMonio('messages', messageObj);

      const last_message = fileType === 'IMAGE' ? '📷 Imagem' : fileType === 'VIDEO' ? '🎥 Vídeo' : '🎵 Áudio';
      try {
        const chatRef = doc(db, 'chats', chatId);
        await updateDoc(chatRef, { updated_at: new Date().toISOString(), last_message });
      } catch(err) {}

      // Send notification
      if (otherUser && id) {
        const notifObj = {
          recipient_id: id,
          sender_id: user.uid,
          sender_name: currentUserProfile?.displayName || user.displayName || 'Alguém',
          sender_photo: currentUserProfile?.photoURL || user.photoURL || '',
          type: 'message',
          related_id: chatId,
          message: 'te enviou um arquivo',
          read: false,
          created_at: new Date().toISOString()
        };
        try { await addDoc(collection(db, 'notifications'), notifObj); } catch(e) {}
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Erro ao enviar arquivo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !user) return;

    const text = newMessage;
    const now = new Date().toISOString();
    setNewMessage('');

    const messageObj = {
      chat_id: chatId,
      sender_id: user.uid,
      text,
      created_at: now
    };

    try {
      // 1. Firestore Write
      try {
        await addDoc(collection(db, 'messages'), messageObj);
        await updateDoc(doc(db, 'chats', chatId), { updated_at: now, last_message: text });
      } catch (fsErr) { console.error("Firestore message send failed:", fsErr); }

      // 2. Save to Monio
      saveToMonio('messages', messageObj);

      // 3. Notification
      if (otherUser && id) {
        const notifObj = {
          recipient_id: id,
          sender_id: user.uid,
          sender_name: currentUserProfile?.displayName || user.displayName || 'Alguém',
          sender_photo: currentUserProfile?.photoURL || user.photoURL || '',
          type: 'message',
          related_id: chatId,
          message: 'te enviou uma mensagem',
          read: false,
          created_at: now
        };

        try { await addDoc(collection(db, 'notifications'), notifObj); } catch(e) {}
      }
      
      // Local optimistic update if needed, or just let the fetch handle it
    } catch (error) {
      console.error("Error in send message process:", error);
    }
  };

  const renderMessageContent = (text: string) => {
    if (text.startsWith('FILE:IMAGE:')) {
      const url = text.replace('FILE:IMAGE:', '');
      return <CachedImage src={url} alt="Imagem enviada" className="max-w-full rounded-lg mt-1 mb-1 max-h-64 object-contain" />;
    } else if (text.startsWith('FILE:VIDEO:')) {
      const url = text.replace('FILE:VIDEO:', '');
      return <CachedVideo src={url} controls className="max-w-full rounded-lg mt-1 mb-1 max-h-64" />;
    } else if (text.startsWith('FILE:AUDIO:')) {
      const url = text.replace('FILE:AUDIO:', '');
      return <audio src={url} controls className="max-w-full mt-1 mb-1" />;
    } else if (text.startsWith('FILE:FILE:')) {
      const url = text.replace('FILE:FILE:', '');
      return <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-blue-300">Arquivo anexado</a>;
    }
    return <p className="whitespace-pre-wrap break-words">{text}</p>;
  };

  if (!user) return <div className="py-20 text-center">Faça login para acessar o chat.</div>;

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-160px)] flex flex-col bg-[#1C1E32] border border-white/5 rounded-3xl overflow-hidden mt-6 shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-[#131524]">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {otherUser && (
          <div className="flex items-center gap-3">
            <img 
              src={otherUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`} 
              alt="Profile" 
              className="w-10 h-10 rounded-full object-cover bg-[#1C1E32]"
            />
            <div className="flex items-center gap-1">
              <h3 className="font-bold">{otherUser.displayName}</h3>
              {(otherUser.isVerified || otherUser.role === 'admin' || otherUser.email === 'dweminem@gmail.com' || otherUser.email === 'contato.packzinhu@gmail.com') && (
                <img src="/selo.png" alt="Verificado" className="w-5 h-5" referrerPolicy="no-referrer" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {(messages || []).map((msg) => {
          const isMine = msg?.sender_id === user?.uid;
          const isSystem = msg?.sender_id === 'system';
          return (
            <div key={msg?.id} className={`flex ${isSystem ? 'justify-center' : isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${isSystem ? 'bg-yellow-500/10 text-yellow-200 border border-yellow-500/30 text-sm shadow-lg' : isMine ? 'bg-purple-600 text-white rounded-br-sm shadow-md' : 'bg-[#131524] text-gray-200 rounded-bl-sm border border-white/5 shadow-md'}`}>
                {renderMessageContent(msg?.text || '')}
                <span className={`text-[10px] opacity-50 mt-1 block ${isSystem ? 'text-center' : 'text-right'}`}>
                  {msg?.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-[#131524] flex gap-2 items-center">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          accept="image/*,video/*,audio/*" 
        />
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-3 bg-[#1C1E32] rounded-full text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          title="Anexar arquivo"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={uploading ? "Enviando arquivo..." : "Digite uma mensagem..."}
          disabled={uploading}
          className="flex-1 bg-[#1C1E32] border border-white/5 rounded-full px-4 py-2 outline-none focus:border-purple-500 transition-colors text-white placeholder:text-gray-500 disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim() || uploading}
          className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
