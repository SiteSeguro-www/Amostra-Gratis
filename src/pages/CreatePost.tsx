import { useState } from 'react';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, Video, Send } from 'lucide-react';
import { compressImage } from '../utils/imageCompression';
import { uploadToStorage, syncToLocalBackup } from '../utils/upload';
import { saveToMonio } from '../lib/monio';

export default function CreatePost() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  if (!user) {
    return <div className="py-20 text-center">Faça login para criar um post.</div>;
  }

  const handleFile = async (f: File) => {
    let selectedFile = f;
    const isImage = selectedFile.type.startsWith('image/');
    const isVideo = selectedFile.type.startsWith('video/');

    if (isImage && selectedFile.size > 10 * 1024 * 1024) {
      alert('Imagens devem ter no máximo 10MB.');
      return;
    }
    if (isVideo && selectedFile.size > 100 * 1024 * 1024) {
      alert('Vídeos devem ter no máximo 100MB.');
      return;
    }
    
    if (isImage && selectedFile.type !== 'image/gif') {
      try {
        selectedFile = await compressImage(selectedFile, 1920, 1080, 0.8);
      } catch (err) {
        console.error("Error compressing image:", err);
      }
    }
    
    setFile(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content && !file) return;

    setLoading(true);
    try {
      // Fetch latest user profile to ensure correct name and photo
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      let mediaUrl = '';
      let mediaType = '';

      if (file) {
        mediaType = file.type.startsWith('video/') ? 'video' : 'image';
        
        try {
          mediaUrl = await uploadToStorage(file, `posts/${user.uid}`, (progress) => {
            setUploadProgress(progress);
          });
          console.log('Upload concluído via proxy:', mediaUrl);
        } catch (error: any) {
          console.error('Upload error:', error);
          throw new Error('Falha no upload. ' + error.message);
        }
      }

      const isVerified = userData.isVerified || userData.role === 'admin' || userData.email === 'dweminem@gmail.com' || userData.email === 'contato.packzinhu@gmail.com';
      
      const postData = {
        authorId: user.uid,
        authorName: userData.displayName || user.displayName || 'Usuário',
        authorPhoto: userData.photoURL || user.photoURL || '',
        authorVerified: isVerified,
        authorFontStyle: userData.fontStyle || null,
        authorBorderStyle: userData.borderStyle || null,
        authorBackgroundStyle: userData.backgroundStyle || null,
        authorBadges: userData.badges || [],
        authorRole: userData.role || 'user',
        authorEmail: userData.email || '',
        content,
        mediaUrl,
        mediaType,
        createdAt: new Date().toISOString(),
        likesCount: 0,
        commentsCount: 0
      };

      const docRef = await addDoc(collection(db, 'posts'), postData);
      
      // Sync to Local Backup (MinIO + SQL)
      await syncToLocalBackup('post', { id: docRef.id, ...postData });

      // Sync to Monio
      saveToMonio('posts', { id: docRef.id, ...postData });

      // Global Notification for everyone
      try {
        const notifObj = {
          recipient_id: 'global',
          sender_id: user.uid,
          sender_name: userData.displayName || user.displayName || 'Usuário',
          sender_photo: userData.photoURL || user.photoURL || '',
          type: 'feed_post',
          message: 'postou algo novo no Feed Global! 🔥',
          read: false,
          created_at: new Date().toISOString()
        };
        await addDoc(collection(db, 'notifications'), notifObj);
        saveToMonio('notifications', notifObj);
      } catch (notifErr) {
        console.error('Error creating global notification in Firestore:', notifErr);
      }

      navigate('/feed');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Erro ao criar post. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
        Criar Novo Post
      </h1>

      <form 
        onSubmit={handleSubmit} 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-[#1C1E32] border rounded-3xl p-6 shadow-lg transition-all ${isDragging ? 'border-purple-500 bg-purple-500/10 scale-[1.02]' : 'border-white/5'}`}
      >
        <div className="flex gap-4 mb-6">
          <img 
            src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
            alt="Profile" 
            className="w-12 h-12 rounded-full border border-white/10"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="O que você quer compartilhar? (Arraste mídias aqui)"
            className="w-full bg-transparent border-none outline-none resize-none text-lg min-h-[120px] placeholder:text-gray-600 text-white"
          />
        </div>

        {file && (
          <div className="mb-6 relative rounded-xl overflow-hidden bg-[#131524] border border-white/5">
            {file.type.startsWith('video/') ? (
              <video src={URL.createObjectURL(file)} controls className="max-h-64 mx-auto" />
            ) : (
              <img src={URL.createObjectURL(file)} alt="Preview" className="max-h-64 mx-auto object-contain" />
            )}
            <button 
              type="button" 
              onClick={() => setFile(null)}
              className="absolute top-2 right-2 bg-black/80 text-white p-2 rounded-full hover:bg-red-500 transition-colors"
            >
              ✕
            </button>
            
            {loading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
                <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-white text-sm font-bold">{Math.round(uploadProgress)}%</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex gap-2">
            <label className="p-3 bg-white/5 rounded-full cursor-pointer hover:bg-white/10 transition-colors text-purple-400">
              <ImageIcon className="w-5 h-5" />
              <input type="file" accept="image/*,.gif" className="hidden" onChange={handleFileChange} />
            </label>
            <label className="p-3 bg-white/5 rounded-full cursor-pointer hover:bg-white/10 transition-colors text-pink-400">
              <Video className="w-5 h-5" />
              <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading || (!content && !file)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          >
            {loading ? 'Postando...' : (
              <>
                Postar <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
