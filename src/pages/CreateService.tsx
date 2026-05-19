import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, getDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { uploadToStorage } from '../utils/upload';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Package, Upload, X } from 'lucide-react';
import { compressImage } from '../utils/imageCompression';
import { saveToMonio } from '../lib/monio';

export default function CreateService() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('pack-sensual');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    async function fetchService() {
      if (id && user) {
        setIsEditing(true);
        const docRef = doc(db, 'services', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().sellerId === user.uid) {
          const data = docSnap.data();
          setTitle(data.title || '');
          setDescription(data.description || '');
          setPrice(data.price?.toString() || '');
          setCategory(data.category || 'pack-sensual');
          setCoverPreview(data.coverUrl || '');
        } else {
          // Service not found or not the owner
          navigate('/dashboard?tab=services');
        }
      }
    }
    fetchService();
  }, [id, user, navigate]);

  const handleFile = async (f: File) => {
    let file = f;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (isImage && file.size > 10 * 1024 * 1024) {
      alert('Imagens devem ter no máximo 10MB.');
      return;
    }
    if (isVideo && file.size > 100 * 1024 * 1024) {
      alert('Vídeos devem ter no máximo 100MB.');
      return;
    }
    
    if (isImage && file.type !== 'image/gif') {
      try {
        file = await compressImage(file, 1920, 1080, 0.8);
      } catch (err) {
        console.error("Error compressing image:", err);
      }
    }
    
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
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
    if (!user) return;
    if (!title.trim()) {
      alert('Por favor, insira um título para o serviço.');
      return;
    }

    setLoading(true);
    try {
      // Fetch latest user profile to ensure correct name and photo
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      let coverUrl = '';
      let coverType = '';
      if (coverFile) {
        console.log('Iniciando upload da capa:', coverFile.name);
        coverType = coverFile.type.startsWith('video/') ? 'video' : 'image';
        
        try {
          coverUrl = await uploadToStorage(coverFile, `services/${user.uid}`, (progress) => {
            setUploadProgress(progress);
          });
          console.log('Upload concluído via proxy:', coverUrl);
        } catch (error: any) {
          console.error('Upload error:', error);
          throw new Error('Falha no upload. ' + error.message);
        }
      }

      const isAdmin = userData.role === 'admin' || userData.email === 'dweminem@gmail.com' || userData.email === 'contato.packzinhu@gmail.com';

      if (isEditing && id) {
        const updateData: any = {
          title,
          description,
          price: parseFloat(price) || 0,
          category,
          updatedAt: new Date().toISOString(),
          sellerVerified: isAdmin
        };
        if (coverUrl) {
          updateData.coverUrl = coverUrl;
          updateData.coverType = coverType;
        }
        await updateDoc(doc(db, 'services', id), updateData);
        saveToMonio('services', { id, action: 'update', ...updateData });
      } else {
        const serviceData = {
          sellerId: user.uid,
          sellerName: userData.displayName || user.displayName || 'Vendedor',
          sellerPhoto: userData.photoURL || user.photoURL || '',
          sellerVerified: isAdmin,
          title,
          description,
          price: parseFloat(price) || 0,
          category,
          coverUrl,
          coverType,
          createdAt: new Date().toISOString(),
          rating: 0,
          reviewCount: 0,
          salesCount: 0
        };
        const docRef = await addDoc(collection(db, 'services'), serviceData);
        saveToMonio('services', { id: docRef.id, action: 'create', ...serviceData });
      }

      // Navegar para a home com a categoria selecionada
      navigate('/', { state: { category: category } });
    } catch (error: any) {
      console.error('Error saving service:', error);
      alert(`Erro ao salvar serviço: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="py-20 text-center">Faça login para {isEditing ? 'editar' : 'criar'} um serviço.</div>;

  return (
    <div className="py-8 px-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
          <Package className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-black text-white">{isEditing ? 'Editar Serviço' : 'Criar Novo Serviço'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#1C1E32] border border-white/5 rounded-3xl p-8 shadow-xl space-y-6">
        <div>
          <label className="block text-sm font-bold text-white mb-2">Título do Serviço</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Design de Logotipo Profissional"
            className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-white mb-2">Descrição</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva detalhadamente o que você oferece..."
            rows={5}
            className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition-colors resize-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-white mb-2">Preço (R$)</label>
            <input 
              type="number" 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="5"
              className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-white mb-2">Categoria</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition-colors appearance-none"
            >
              <option value="sexting">Sexting</option>
              <option value="avaliacao">Avaliação</option>
              <option value="chamada-video">Chamada de Video</option>
              <option value="pack-pe">Pack do Pé</option>
              <option value="pack-explicito">Pack fotos e videos Explicito</option>
              <option value="pack-sensual">Pack fotos e videos Sensual</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-white mb-2">Capa do Serviço (Imagem, Vídeo ou GIF)</label>
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-2xl overflow-hidden border-2 border-dashed transition-all ${isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'}`}
          >
            {coverPreview ? (
              <div className="relative group aspect-video bg-[#131524]">
                {coverFile?.type.startsWith('video/') ? (
                  <video src={coverPreview} className="w-full h-full object-cover" controls />
                ) : (
                  <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                )}
                <button 
                  type="button"
                  onClick={() => {
                    setCoverFile(null);
                    setCoverPreview('');
                  }}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-red-500 text-white rounded-full backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-5 h-5" />
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
            ) : (
              <label className="flex flex-col items-center justify-center w-full aspect-video bg-[#131524] cursor-pointer hover:bg-white/5 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 text-gray-400 mb-3" />
                  <p className="mb-2 text-sm text-gray-400"><span className="font-bold text-purple-400">Clique para fazer upload</span> ou arraste e solte</p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF ou MP4 (Máx. 100MB)</p>
                </div>
                <input type="file" className="hidden" accept="image/*,video/*,.gif" onChange={handleFileChange} />
              </label>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex justify-end gap-4">
          <button 
            type="button"
            onClick={() => navigate('/dashboard?tab=services')}
            className="px-6 py-3 rounded-xl font-bold text-gray-300 hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50"
          >
            {loading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Publicar Serviço')}
          </button>
        </div>
      </form>
    </div>
  );
}
