import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiUrl } from '../config';
import { 
  ShoppingBag, 
  Coins, 
  Star, 
  ShieldCheck, 
  Crown, 
  Zap, 
  Sparkles, 
  Palette, 
  Frame, 
  Image as ImageIcon,
  CheckCircle2,
  Lock,
  ArrowRight,
  Plus,
  History,
  Info,
  X
} from 'lucide-react';
import { auth, db } from '../firebase';
import { useAuth } from '../components/FirebaseAuthProvider';
import { saveToMonio } from '../lib/monio';
import { 
  doc, 
  updateDoc, 
  deleteField,
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  setDoc,
  increment,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PremiumName, PremiumAvatar, PremiumBackground } from '../components/PremiumEffects';
import { CosmeticItemIcon } from '../components/CosmeticItemIcon';

// Shop Items Definition
const SHOP_ITEMS = {
  fonts: [
    { id: 'font_gradient', name: 'Gradiente Animado', price: 20, type: 'font', description: 'Seu nome com um gradiente que se move suavemente.' },
    { id: 'font_neon', name: 'Neon Glow', price: 20, type: 'font', description: 'Efeito de brilho neon intenso no seu nome.' },
    { id: 'font_rainbow', name: 'Rainbow Animado', price: 30, type: 'font', description: 'Cores do arco-íris trocando em tempo real.' },
    { id: 'font_glitch', name: 'Efeito Glitch', price: 30, type: 'font', description: 'Estilo cyber-punk com distorção glitch.' },
  ],
  borders: [
    { id: 'border_neon_rotate', name: 'Neon Girando', price: 40, type: 'border', description: 'Uma borda neon que gira ao redor do seu avatar.' },
    { id: 'border_pulse', name: 'Pulsando', price: 40, type: 'border', description: 'Efeito de pulsação rítmica na borda.' },
    { id: 'border_rgb', name: 'RGB Gamer', price: 50, type: 'border', description: 'Cores RGB clássicas para o estilo gamer.' },
    { id: 'border_fire_ice', name: 'Fogo / Gelo', price: 50, type: 'border', description: 'Chamas e gelo animados ao redor da foto.' },
  ],
  backgrounds: [
    { id: 'bg_gradient', name: 'Gradiente Animado', price: 60, type: 'background', description: 'Fundo do perfil com cores em movimento.' },
    { id: 'bg_particles', name: 'Partículas', price: 70, type: 'background', description: 'Partículas flutuantes e interativas no fundo.' },
    { id: 'bg_cyberpunk', name: 'Cyberpunk', price: 80, type: 'background', description: 'Estilo futurista com luzes e sombras.' },
    { id: 'bg_dark_premium', name: 'Dark Premium', price: 100, type: 'background', description: 'O ápice da elegância e exclusividade.' },
  ],
  extras: [
    { id: 'extra_verified', name: 'Selo Verificado', price: 200, type: 'extra', description: 'O icônico selo roxo 3D de autenticidade.' },
    { id: 'extra_vip', name: 'Badge VIP', price: 150, type: 'extra', description: 'Destaque-se como um membro VIP da comunidade.' },
    { id: 'extra_crown', name: 'Coroa Animada', price: 250, type: 'extra', description: 'Uma coroa real que flutua sobre seu nome.' },
    { id: 'extra_premium_comment', name: 'Comentário Premium', price: 100, type: 'extra', description: 'Seus comentários ganham destaque e cores únicas.' },
  ]
};

const COIN_PACKAGES = [
  { id: 'coins_50', amount: 50, price: 5, popular: false, icon: Coins },
  { id: 'coins_120', amount: 120, price: 10, popular: true, icon: Zap, bonus: '20% BÔNUS' },
  { id: 'coins_300', amount: 300, price: 20, popular: false, icon: Crown, bonus: '50% BÔNUS' },
  { id: 'coins_800', amount: 800, price: 50, popular: false, icon: Sparkles, bonus: '100% BÔNUS' },
];

