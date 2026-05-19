import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { motion, useAnimationControls } from 'framer-motion';

export default function FeedCarousel() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const controls = useAnimationControls();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(10));
        const snapshot = await getDocs(q);
        const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Duplicate posts for infinite scroll effect
        setPosts([...postsData, ...postsData]);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching carousel posts:", error);
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading || posts.length === 0) return null;

  return (
    <div className="w-full overflow-hidden py-6 mb-8 relative">
      <div className="flex items-center gap-2 mb-4 px-2">
        <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Destaques do Feed</h3>
      </div>
      
      <div className="relative">
        <motion.div 
          className="flex gap-0"
        animate={{
          x: [0, -50 + "%"]
        }}
        transition={{
          duration: 40,
          ease: "linear",
          repeat: Infinity,
        }}
        style={{ width: "max-content" }}
      >
        {posts.map((post, idx) => {
          const isTextOnly = !post.mediaUrl;
          
          return (
            <Link 
              key={`${post.id}-${idx}`}
              to={`/feed?post=${post.id}`}
              className={`flex-shrink-0 w-64 h-40 rounded-2xl overflow-hidden relative group transition-all ${
                isTextOnly ? 'bg-transparent' : 'bg-[#1C1E32]'
              }`}
            >
              {post.mediaUrl ? (
                <>
                  {post.mediaType === 'video' ? (
                    <video src={post.mediaUrl} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    <img src={post.mediaUrl} alt="Post" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center p-6 relative">
                  {/* Subtle glow for text-only posts */}
                  <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <p className="text-sm text-gray-300 line-clamp-4 text-center font-medium leading-relaxed italic relative z-10">
                    "{post.content}"
                  </p>
                </div>
              )}
              
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 z-20">
                <img 
                  src={post.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`} 
                  alt={post.authorName} 
                  className="w-6 h-6 rounded-full border border-white/20 object-cover"
                />
                <span className="text-[10px] font-bold text-white truncate drop-shadow-md">{post.authorName}</span>
              </div>
            </Link>
          );
        })}
        </motion.div>
      </div>
    </div>
  );
}
