import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { saveToMonio } from '../lib/monio';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { Save, Loader2, Play, Plus, Trash2, Edit2, CheckCircle, XCircle, DatabaseBackup } from 'lucide-react';

export interface CustomAd {
  id: string;
  name: string;
  network: 'adsterra' | 'other';
  format: 'banner' | 'native' | 'popunder' | 'slider';
  status: 'active' | 'inactive';
  code: string; 
  placement: string; 
  targetDevice: 'all' | 'desktop' | 'mobile';
  pages: string[];
}

const DEFAULT_ADS: Omit<CustomAd, 'id'>[] = [
  {
    name: 'Adsterra Social Bar',
    network: 'adsterra',
    format: 'popunder',
    status: 'active',
    placement: 'global',
    targetDevice: 'all',
    pages: ['all'],
    code: `<script type='text/javascript' src='//pl28162812.effectivegatecpm.com/1fde2f6c0ce1510f2791e8477610058e/invoke.js' async></script>\n<script type='text/javascript' src='//pl28162985.effectivegatecpm.com/4463fe627c26bd539316d2e61df3f3d7/invoke.js' async></script>`
  },
  {
    name: 'Adsterra Native Global',
    network: 'adsterra',
    format: 'native',
    status: 'active',
    placement: 'global',
    targetDevice: 'all',
    pages: ['all'],
    code: `<script async="async" data-cfasync="false" src="//pl28162927.effectivegatecpm.com/01a2fa85fb758fa11fdefd9679f30476/invoke.js"></script>`
  },
  {
    name: 'Banner Lateral Menu Adsterra (Esquerda)',
    network: 'adsterra',
    format: 'banner',
    status: 'active',
    placement: 'pc-sidebar-left',
    targetDevice: 'desktop',
    pages: ['all'],
    code: `<script type="text/javascript">\nwindow.atOptions = {\n\t'key' : 'b6f3bdd27bd5cdb7f2f3d985cdefbf59',\n\t'format' : 'iframe',\n\t'height' : 600,\n\t'width' : 160,\n\t'params' : {}\n};\n</script>\n<script type="text/javascript" src="//www.highperformanceformat.com/b6f3bdd27bd5cdb7f2f3d985cdefbf59/invoke.js"></script>`
  },
  {
    name: 'Banner Lateral Menu Adsterra (Direita)',
    network: 'adsterra',
    format: 'banner',
    status: 'active',
    placement: 'pc-sidebar-right',
    targetDevice: 'desktop',
    pages: ['all'],
    code: `<script type="text/javascript">\nwindow.atOptions = {\n\t'key' : 'b6f3bdd27bd5cdb7f2f3d985cdefbf59',\n\t'format' : 'iframe',\n\t'height' : 600,\n\t'width' : 160,\n\t'params' : {}\n};\n</script>\n<script type="text/javascript" src="//www.highperformanceformat.com/b6f3bdd27bd5cdb7f2f3d985cdefbf59/invoke.js"></script>`
  },
  {
    name: 'Feed Meio Native Adsterra',
    network: 'adsterra',
    format: 'native',
    status: 'active',
    placement: 'feed-middle',
    targetDevice: 'all',
    pages: ['all'],
    code: `<div id="container-01a2fa85fb758fa11fdefd9679f30476" className="w-full max-w-7xl"></div>`
  },
  {
    name: 'Modal Secreto - Celular Adsterra',
    network: 'adsterra',
    format: 'banner',
    status: 'active',
    placement: 'secret-modal-mobile',
    targetDevice: 'mobile',
    pages: ['all'],
    code: `<script type="text/javascript">\nwindow.atOptions = {\n\t'key' : '127a5cb8bbc9df2492b630fca9793ab2',\n\t'format' : 'iframe',\n\t'height' : 250,\n\t'width' : 300,\n\t'params' : {}\n};\n</script>\n<script type="text/javascript" src="//www.highperformanceformat.com/127a5cb8bbc9df2492b630fca9793ab2/invoke.js"></script>`
  },
  {
    name: 'Modal Secreto - PC Adsterra',
    network: 'adsterra',
    format: 'banner',
    status: 'active',
    placement: 'secret-modal-desktop',
    targetDevice: 'desktop',
    pages: ['all'],
    code: `<script type="text/javascript">\nwindow.atOptions = {\n\t'key' : '522b21a4c1dd8d4dc41ce8d9ad4e4976',\n\t'format' : 'iframe',\n\t'height' : 90,\n\t'width' : 728,\n\t'params' : {}\n};\n</script>\n<script type="text/javascript" src="//www.highperformanceformat.com/522b21a4c1dd8d4dc41ce8d9ad4e4976/invoke.js"></script>`
  }
];

