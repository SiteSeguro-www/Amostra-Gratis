import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Link } from 'react-router-dom';
import { MessageSquare, Search } from 'lucide-react';

export default function ChatList() {
  const [user] = useAuthState(auth);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    // Listen to Firestore 'chats' collection in real-time
    const qC = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updated_at', 'desc')
    );
    
    const unsubscribe = onSnapshot(qC, async (snapshot) => {
      const fsChatsRaw = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const fsChatsData = await Promise.all(fsChatsRaw.map(async (chat: any) => {
        const otherUserId = chat.participants.find((p: string) => p !== user.uid);
        const userDoc = await getDoc(doc(db, 'users', otherUserId));
        const userData = userDoc.exists() ? userDoc.data() : {};

        return {
          ...chat,
          otherUserId,
          otherUserName: userData.displayName || 'Usuário',
          otherUserPhoto: userData.photoURL || '',
          otherUserUsername: userData.username || '',
          otherUserVerified: userData.isVerified,
          otherUserRole: userData.role,
          otherUserEmail: userData.email,
        };
      }));
      setChats(fsChatsData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore chat list listen failed:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredChats = chats.filter(chat => 
    chat.otherUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.otherUserUsername.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) return <div className="py-20 text-center">Faça login para ver suas mensagens.</div>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-600 rounded-2xl shadow-lg shadow-purple-500/20">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-black">Mensagens</h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar conversas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1C1E32] border border-white/5 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-purple-500 transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : filteredChats.length === 0 ? (
        <div className="text-center py-20 bg-[#1C1E32] rounded-3xl border border-white/5">
          <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma conversa encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredChats.map(chat => (
            <Link 
              key={chat.id} 
              to={`/chat/${chat.otherUserId}`}
              className="flex items-center gap-4 p-4 bg-[#1C1E32] hover:bg-[#252841] border border-white/5 rounded-2xl transition-all group"
            >
              <img 
                src={chat.otherUserPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.otherUserId}`} 
                alt="Profile" 
                className="w-14 h-14 rounded-2xl object-cover border border-white/10"
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors truncate flex items-center gap-1">
                    {chat.otherUserName}
                    {(chat.otherUserVerified || chat.otherUserRole === 'admin' || chat.otherUserEmail === 'dweminem@gmail.com' || chat.otherUserEmail === 'contato.packzinhu@gmail.com') && (
                      <img src="/selo.png" alt="Verificado" className="w-4 h-4 flex-shrink-0" referrerPolicy="no-referrer" />
                    )}
                  </h3>
                  <span className="text-[10px] text-gray-500">
                    {new Date(chat.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-400 truncate">
                  {chat.last_message || 'Inicie uma conversa...'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
