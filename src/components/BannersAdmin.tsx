import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { saveToMonio } from '../lib/monio';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, setDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Link as LinkIcon, Menu, Upload, Loader2, Clock } from 'lucide-react';
import { uploadToStorage } from '../utils/upload';

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string;
  title: string;
  active: boolean;
  order: number;
  price?: string;
  hideOverlay?: boolean;
}

export default function BannersAdmin() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [carouselDuration, setCarouselDuration] = useState(6);
  const [isSavingDuration, setIsSavingDuration] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'banners'), orderBy('order', 'asc'));
    const unsubscribeBanners = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
      setBanners(data);
      setLoading(false);
    });

    const unsubscribeConfig = onSnapshot(doc(db, 'settings', 'carousel_config'), (snap) => {
      if (snap.exists() && snap.data().duration) {
        setCarouselDuration(snap.data().duration / 1000);
      }
    });

    return () => {
      unsubscribeBanners();
      unsubscribeConfig();
    };
  }, []);

  const handleSaveDuration = async () => {
    try {
      setIsSavingDuration(true);
      const config = {
        duration: carouselDuration * 1000
      };
      await setDoc(doc(db, 'settings', 'carousel_config'), config, { merge: true });
      
      // Dual-write to MinIO
      saveToMonio('settings', { id: 'carousel_config', ...config });
      
      alert("Tempo de reprodução atualizado com sucesso!");
    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar tempo: " + err.message);
    } finally {
      setIsSavingDuration(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Perform upload to storage via proxy (MinIO)
      const url = await uploadToStorage(file, 'banners');
      
      setEditingBanner(prev => prev ? { ...prev, imageUrl: url } : null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error("Error uploading banner image:", err);
      alert(`Erro no upload: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner || !editingBanner.imageUrl) return;

    try {
      if (editingBanner.id) {
        const updateData = {
          imageUrl: editingBanner.imageUrl,
          linkUrl: editingBanner.linkUrl || '',
          title: editingBanner.title || '',
          active: editingBanner.active ?? true,
          order: editingBanner.order || 0,
          price: editingBanner.price || '',
          hideOverlay: editingBanner.hideOverlay ?? false
        };
        await updateDoc(doc(db, 'banners', editingBanner.id), updateData);
        saveToMonio('banners', { id: editingBanner.id, ...updateData });
      } else {
        const newData = {
          imageUrl: editingBanner.imageUrl,
          linkUrl: editingBanner.linkUrl || '',
          title: editingBanner.title || '',
          active: editingBanner.active ?? true,
          order: banners.length,
          price: editingBanner.price || '',
          hideOverlay: editingBanner.hideOverlay ?? false
        };
        const docRef = await addDoc(collection(db, 'banners'), newData);
        saveToMonio('banners', { id: docRef.id, ...newData });
      }
      setEditingBanner(null);
    } catch (err) {
      console.error("Error saving banner:", err);
      alert("Erro ao salvar banner");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Você tem certeza que quer excluir este banner?")) {
      try {
        await deleteDoc(doc(db, 'banners', id));
      } catch (err) {
        console.error("Error deleting banner:", err);
      }
    }
  };

  return (
    <div className="bg-[#1C1E32] rounded-2xl p-6 border border-white/5 shadow-xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-bold text-white">Gestão de Banners (Início)</h2>
        
        <div className="flex items-center gap-4 w-full md:w-auto p-3 bg-black/20 rounded-xl border border-white/5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-300">Tempo (segundos):</span>
          </div>
          <input
            type="number"
            min="2"
            max="30"
            value={carouselDuration}
            onChange={(e) => setCarouselDuration(Number(e.target.value))}
            className="w-16 bg-[#131524] border border-white/10 rounded-lg px-2 py-1 text-center text-white focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleSaveDuration}
            disabled={isSavingDuration}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
          >
            {isSavingDuration ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
          </button>
        </div>

        <button
          onClick={() => setEditingBanner({ imageUrl: '', linkUrl: '', title: '', active: true, order: banners.length })}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold text-white transition-colors w-full md:w-auto"
        >
          <Plus className="w-4 h-4" /> Novo Banner
        </button>
      </div>

      {editingBanner && (
        <form onSubmit={handleSave} className="bg-zinc-900/50 p-4 border border-white/10 rounded-xl mb-6 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h3 className="font-bold">{editingBanner.id ? 'Editar Banner' : 'Adicionar Banner'}</h3>
            <button type="button" onClick={() => setEditingBanner(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">URL da Imagem ou Upload</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-[#131524] rounded-lg border border-white/10 px-3 py-2">
                  <ImageIcon className="w-4 h-4 text-gray-500 mr-2" />
                  <input 
                    type="text" 
                    value={editingBanner.imageUrl || ''} 
                    onChange={(e) => setEditingBanner({ ...editingBanner, imageUrl: e.target.value })}
                    placeholder="https://exemplo.com/imagem.png"
                    className="bg-transparent border-none outline-none w-full text-sm text-white"
                    required
                  />
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center gap-2 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Upload</span>
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">URL de Destino / Link (ao Clicar)</label>
              <div className="flex items-center bg-[#131524] rounded-lg border border-white/10 px-3 py-2">
                <LinkIcon className="w-4 h-4 text-gray-500 mr-2" />
                <input 
                  type="text" 
                  value={editingBanner.linkUrl || ''} 
                  onChange={(e) => setEditingBanner({ ...editingBanner, linkUrl: e.target.value })}
                  placeholder="/services/id-do-serviço (ou vazio)"
                  className="bg-transparent border-none outline-none w-full text-sm text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Título (Opcional)</label>
              <input 
                type="text" 
                value={editingBanner.title || ''} 
                onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                placeholder="Ex: Oferta Especial"
                className="bg-[#131524] rounded-lg border border-white/10 px-3 py-2 w-full text-sm text-white outline-none"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Preço Sugerido (Opcional)</label>
              <input 
                type="text" 
                value={editingBanner.price || ''} 
                onChange={(e) => setEditingBanner({ ...editingBanner, price: e.target.value })}
                placeholder="Ex: 99.90"
                className="bg-[#131524] rounded-lg border border-white/10 px-3 py-2 w-full text-sm text-white outline-none"
              />
            </div>
            
            <div className="flex items-center gap-6 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={editingBanner.active ?? true} 
                  onChange={(e) => setEditingBanner({ ...editingBanner, active: e.target.checked })}
                  className="w-4 h-4 bg-[#131524] border-white/10 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium">Baneer Ativo</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={editingBanner.hideOverlay ?? false} 
                  onChange={(e) => setEditingBanner({ ...editingBanner, hideOverlay: e.target.checked })}
                  className="w-4 h-4 bg-[#131524] border-white/10 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-300">Ocultar Textos (Banner Limpo)</span>
              </label>
              
              <div className="flex-1 flex justify-end">
                <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold text-white transition-colors">
                  <Save className="w-4 h-4" /> Salvar
                </button>
              </div>
            </div>
          </div>
          
          {editingBanner.imageUrl && (
            <div className="mt-4 border border-white/10 rounded-lg overflow-hidden h-32 relative">
              <img src={editingBanner.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                <span className="text-white font-bold drop-shadow-md">Pré-visualização</span>
              </div>
            </div>
          )}
        </form>
      )}

      {loading ? (
        <div className="py-8 text-center text-gray-500">Carregando banners...</div>
      ) : banners.length === 0 ? (
        <div className="py-8 text-center text-gray-500 bg-black/20 rounded-xl border border-white/5">
          Nenhum banner configurado. Adicione um para destacar na página inicial.
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner, idx) => (
            <div key={banner.id} className={`flex items-center gap-4 bg-black/20 border border-white/5 p-3 rounded-xl transition-colors hover:border-white/10 ${!banner.active ? 'opacity-50 grayscale' : ''}`}>
              <div className="w-8 flex-shrink-0 text-center text-gray-500 font-bold">
                {idx + 1}
              </div>
              <div className="w-32 h-16 rounded-md overflow-hidden flex-shrink-0 border border-white/10">
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white truncate">{banner.title || 'Sem título'}</h4>
                <p className="text-xs text-gray-400 truncate">{banner.linkUrl || 'Sem link'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${banner.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {banner.active ? 'ATIVO' : 'INATIVO'}
                </span>
                <button 
                  onClick={() => setEditingBanner(banner)}
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(banner.id)}
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
