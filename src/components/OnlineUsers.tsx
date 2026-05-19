import { useState, useEffect } from 'react';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

export default function OnlineUsers() {
  const [members, setMembers] = useState<any[]>([]);

  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Try Cache First to avoid repetitive reads
        const cached = localStorage.getItem('packzinhu_members_pool');
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 86400000) { // 24 hour cache for the pool
            setMembers(shuffleArray(data).slice(0, 30));
            return;
          }
        }

        const q = query(
          collection(db, 'users'),
          limit(100) 
        );
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          displayName: doc.data().displayName,
          photoURL: doc.data().photoURL,
          email: doc.data().email,
          role: doc.data().role,
          isVerified: doc.data().isVerified
        }));
        
        setMembers(shuffleArray(users).slice(0, 30));

        localStorage.setItem('packzinhu_members_pool', JSON.stringify({
          data: users,
          timestamp: Date.now()
        }));

      } catch (error: any) {
        if (error.message?.includes('Quota exceeded')) {
          console.warn("Members fetch suppressed due to quota");
        }
      }
    };

    fetchMembers();
  }, []);

  return (
    <div className="bg-[#121212] border border-white/5 rounded-[2rem] p-4 md:p-6 shadow-xl overflow-hidden">
      <div className="mb-4 flex items-center justify-between px-2">
        <h2 className="text-sm md:text-xl font-black text-white uppercase tracking-tighter italic opacity-80 font-sans">
          Membros
        </h2>
      </div>
      
      <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide select-none px-2">
        {members.length > 0 && members.map(user => {
          if (!user) return null;
          const isVerified = user.isVerified || user.role === 'admin' || user.email === 'dweminem@gmail.com' || user.email === 'contato.packzinhu@gmail.com';
          
          return (
            <Link 
              to={`/profile/${user.id}`} 
              key={user.id} 
              className="flex flex-col md:flex-row items-center gap-2 md:gap-4 hover:bg-white/5 p-1 rounded-2xl transition-all group flex-shrink-0"
            >
                <div className="relative">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-full p-0.5 bg-gradient-to-tr from-purple-600/20 to-pink-600/20 group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-500">
                    <img 
                      src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                      alt={user.displayName} 
                      className="w-full h-full rounded-full border-2 border-[#121212] object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                
                <div className="hidden md:flex flex-col md:flex-row md:items-center gap-1 min-w-0 text-center md:text-left">
                  <span className="text-xs md:text-base font-black text-white truncate max-w-[80px] md:max-w-[150px]">
                    {user.displayName?.split(' ')[0] || 'Membro'}
                  </span>
                  {isVerified && (
                    <img src="/selo.png" alt="Verificado" className="w-4 h-4 flex-shrink-0 mx-auto md:mx-0" referrerPolicy="no-referrer" />
                  )}
                </div>
            </Link>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}