export default function AdsAdmin() {
  const [ads, setAds] = useState<CustomAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingAd, setEditingAd] = useState<CustomAd | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'customAds'));
      const adsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CustomAd));
      
      if (adsData.length === 0) {
        // Auto-seed default ads if the collection is completely empty
        const newAds = [];
        for (const ad of DEFAULT_ADS) {
          const docRef = await addDoc(collection(db, 'customAds'), ad);
          newAds.push({ ...ad, id: docRef.id });
        }
        setAds([...adsData, ...newAds]);
      } else {
        setAds(adsData);
      }
    } catch (err: any) {
      if (err.code === 'permission-denied') {
        console.warn('Ignore permission denied for customAds in local env');
      } else {
        console.error("Error fetching ads:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultAds = async () => {
    if (!confirm('Deseja importar a lista de anúncios padrões? Isso irá reinstalar todos os banners, popunders e vídeos in-stream oficiais.')) return;
    setLoading(true);
    try {
      for (const ad of DEFAULT_ADS) {
        await addDoc(collection(db, 'customAds'), ad);
      }
      await fetchAds();
      alert('Anúncios inseridos com sucesso!');
    } catch (err) {
      console.error("Error seeding default ads:", err);
      alert('Erro ao inseir anúncios.');
      setLoading(false);
    }
  };

  const handleEdit = (ad: CustomAd) => {
    setEditingAd({ ...ad });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingAd({
      id: '',
      name: '',
      network: 'adsterra',
      format: 'banner',
      status: 'active',
      code: '',
      placement: 'global',
      targetDevice: 'all',
      pages: ['all']
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja apagar este anúncio? Esta ação não pode ser desfeita.')) return;
    try {
      await deleteDoc(doc(db, 'customAds', id));
      setAds(ads.filter(a => a.id !== id));
    } catch (err) {
      console.error("Error deleting ad:", err);
      alert('Erro ao excluir o anúncio.');
    }
  };

  const handleToggleStatus = async (ad: CustomAd) => {
    const newStatus = ad.status === 'active' ? 'inactive' : 'active';
    try {
      await setDoc(doc(db, 'customAds', ad.id), { status: newStatus }, { merge: true });
      setAds(ads.map(a => a.id === ad.id ? { ...a, status: newStatus } : a));
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAd) return;
    setSaving(true);
    
    try {
      if (editingAd.id) {
        await setDoc(doc(db, 'customAds', editingAd.id), editingAd);
        saveToMonio('customAds', editingAd);
        setAds(ads.map(a => a.id === editingAd.id ? editingAd : a));
      } else {
        const withoutId = { ...editingAd };
        delete (withoutId as any).id;
        const docRef = await addDoc(collection(db, 'customAds'), withoutId);
        saveToMonio('customAds', { ...withoutId, id: docRef.id });
        setAds([...ads, { ...editingAd, id: docRef.id }]);
      }
      setIsModalOpen(false);
      setEditingAd(null);
    } catch (err) {
      console.error("Error saving ad:", err);
      alert('Erro ao salvar anúncio.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Carregando anúncios...</div>;
  }

  return (
    <div className="bg-[#1C1E32] rounded-2xl p-6 border border-white/5 shadow-xl max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Play className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Gerenciador de Anúncios (Adsterra)</h2>
            <p className="text-sm text-gray-400">Controle total dos seus anúncios no site.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={seedDefaultAds}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white transition-colors"
          >
            <DatabaseBackup className="w-5 h-5" />
            Restaurar Originais
          </button>
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-white transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Anúncio
          </button>
        </div>
      </div>

      {ads.length === 0 ? (
        <div className="text-center py-12 bg-black/20 rounded-xl border border-white/5">
          <p className="text-gray-400">Nenhum anúncio cadastrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => (
            <div key={ad.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-bold">{ad.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${ad.network === 'adsterra' ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-500/20 text-orange-400'}`}>
                    {ad.network}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full flex gap-1 items-center font-bold">
                    {ad.placement} • {ad.targetDevice}
                  </span>
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-widest">{ad.format} • {ad.pages.join(', ')}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleToggleStatus(ad)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${ad.status === 'active' ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                >
                  {ad.status === 'active' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {ad.status === 'active' ? 'Ativo' : 'Inativo'}
                </button>
                <button 
                  onClick={() => handleEdit(ad)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(ad.id)}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && editingAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#1C1E32] rounded-2xl w-full max-w-2xl shadow-2xl border border-white/10 my-8">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">
                {editingAd.id ? 'Editar Anúncio' : 'Novo Anúncio'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveAd} className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Nome do Anúncio (Ex: Banner Lateral)</label>
                  <input 
                    type="text" 
                    required
                    value={editingAd.name} 
                    onChange={(e) => setEditingAd({ ...editingAd, name: e.target.value })}
                    className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none" placeholder="Ex: Banner Topo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Rede de Anúncios</label>
                  <select 
                    value={editingAd.network} 
                    onChange={(e) => setEditingAd({ ...editingAd, network: e.target.value as any })}
                    className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                  >
                    <option value="adsterra">Adsterra</option>
                    <option value="other">Outra / Customizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Formato do Anúncio</label>
                  <select 
                    value={editingAd.format} 
                    onChange={(e) => setEditingAd({ ...editingAd, format: e.target.value as any })}
                    className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                  >
                    <option value="banner">Banner Padrão (Iframe/Script)</option>
                    <option value="native">Banner Nativo</option>
                    <option value="popunder">Popunder / Clique</option>
                    <option value="slider">Slider / Carousel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Posição de Exibição</label>
                  <select 
                    value={editingAd.placement} 
                    onChange={(e) => setEditingAd({ ...editingAd, placement: e.target.value })}
                    className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                  >
                    <option value="global">Global (Carregado na tag Head/Body em todo o site)</option>
                    <option value="pc-sidebar-left">PC - Barra Lateral Esquerda</option>
                    <option value="pc-sidebar-right">PC - Barra Lateral Direita</option>
                    <option value="mobile-footer">Mobile - Rodapé (Fixo)</option>
                    <option value="category-top">Categorias - Topo</option>
                    <option value="feed-middle">Feed de Posts - No meio do conteúdo</option>
                    <option value="video-preroll">Video Player - Pre-Roll (Antes do vídeo)</option>
                    <option value="secret-modal-mobile">Modal Secreto - Celular (300x250)</option>
                    <option value="secret-modal-desktop">Modal Secreto - Desktop (728x90)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Dispositivos Alvo</label>
                  <select 
                    value={editingAd.targetDevice} 
                    onChange={(e) => setEditingAd({ ...editingAd, targetDevice: e.target.value as any })}
                    className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                  >
                    <option value="all">Todos (PC e Mobile)</option>
                    <option value="desktop">Apenas Computador / PC</option>
                    <option value="mobile">Apenas Celular / Tablet</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Páginas onde exibir</label>
                  <select 
                    value={editingAd.pages.join(',')} 
                    onChange={(e) => setEditingAd({ ...editingAd, pages: [e.target.value] })}
                    className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                  >
                    <option value="all">Todas as Páginas</option>
                    <option value="home">Apenas Home / Início</option>
                    <option value="feed">Apenas Feed Principal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Código do Anúncio (Scripts, iFrames, HTML)</label>
                <textarea 
                  value={editingAd.code} 
                  required
                  onChange={(e) => setEditingAd({ ...editingAd, code: e.target.value })}
                  rows={8}
                  className="w-full font-mono text-sm bg-[#131524] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none" 
                  placeholder={"Cole aqui o código fornecido pela Adsterra...\nExemplo:\n<script src='//pl123.com/invoke.js'></script>"}
                />
                <p className="text-xs text-gray-500 mt-2">Dica: Você pode colocar `&lt;script&gt;`, `&lt;iframe&gt;` ou qualquer código HTML gerado pelas plataformas.</p>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-white transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
                  Salvar Anúncio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