const Shop = () => {
  const { user, profile: userProfile } = useAuth();
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'items' | 'coins' | 'inventory'>('items');
  const [activeCategory, setActiveCategory] = useState<'fonts' | 'borders' | 'backgrounds' | 'extras'>('fonts');
  const [isBuying, setIsBuying] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    show: boolean;
    type: 'confirm' | 'success' | 'error' | 'loading';
    title: string;
    message: string;
    action?: () => void;
    item?: any;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });
  
  // Preview States
  const [previewFont, setPreviewFont] = useState<string | null>(null);
  const [previewBorder, setPreviewBorder] = useState<string | null>(null);
  const [previewBackground, setPreviewBackground] = useState<string | null>(null);
  const [previewBadges, setPreviewBadges] = useState<string[]>([]);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Load owned items
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'user_items'), where('userId', '==', user.uid));
    const unsubscribeItems = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data().itemId);
      setOwnedItems(items);
    });

    return () => {
      unsubscribeItems();
    };
  }, [user]);

  // Sync preview with profile when profile loads (only if not already previewing something)
  useEffect(() => {
    if (userProfile) {
      setPreviewFont(prev => prev || userProfile.fontStyle || null);
      setPreviewBorder(prev => prev || userProfile.borderStyle || null);
      setPreviewBackground(prev => prev || userProfile.backgroundStyle || null);
      setPreviewBadges(prev => prev.length > 0 ? prev : userProfile.badges || []);
    }
  }, [userProfile]);

  const handleBuyCoins = async (pkg: any) => {
    if (!user) return navigate('/login');
    
    setIsBuying(pkg.id);
    setModal({
      show: true,
      type: 'loading',
      title: 'Processando...',
      message: 'Estamos gerando seu link de pagamento no Mercado Pago.'
    });

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(getApiUrl('/api/hotcoins/create-preference'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          packageId: pkg.id,
          amount: pkg.price,
          hotCoins: pkg.amount
        })
      });

      const data = await response.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        setModal({
          show: true,
          type: 'error',
          title: 'Erro na Compra',
          message: data.error || 'Erro ao processar compra.'
        });
      }
    } catch (error) {
      console.error('Error buying coins:', error);
      setModal({
        show: true,
        type: 'error',
        title: 'Erro de Conexão',
        message: 'Erro ao conectar com Mercado Pago.'
      });
    } finally {
      setIsBuying(null);
    }
  };

  const handleBuyItem = async (item: any) => {
    if (!user || !userProfile) return navigate('/login');
    
    if (ownedItems.includes(item.id)) {
      setActiveTab('inventory');
      return;
    }

    if ((userProfile.hotCoins || 0) < item.price) {
      setModal({
        show: true,
        type: 'error',
        title: 'Saldo Insuficiente',
        message: `Você precisa de mais ${item.price - (userProfile.hotCoins || 0)} HotCoins para este item.`,
        action: () => setActiveTab('coins')
      });
      return;
    }

    setModal({
      show: true,
      type: 'confirm',
      title: 'Confirmar Compra',
      message: `Deseja comprar "${item.name}" por ${item.price} HotCoins?`,
      item: item,
      action: () => processItemPurchase(item)
    });
  };

  const processItemPurchase = async (item: any) => {
    if (!user) return;
    setIsBuying(item.id);
    setModal({
      show: true,
      type: 'loading',
      title: 'Processando...',
      message: 'Validando sua transação e adicionando ao inventário.'
    });

    try {
      const userRef = doc(db, 'users', user.uid);
      const batch = writeBatch(db);
      
      // 1. Deduct coins atomically
      batch.update(userRef, {
        hotCoins: increment(-item.price)
      });

      // 2. Add item to inventory
      const itemRef = doc(collection(db, 'user_items'));
      batch.set(itemRef, {
        userId: user.uid,
        itemId: item.id,
        itemType: item.type,
        active: false,
        purchasedAt: new Date().toISOString()
      });

      // 3. Log transaction
      const transRef = doc(collection(db, 'hotcoin_transactions'));
      batch.set(transRef, {
        userId: user.uid,
        amount: -item.price,
        type: 'spend',
        description: `Compra de item: ${item.name}`,
        createdAt: new Date().toISOString()
      });

      await batch.commit();

      // Dual-write to MinIO as backup
      saveToMonio('user_items', {
        userId: user.uid,
        itemId: item.id,
        itemType: item.type,
        active: false,
        purchasedAt: new Date().toISOString()
      });
      saveToMonio('hotcoin_transactions', {
        userId: user.uid,
        amount: -item.price,
        type: 'spend',
        description: `Compra de item: ${item.name}`,
        createdAt: new Date().toISOString()
      });

      setModal({
        show: true,
        type: 'success',
        title: 'Compra Realizada!',
        message: `O item "${item.name}" foi adicionado ao seu inventário.`
      });
    } catch (error) {
      console.error('Error buying item:', error);
      setModal({
        show: true,
        type: 'error',
        title: 'Erro no Processamento',
        message: 'Ocorreu um erro ao concluir sua compra.'
      });
    } finally {
      setIsBuying(null);
    }
  };

  const toggleItemActive = async (itemId: string, currentActive: boolean, itemType: string) => {
    if (!user || !userProfile) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const fieldMap: any = {
        font: 'fontStyle',
        border: 'borderStyle',
        background: 'backgroundStyle'
      };

      // 1. Handle deactivation
      if (currentActive) {
        // Deactivate in user_items (all instances of this item for this user)
        const q = query(
          collection(db, 'user_items'), 
          where('userId', '==', user.uid), 
          where('itemId', '==', itemId)
        );
        const snapshot = await getDocs(q);
        for (const d of snapshot.docs) {
          await updateDoc(d.ref, { active: false });
        }

        // Deactivate in user profile
        if (fieldMap[itemType]) {
          await updateDoc(userRef, {
            [fieldMap[itemType]]: deleteField()
          });
          
          // Also clear preview if it matches
          if (itemType === 'font' && previewFont === itemId) setPreviewFont(null);
          if (itemType === 'border' && previewBorder === itemId) setPreviewBorder(null);
          if (itemType === 'background' && previewBackground === itemId) setPreviewBackground(null);
        } else if (itemType === 'extra') {
          const currentBadges = userProfile.badges || [];
          const newBadges = currentBadges.filter((b: string) => b !== itemId);
          await updateDoc(userRef, { badges: newBadges });
          setPreviewBadges(newBadges);
        }
        return;
      }

      // 2. Handle activation
      // Deactivate others of same type first (except for extras/badges)
      if (itemType !== 'extra') {
        const qOthers = query(
          collection(db, 'user_items'), 
          where('userId', '==', user.uid), 
          where('itemType', '==', itemType),
          where('active', '==', true)
        );
        const snapshotOthers = await getDocs(qOthers);
        for (const d of snapshotOthers.docs) {
          await updateDoc(d.ref, { active: false });
        }
      }

      // Activate the new item in user_items
      const qItem = query(
        collection(db, 'user_items'), 
        where('userId', '==', user.uid), 
        where('itemId', '==', itemId)
      );
      const snapshotItem = await getDocs(qItem);
      for (const d of snapshotItem.docs) {
        await updateDoc(d.ref, { active: true });
      }

      // Update user profile for global effect
      if (fieldMap[itemType]) {
        await updateDoc(userRef, {
          [fieldMap[itemType]]: itemId
        });
        // Sync preview
        if (itemType === 'font') setPreviewFont(itemId);
        if (itemType === 'border') setPreviewBorder(itemId);
        if (itemType === 'background') setPreviewBackground(itemId);
      } else if (itemType === 'extra') {
        const currentBadges = userProfile.badges || [];
        if (!currentBadges.includes(itemId)) {
          const newBadges = [...currentBadges, itemId];
          await updateDoc(userRef, { badges: newBadges });
          setPreviewBadges(newBadges);
        }
      }
    } catch (error) {
      console.error('Error toggling item:', error);
    }
  };

  const handlePreview = (item: any) => {
    switch (item.type) {
      case 'font':
        setPreviewFont(item.id);
        break;
      case 'border':
        setPreviewBorder(item.id);
        break;
      case 'background':
        setPreviewBackground(item.id);
        break;
      case 'extra':
        if (previewBadges.includes(item.id)) {
          setPreviewBadges(prev => prev.filter(b => b !== item.id));
        } else {
          setPreviewBadges(prev => [...prev, item.id]);
        }
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-24 pb-20 px-4 text-white overflow-x-hidden">
      <Helmet>
        <title>PackZinhu - Loja de Cosméticos e HotCoins</title>
        <meta name="description" content="Personalize seu perfil com bordas, fontes e fundos exclusivos. Compre HotCoins para destacar sua presença no PackZinhu." />
        <link rel="canonical" href="https://packzinhu.online/shop" />
      </Helmet>
      <div className="max-w-7xl mx-auto">
        {/* Cinematic Hero */}
        <div className="relative mb-16 py-12 px-6 rounded-[3rem] overflow-hidden border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
          
          <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-purple-400 mb-6"
            >
              <Sparkles className="w-4 h-4" /> Boutique Premium
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight"
            >
              Eleve sua <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Presença</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-gray-400 mb-8 leading-relaxed font-medium"
            >
              Personalize sua identidade digital com cosméticos exclusivos e torne-se uma lenda na comunidade PackZinhu.
            </motion.p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="bg-white/5 border border-white/10 pl-6 pr-2 py-2 rounded-2xl flex items-center gap-4 backdrop-blur-xl">
                <div>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Saldo Disponível</p>
                  <p className="text-xl font-black text-white">{userProfile?.hotCoins || 0} <span className="text-sm text-yellow-400">HC</span></p>
                </div>
                <button 
                  onClick={() => setActiveTab('coins')}
                  className="w-10 h-10 bg-purple-600 hover:bg-purple-500 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-purple-600/20"
                >
                  <Plus className="w-5 h-5 text-white" />
                </button>
              </div>
              
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-xs font-bold uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" /> Conexão Segura
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Navigation */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex p-1.5 bg-white/5 border border-white/10 rounded-[1.5rem] w-full md:w-fit backdrop-blur-md">
            <button 
              onClick={() => setActiveTab('items')}
              className={`flex-1 md:flex-none px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'items' ? 'bg-white text-black shadow-xl shadow-white/10 scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <Palette className="w-4 h-4" /> Loja
            </button>
            <button 
              onClick={() => setActiveTab('coins')}
              className={`flex-1 md:flex-none px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'coins' ? 'bg-white text-black shadow-xl shadow-white/10 scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <Coins className="w-4 h-4" /> Recarregar
            </button>
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`flex-1 md:flex-none px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'inventory' ? 'bg-white text-black shadow-xl shadow-white/10 scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <ShoppingBag className="w-4 h-4" /> Itens
            </button>
          </div>

          {activeTab === 'items' && (
            <div className="flex overflow-x-auto no-scrollbar pb-2 md:pb-0 gap-2 w-full md:w-fit px-2 md:px-0">
              {[
                { id: 'fonts', name: 'Nomes', icon: Palette },
                { id: 'borders', name: 'Bordas', icon: Frame },
                { id: 'backgrounds', name: 'Fundos', icon: ImageIcon },
                { id: 'extras', name: 'Extras', icon: Star },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`whitespace-nowrap px-6 py-3 rounded-2xl font-black text-xs transition-all uppercase tracking-widest flex items-center gap-2 border ${
                    activeCategory === cat.id 
                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20' 
                    : 'bg-white/5 border-white/5 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <cat.icon className="w-4 h-4" /> {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'items' && (
            <motion.div 
              key="items"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Items Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                {SHOP_ITEMS[activeCategory].map((item) => {
                  const isOwned = ownedItems.includes(item.id);
                  const isPreviewing = 
                    (item.type === 'font' && previewFont === item.id) ||
                    (item.type === 'border' && previewBorder === item.id) ||
                    (item.type === 'background' && previewBackground === item.id) ||
                    (item.type === 'extra' && previewBadges.includes(item.id));

                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -12 }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => handlePreview(item)}
                      className={`group relative bg-[#181818] border rounded-[1.5rem] sm:rounded-[2.5rem] p-3 sm:p-6 cursor-pointer transition-all duration-500 ${
                        isPreviewing ? 'border-purple-500 ring-4 ring-purple-500/10' : 'border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20">
                        {isOwned ? (
                          <div className="bg-green-500/20 text-green-500 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl backdrop-blur-md">
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        ) : (
                          <div className="bg-black/50 backdrop-blur-md border border-white/10 text-green-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-black flex items-center gap-1 sm:gap-1.5 shadow-xl">
                            <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400" /> {item.price}
                          </div>
                        )}
                      </div>

                      <div className="relative mb-4 sm:mb-8 pb-2 sm:pb-4">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        <div className={`relative w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-[1.2rem] sm:rounded-[2rem] bg-gradient-to-br from-white/[0.03] to-white/[0.08] border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-700 shadow-2xl`}>
                          {item.type === 'font' && <CosmeticItemIcon item={item} className="w-10 h-10 sm:w-16 sm:h-16" />}
                          {item.type === 'border' && <Frame className="w-6 h-6 sm:w-10 sm:h-10 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
                          {item.type === 'background' && <ImageIcon className="w-6 h-6 sm:w-10 sm:h-10 text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" />}
                          {item.type === 'extra' && (
                            item.id === 'extra_verified' ? (
                              <img 
                                src="/selo-roxo.png" 
                                alt="Verificado" 
                                className="w-10 h-10 sm:w-14 sm:h-14 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" 
                                referrerPolicy="no-referrer" 
                              />
                            ) : (
                              <Crown className="w-6 h-6 sm:w-10 sm:h-10 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                            )
                          )}
                        </div>

                        {isPreviewing && (
                          <div className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[7px] sm:text-[9px] font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-widest shadow-lg animate-pulse">
                            Preview
                          </div>
                        )}
                      </div>

                      <div className="text-center mb-4 sm:mb-8">
                        <h3 className="text-sm sm:text-xl font-black text-white mb-1 sm:mb-2 tracking-tight line-clamp-1">{item.name}</h3>
                        <p className="text-[10px] sm:text-sm text-gray-500 leading-tight sm:leading-relaxed line-clamp-2 px-1 sm:px-2">{item.description}</p>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuyItem(item);
                          }}
                          disabled={isBuying === item.id}
                          className={`w-full py-2.5 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                            isOwned 
                            ? 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white' 
                            : 'bg-white text-black hover:bg-gray-200 shadow-xl active:scale-95'
                          }`}
                        >
                          {isBuying === item.id ? (
                            <div className="w-3.5 h-3.5 sm:w-5 sm:h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          ) : isOwned ? (
                            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          ) : (
                            <>Comprar <Coins className="w-3 h-3 sm:w-4 sm:h-4" /></>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Advanced Real-time Preview */}
              <div className="mt-20 relative px-6 md:px-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  <div className="lg:col-span-5">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-black uppercase tracking-widest text-purple-400 mb-6 font-mono">
                      Real-time Engine v2.0
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
                      Estúdio de <br /> <span className="text-gray-500">Preview Social</span>
                    </h2>
                    <p className="text-lg text-gray-400 leading-relaxed mb-8">
                      Nossa tecnologia de visualização em tempo real permite que você teste cada detalhe antes de realizar seu investimento. Sinta a exclusividade.
                    </p>
                    
                    <div className="space-y-4">
                      {[
                        { label: 'Nome Customizado', active: previewFont },
                        { label: 'Borda Cinética', active: previewBorder },
                        { label: 'Background Imersivo', active: previewBackground },
                        { label: 'Badges de Prestígio', active: previewBadges.length > 0 },
                      ].map((feat, i) => (
                        <div key={i} className="flex items-center gap-4 group">
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${feat.active ? 'bg-purple-500 border-purple-500 text-white' : 'border-white/10 text-transparent'}`}>
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <span className={`text-sm font-bold uppercase tracking-widest transition-colors ${feat.active ? 'text-white' : 'text-gray-600'}`}>
                            {feat.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="lg:col-span-7 flex justify-center lg:justify-end">
                    <div className="relative w-full max-w-lg group">
                      <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                      
                      <PremiumBackground 
                        backgroundStyle={previewBackground || undefined}
                        className="relative w-full bg-[#141414] border border-white/5 rounded-[4rem] px-8 py-16 md:p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden"
                      >
                        <div className="flex flex-col items-center">
                          <div className="relative mb-10">
                            <PremiumAvatar borderStyle={previewBorder || undefined} className="w-40 h-40 md:w-48 md:h-48 shadow-2xl">
                              <img 
                                src={userProfile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'preview'}`} 
                                alt="Preview" 
                                className="w-full h-full object-cover"
                              />
                            </PremiumAvatar>
                          </div>
                          
                          <div className="text-center relative z-10">
                            <PremiumName 
                              fontStyle={previewFont || undefined}
                              badges={previewBadges}
                              isVerified={previewBadges.includes('extra_verified')}
                              isAdmin={userProfile?.role === 'admin'}
                              className="mb-3"
                            >
                              <h3 className="text-3xl md:text-4xl font-black subpixel-antialiased tracking-tight">
                                {userProfile?.displayName || 'Seu Nome'}
                              </h3>
                            </PremiumName>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                               <Sparkles className="w-3 h-3 text-purple-400" /> Membro de Elite
                            </div>
                          </div>
                        </div>
                      </PremiumBackground>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'coins' && (
            <motion.div 
              key="coins"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-12"
            >
              <div className="text-center md:text-left max-w-2xl">
                <h2 className="text-3xl font-black text-white mb-4">Escolha seu Pacote</h2>
                <p className="text-gray-500">Adquira HotCoins e desbloqueie acesso instantâneo a todos os itens cosméticos da loja.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                {COIN_PACKAGES.map((pkg) => (
                  <motion.div
                    key={pkg.id}
                    whileHover={{ scale: 1.05 }}
                    className={`group relative bg-[#1c1c1c] border rounded-[3rem] p-8 flex flex-col items-center text-center transition-all duration-500 ${
                      pkg.popular ? 'border-purple-500 ring-1 ring-purple-500 shadow-[0_30px_60px_-15px_rgba(139,92,246,0.2)]' : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white text-[10px] font-black py-1.5 px-6 rounded-full uppercase tracking-widest shadow-xl whitespace-nowrap">
                        Recomendado
                      </div>
                    )}
                    
                    {pkg.bonus && (
                      <div className="absolute top-6 right-6 bg-yellow-400 text-black text-[9px] font-black py-1 px-3 rounded-full shadow-lg">
                        {pkg.bonus}
                      </div>
                    )}

                    <div className={`mb-8 p-6 rounded-[2rem] bg-gradient-to-br from-white/[0.03] to-white/[0.08] shadow-inner`}>
                      <pkg.icon className={`w-12 h-12 transition-transform duration-700 group-hover:rotate-12 ${pkg.popular ? 'text-purple-400' : 'text-yellow-400'}`} />
                    </div>

                    <h3 className="text-4xl font-black text-white mb-2">{pkg.amount} <span className="text-sm text-yellow-400">HC</span></h3>
                    <p className="text-gray-500 font-bold mb-8 uppercase tracking-widest text-[11px]">R$ {pkg.price.toFixed(2)}</p>

                    <button
                      onClick={() => handleBuyCoins(pkg)}
                      disabled={isBuying === pkg.id}
                      className={`w-full py-5 rounded-[1.5rem] font-black text-sm transition-all flex items-center justify-center gap-2 ${
                        pkg.popular 
                        ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-xl' 
                        : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {isBuying === pkg.id ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Comprar Pack <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                    
                    <div className="mt-8 flex items-center gap-2 text-[10px] text-gray-500 font-black uppercase tracking-widest opacity-50">
                      <Lock className="w-3 h-3" /> Seguro Mercado Pago
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-white/5 border border-white/10 p-12 rounded-[2.5rem] text-center max-w-4xl mx-auto backdrop-blur-3xl">
                <div className="flex justify-center gap-8 mb-8">
                  <img src="https://logodownload.org/wp-content/uploads/2019/06/mercado-pago-logo.png" alt="Mercado Pago" className="h-8 object-contain filter brightness-200 grayscale opacity-40 hover:opacity-100 transition-opacity" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo%E2%80%94Pix.svg/2048px-Logo%E2%80%94Pix.svg.png" alt="Pix" className="h-8 object-contain filter brightness-200 grayscale opacity-40 hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-[0.2em]">Pagamento Seguro e Garantido</h3>
                <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
                  Utilizamos a infraestrutura do Mercado Pago para garantir que sua transação seja processada com segurança total. HotCoins e Itens são liberados instantaneamente após a confirmação.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'inventory' && (
            <motion.div 
              key="inventory"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {ownedItems.length === 0 ? (
                <div className="bg-white/5 rounded-[2.5rem] p-12 text-center border border-white/5">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-10 h-10 text-gray-600" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">Seu inventário está vazio</h3>
                  <p className="text-gray-500 mb-8">Você ainda não adquiriu nenhum item premium.</p>
                  <button 
                    onClick={() => setActiveTab('items')}
                    className="px-8 py-4 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-500 transition-all"
                  >
                    Ir para a Loja
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {Object.values(SHOP_ITEMS).flat().filter(item => ownedItems.includes(item.id)).map((item) => {
                    const isActive = userProfile?.[`${item.type}Style`] === item.id || (item.type === 'extra' && userProfile?.badges?.includes(item.id));
                    return (
                      <div key={item.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-purple-400">
                          {item.type === 'font' && <CosmeticItemIcon item={item} className="w-12 h-12" />}
                          {item.type === 'border' && <Frame className="w-8 h-8" />}
                          {item.type === 'background' && <ImageIcon className="w-8 h-8" />}
                          {item.type === 'extra' && (
                            item.id === 'extra_verified' ? (
                              <img 
                                src="/selo-roxo.png" 
                                alt="Verificado" 
                                className="w-10 h-10 object-contain" 
                                referrerPolicy="no-referrer" 
                              />
                            ) : (
                              <Crown className="w-8 h-8" />
                            )
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-black text-white">{item.name}</h3>
                          <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">{item.type}</p>
                        </div>
                        
                        <button
                          onClick={() => toggleItemActive(item.id, isActive, item.type)}
                          className={`px-6 py-2 rounded-xl font-black text-xs transition-all ${
                            isActive 
                            ? 'bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30' 
                            : 'bg-green-500 text-white hover:bg-green-400 shadow-lg shadow-green-500/20'
                          }`}
                        >
                          {isActive ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enterprise Trust Section */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: ShieldCheck, title: 'Segurança Militar', desc: 'Sua transação é protegida por criptografia de ponta a ponta.' },
            { icon: Zap, title: 'Ativação Instantânea', desc: 'Sem esperas. Seus HotCoins caem na conta no momento do Pix.' },
            { icon: Sparkles, title: 'Acabamento Premium', desc: 'Efeitos visuais desenvolvidos por designers profissionais.' },
            { icon: Coins, title: 'Economia Circular', desc: 'Moedas que valorizam seu perfil e dão status na rede.' },
          ].map((item, i) => (
            <div key={i} className="group p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                <item.icon className="w-6 h-6" />
              </div>
              <h4 className="font-black text-white mb-2 uppercase tracking-tight text-sm">{item.title}</h4>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* REFINED MOBILE PREVIEW (FLOATING HUB) */}
      <AnimatePresence>
        {activeTab === 'items' && (previewFont || previewBorder || previewBackground || previewBadges.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            drag
            dragConstraints={{ left: 0, right: 0, top: -400, bottom: 0 }}
            dragElastic={0.15}
            className="fixed bottom-28 right-6 z-[100] md:hidden cursor-grab active:cursor-grabbing w-[20rem]"
          >
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-[2.5rem] blur opacity-40" />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewFont(null);
                  setPreviewBorder(null);
                  setPreviewBackground(null);
                  setPreviewBadges([]);
                }}
                className="absolute -top-3 -right-3 z-[110] w-10 h-10 bg-[#141414] border border-white/20 rounded-full flex items-center justify-center text-white shadow-2xl pointer-events-auto active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
              
              <PremiumBackground 
                backgroundStyle={previewBackground || undefined}
                className="relative w-full bg-black/80 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden pointer-events-none"
              >
                <div className="flex flex-col items-center">
                  <div className="relative mb-6">
                    <PremiumAvatar borderStyle={previewBorder || undefined} className="w-32 h-32">
                      <img 
                        src={userProfile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'preview'}`} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </PremiumAvatar>
                  </div>
                  
                  <div className="text-center">
                    <PremiumName 
                      fontStyle={previewFont || undefined}
                      badges={previewBadges}
                      isVerified={previewBadges.includes('extra_verified')}
                      isAdmin={userProfile?.role === 'admin'}
                      className="justify-center"
                    >
                      <h3 className="text-2xl font-black subpixel-antialiased tracking-tight">
                        {userProfile?.displayName || 'Seu Nome'}
                      </h3>
                    </PremiumName>
                    <div className="mt-2 inline-block px-3 py-1 bg-white/5 rounded-full text-[9px] text-gray-500 font-bold uppercase tracking-widest border border-white/5">
                      Personalizando Perfil
                    </div>
                  </div>
                </div>
              </PremiumBackground>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CUSTOM MODAL SYSTEM */}
      <AnimatePresence>
        {modal.show && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => modal.type !== 'loading' && setModal({ ...modal, show: false })}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-[3rem] p-8 shadow-2xl text-center"
            >
              {modal.type === 'loading' && (
                <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-6" />
              )}
              {modal.type === 'success' && (
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              )}
              {modal.type === 'error' && (
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <X className="w-8 h-8 text-red-500" />
                </div>
              )}
              {modal.type === 'confirm' && (
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="w-8 h-8 text-purple-500" />
                </div>
              )}

              <h3 className="text-xl font-black text-white mb-2">{modal.title}</h3>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">{modal.message}</p>

              <div className="flex flex-col gap-3">
                {modal.type === 'confirm' ? (
                  <>
                    <button 
                      onClick={() => modal.action?.()}
                      className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all shadow-xl active:scale-95"
                    >
                      Confirmar Compra
                    </button>
                    <button 
                      onClick={() => setModal({ ...modal, show: false })}
                      className="w-full py-4 bg-white/5 text-gray-500 font-bold rounded-2xl hover:bg-white/10 transition-all"
                    >
                      Cancelar
                    </button>
                  </>
                ) : modal.type !== 'loading' && (
                  <button 
                    onClick={() => {
                      setModal({ ...modal, show: false });
                      modal.action?.();
                    }}
                    className="w-full py-4 bg-white/5 text-white font-black rounded-2xl hover:bg-white/10 transition-all"
                  >
                    Fechar
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shop;
