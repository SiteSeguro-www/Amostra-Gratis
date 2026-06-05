import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { saveToMonio } from '../lib/monio';
import { uploadToStorage } from '../utils/upload';
import { CachedImage, CachedVideo } from './CachedMedia';
import { Lock, Eye, Plus, Trash2, Image as ImageIcon, Video, X, Loader2, Play, Maximize, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdPlayerModal from './AdPlayerModal';
import NotificationGateway from './NotificationGateway';
import { isNotificationActive, useNotificationStatus } from '../utils/notifications';
import { compressImage } from '../utils/imageCompression';

interface SecretContent {
  id: string;
  url: string;
  type: 'image' | 'video';
  authorId: string;
  createdAt: any;
}

interface SecretContentSectionProps {
  userId: string;
  isOwner: boolean;
}

export default function SecretContentSection({ userId, isOwner }: SecretContentSectionProps) {
  const status = useNotificationStatus();
  const [contents, setContents] = useState<SecretContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isAdsModalOpen, setIsAdsModalOpen] = useState(false);
  const [pendingUnlockId, setPendingUnlockId] = useState<string | null>(null);
  const [viewingContent, setViewingContent] = useState<SecretContent | null>(null);
  const [showNotificationGateway, setShowNotificationGateway] = useState(false);

  useEffect(() => {
    if (status !== 'granted') {
      // Don't automatically show here to avoid annoying profile visitors
      // but keep it ready for handleItemClick
    } else {
      setShowNotificationGateway(false);
    }
  }, [status]);

  useEffect(() => {
    setLoading(true);

    // Background load from Minio
    import('../lib/monio').then(({ loadFromMonio }) => {
      loadFromMonio('secret_contents').then(minioContents => {
        if (minioContents && Array.isArray(minioContents)) {
          const userContents = minioContents.filter(c => c.authorId === userId);
          if (userContents.length > 0) {
            setContents(prev => {
              const merged = [...prev];
              userContents.forEach(mc => {
                if (!merged.find(c => c.id === mc.id)) merged.push(mc);
              });
              return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            });
            setLoading(false);
          }
        }
      });
    });

    const q = query(
      collection(db, "secret_contents"),
      where("authorId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SecretContent[];
      setContents(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching secret contents:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    
    // Convert FileList to array
    const fileArray = Array.from(files);

    for (const file of fileArray) {
        try {
          const isVideo = file.type.startsWith('video/');
          const type = isVideo ? 'video' : 'image';
          
          let finalFile = file;
          if (!isVideo) {
            finalFile = await compressImage(file, 1200, 1200, 0.8);
          }
    
          const publicUrl = await uploadToStorage(finalFile, `secret_contents/${userId}`);
    
          const docRef = await addDoc(collection(db, "secret_contents"), {
            authorId: userId,
            url: publicUrl,
            type,
            createdAt: serverTimestamp()
          });
    
          // Dual-write to MinIO
          saveToMonio('secret_contents', {
            id: docRef.id,
            authorId: userId,
            url: publicUrl,
            type,
            createdAt: new Date().toISOString()
          });
          
        } catch (err: any) {
          console.error("Error uploading secret content:", err);
          alert(`Erro ao enviar arquivo: ${file.name} - ${err.message || 'Erro desconhecido'}`);
        }
    }
    setUploading(false);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Tem certeza que deseja deletar este conteúdo?")) return;
    try {
      await deleteDoc(doc(db, "secret_contents", id));
      if (viewingContent?.id === id) setViewingContent(null);
    } catch (err) {
      console.error("Error deleting secret content:", err);
    }
  };

  const handleItemClick = (item: SecretContent) => {
    // Check for notifications first
    if (status !== 'granted') {
      setShowNotificationGateway(true);
      return;
    }

    // If owner, unlock without ad
    if (isOwner) {
      setViewingContent(item);
      return;
    }

    // Otherwise, show ad
    setPendingUnlockId(item.id);
    setIsAdsModalOpen(true);
  };

  const handleAdComplete = () => {
    if (pendingUnlockId) {
      // Open the content
      const content = contents.find(c => c.id === pendingUnlockId);
      if (content) {
        setViewingContent(content);
      }
      setPendingUnlockId(null);
    }
    setIsAdsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-black mb-1 flex items-center gap-3 text-white uppercase italic tracking-tighter">
            <Lock className="w-6 h-6 text-purple-500" /> Conteúdos Secretos
          </h3>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">Conteúdo sensível e exclusivo</p>
        </div>
        
        {isOwner && (
          <label className="relative flex items-center gap-2 px-6 py-2.5 bg-white text-black text-xs font-black rounded-xl uppercase tracking-widest cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {uploading ? "Enviando..." : "Adicionar Novo"}
            <input 
              type="file"
              multiple 
              accept="image/*,video/*" 
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {contents.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-md p-16 rounded-[2.5rem] border border-white/10 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
             <Lock className="w-10 h-10 text-gray-600" />
          </div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Este usuário ainda não publicou conteúdos secretos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {contents.map((item) => {
            const isUnlocked = isOwner;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-square rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 group cursor-pointer"
                onClick={() => handleItemClick(item)}
              >
                {item.type === 'video' ? (
                  <CachedVideo 
                    src={item.url} 
                    className={`w-full h-full object-cover transition-all duration-700 ${!isUnlocked ? 'blur-lg scale-110 brightness-[0.8]' : 'group-hover:scale-110'}`} 
                    muted
                    loop
                    playsInline
                    autoPlay={isUnlocked}
                  />
                ) : (
                  <CachedImage 
                    src={item.url} 
                    alt="Secret content" 
                    className={`w-full h-full object-cover transition-all duration-700 ${!isUnlocked ? 'blur-lg scale-110 brightness-[0.8]' : 'group-hover:scale-110'}`} 
                  />
                )}

                {/* Overlay for locked items */}
                {!isUnlocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                     <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center mb-3 shadow-2xl transition-transform group-hover:scale-110">
                        <Lock className="w-5 h-5" />
                     </div>
                     <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] drop-shadow-lg text-center px-4">
                       Clique para ver
                     </span>
                  </div>
                )}

                {/* Type Icon Tag */}
                <div className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-white z-20">
                   {item.type === 'video' ? <Video className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                </div>

                {/* Owner Actions */}
                {isOwner && (
                  <button 
                    onClick={(e) => handleDelete(item.id, e)}
                    className="absolute top-4 right-4 p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 z-30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Glass Shine */}
                <div className="glass-shine-effect" />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full Screen Viewer */}
      <AnimatePresence>
        {viewingContent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4"
          >
            <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
              {isOwner && (
                <button 
                  onClick={() => handleDelete(viewingContent.id)}
                  className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={() => {
                   if (!document.fullscreenElement) {
                     document.documentElement.requestFullscreen().catch(console.error);
                   } else {
                     document.exitFullscreen().catch(console.error);
                   }
                }}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <Maximize className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setViewingContent(null)}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl"
            >
              {viewingContent.type === 'video' ? (
                <CachedVideo 
                  src={viewingContent.url} 
                  className="max-w-full max-h-[90vh] object-contain rounded-3xl"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <CachedImage 
                  src={viewingContent.url} 
                  alt="Full view" 
                  className="max-w-full max-h-[90vh] object-contain rounded-3xl" 
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdPlayerModal 
        isOpen={isAdsModalOpen}
        onClose={() => {
          setIsAdsModalOpen(false);
          setPendingUnlockId(null);
        }}
        onComplete={handleAdComplete}
      />

      {/* Notification Gateway Overlay */}
      <AnimatePresence>
        {showNotificationGateway && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-3xl p-4"
          >
            <div className="relative w-full max-w-2xl px-2">
              <NotificationGateway onActivated={() => setShowNotificationGateway(false)} />
              
              {/* Optional escape button for accessibility, but very subtle */}
              <button 
                onClick={() => setShowNotificationGateway(false)}
                className="mt-6 text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors block mx-auto underline"
              >
                Continuar sem notificações (Não recomendado)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}