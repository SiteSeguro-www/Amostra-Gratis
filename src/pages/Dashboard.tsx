import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, deleteField, addDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { deleteUser } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import { useAuth } from '../components/FirebaseAuthProvider';
import { Package, DollarSign, Activity, Settings, Building, History, Plus, ShoppingCart, ShieldCheck, AlertTriangle, Bookmark as BookmarkIcon, Volume2, VolumeX, Bell, Globe, Star, CheckCircle2, X, LogOut, User, Edit3, LayoutDashboard } from 'lucide-react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useNotificationSound } from '../components/NotificationSoundProvider';

import { API_URL, getApiUrl } from '../config';
import { saveToMonio } from '../lib/monio';

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const { profile: userProfile } = useAuth();
  const { soundEnabled, setSoundEnabled, browserNotificationsEnabled, setBrowserNotificationsEnabled, playSound } = useNotificationSound();
  const [services, setServices] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [userBalance, setUserBalance] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'overview';
  const success = searchParams.get('success');

  useEffect(() => {
    if (success === 'true') {
      const timer = setTimeout(() => {
        searchParams.delete('success');
        setSearchParams(searchParams);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, searchParams, setSearchParams]);

  // Bank Settings State
  const [bankName, setBankName] = useState('');
  const [agencyAccount, setAgencyAccount] = useState('');
  const [accountName, setAccountName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rgCnh, setRgCnh] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [savingBank, setSavingBank] = useState(false);
  const [mpConnected, setMpConnected] = useState(false);
  const [mpLoading, setMpLoading] = useState(false);
  const [showDeletionConfirm, setShowDeletionConfirm] = useState(false);
  const [deletionCode, setDeletionCode] = useState('');
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;

    const fetchData = async () => {
      if (document.visibilityState !== 'visible') {
        timeoutId = setTimeout(fetchData, 60000);
        return;
      }

      try {
        // Fetch user's bookmarks
        const qBookmarks = query(collection(db, 'bookmarks'), where('userId', '==', user.uid));
        const bookmarksSnap = await getDocs(qBookmarks);
        const bookmarkData = bookmarksSnap.docs.map(doc => doc.data());
        const postPromises = bookmarkData.map(async (b) => {
          const postSnap = await getDoc(doc(db, 'posts', b.postId));
          return postSnap.exists() ? { id: postSnap.id, ...postSnap.data() } : null;
        });
        const resolvedPosts = await Promise.all(postPromises);
        setBookmarks(resolvedPosts.filter(p => p !== null));

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }

      timeoutId = setTimeout(fetchData, 120000); // 2 minutes
    };

    fetchData();

    // Listen for user's services in real-time
    const qServices = query(collection(db, 'services'), where('sellerId', '==', user.uid));
    const unsubServices = onSnapshot(qServices, (snap) => {
      setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Listen for user's orders (sales) in real-time
    const qSalesSellerId = query(collection(db, 'orders'), where('sellerId', '==', user.uid));
    const qSalesSeller_id = query(collection(db, 'orders'), where('seller_id', '==', user.uid));
    const qSalesSellerUid = query(collection(db, 'orders'), where('sellerUid', '==', user.uid));
    const qSalesSeller_uid = query(collection(db, 'orders'), where('seller_uid', '==', user.uid));
    
    const updateSales = (snap: any) => {
      console.log(`Debug: Received ${snap.docs.length} orders for seller ${user.uid}`);
      const data = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setSales(prev => {
        const combined = [...prev];
        data.forEach((order: any) => {
          const index = combined.findIndex(o => o.id === order.id);
          if (index > -1) {
            combined[index] = order;
          } else {
            combined.push(order);
          }
        });
        return combined.sort((a: any, b: any) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
      });
    };

    const unsubSales1 = onSnapshot(qSalesSellerId, updateSales);
    const unsubSales2 = onSnapshot(qSalesSeller_id, updateSales);
    const unsubSales3 = onSnapshot(qSalesSellerUid, updateSales);
    const unsubSales4 = onSnapshot(qSalesSeller_uid, updateSales);

    // Listen for user's purchases (orders where user is buyer) in real-time
    const qPurchasesInternalId = query(collection(db, 'orders'), where('buyerId', '==', user.uid));
    const qPurchasesExternalId = query(collection(db, 'orders'), where('buyer_id', '==', user.uid));
    const qPurchasesEmail = query(collection(db, 'orders'), where('buyerEmail', '==', user.email));
    const qPurchasesEmailSnake = query(collection(db, 'orders'), where('buyer_email', '==', user.email));

    const updatePurchases = (snap: any) => {
      const data = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setPurchases(prev => {
        const combined = [...prev];
        data.forEach((order: any) => {
          const index = combined.findIndex(o => o.id === order.id);
          if (index > -1) {
            combined[index] = order;
          } else {
            combined.push(order);
          }
        });
        return combined.sort((a: any, b: any) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
      });
    };

    const unsubPurchases1 = onSnapshot(qPurchasesInternalId, updatePurchases);
    const unsubPurchases2 = onSnapshot(qPurchasesExternalId, updatePurchases);
    const unsubPurchases3 = onSnapshot(qPurchasesEmail, updatePurchases);
    const unsubPurchases4 = onSnapshot(qPurchasesEmailSnake, updatePurchases);

    // Listen for user's payouts (withdrawal requests) in real-time
    const qPayouts = query(collection(db, 'withdrawal_requests'), where('userId', '==', user.uid));
    const unsubPayouts = onSnapshot(qPayouts, (snap) => {
      setPayouts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });

    // Fetch user balance (keep realtime for balance updates)
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserBalance(data.balance || 0);
        setMpConnected(!!data.mercadoPagoId);
      }
    });

    // Fetch bank settings
    const fetchBankSettings = async () => {
      try {
        const bankRef = doc(db, 'bank_accounts', user.uid);
        const bankSnap = await getDoc(bankRef);
        if (bankSnap.exists()) {
          const data = bankSnap.data();
          setBankName(data.bankName || '');
          setAgencyAccount(data.agencyAccount || '');
          setAccountName(data.accountName || '');
          setCpf(data.cpf || '');
          setPixKey(data.pixKey || '');
        }
      } catch (error) {
        console.error("Error fetching bank settings:", error);
      }
    };
    fetchBankSettings();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timeoutId);
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for Mercado Pago OAuth success
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'MERCADOPAGO_AUTH_SUCCESS') {
        // The backend already saved the data to Firestore.
        // The onSnapshot(doc(db, 'users', user.uid)) will update the UI automatically.
        setMpConnected(true);
        alert('Mercado Pago conectado com sucesso!');
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('message', handleMessage);
      unsubUser();
      unsubServices();
      unsubSales1();
      unsubSales2();
      unsubSales3();
      unsubSales4();
      unsubPurchases1();
      unsubPurchases2();
      unsubPurchases3();
      unsubPurchases4();
      unsubPayouts();
    };
  }, [user]);

  const handleConnectMercadoPago = async () => {
    if (!user) return;
    setMpLoading(true);
    try {
      const response = await fetch(getApiUrl(`/api/auth/mercadopago/url?userId=${user.uid}`));
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error getting MP auth URL:', error);
      alert('Erro ao iniciar conexão com Mercado Pago.');
    } finally {
      setMpLoading(false);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!accountName.trim() || !cpf.trim() || !rgCnh.trim()) {
      alert('Por favor, preencha o Nome do Titular, o CPF e o RG ou CNH.');
      return;
    }

    if (!pixKey && (!bankName || !agencyAccount)) {
      alert('Por favor, preencha a Chave PIX ou os dados da Conta Bancária.');
      return;
    }

    setSavingBank(true);
    try {
      const bankData = {
        bankName,
        agencyAccount,
        accountName,
        cpf,
        rgCnh,
        pixKey,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'bank_accounts', user.uid), bankData);

      // Dual-write to MinIO
      saveToMonio('bank_accounts', { id: user.uid, ...bankData });

      alert('Dados de recebimento salvos com sucesso!');
    } catch (error) {
      console.error('Error saving bank details:', error);
      alert('Erro ao salvar dados bancários.');
    } finally {
      setSavingBank(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!user) return;
    
    const confirmDelete = window.confirm(
      "Para sua segurança, um código de confirmação será enviado ao seu e-mail cadastrado antes da exclusão permanente. Deseja prosseguir?"
    );
    
    if (!confirmDelete) return;

    setIsDeletingLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/account/delete-request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });
      const data = await response.json();
      if (data.success) {
        setShowDeletionConfirm(true);
        alert('Código enviado com sucesso! Verifique sua caixa de entrada.');
      } else {
        alert(data.error || 'Erro ao enviar código.');
      }
    } catch (error) {
      console.error('Error requesting deletion:', error);
      alert('Erro ao processar sua solicitação.');
    } finally {
      setIsDeletingLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (!deletionCode.trim() || !user) return;
    setIsDeletingLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/account/delete-confirm'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, code: deletionCode })
      });
      const data = await response.json();
      
      if (data.success) {
        // Delete user document from Firestore
        await deleteDoc(doc(db, 'users', user.uid));
        
        alert('Seu perfil foi excluído permanentemente.');
        navigate('/');
        window.location.reload();
      } else {
        alert(data.error || 'Código inválido ou expirado.');
      }
    } catch (error) {
      console.error('Error confirming deletion:', error);
      alert('Erro ao confirmar exclusão.');
    } finally {
      setIsDeletingLoading(false);
    }
  };

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const displayName = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const photoURL = userProfile?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'default'}`;
  const isAdmin = userProfile?.role === 'admin' || user?.email === 'dweminem@gmail.com' || user?.email === 'contato.packzinhu@gmail.com';

  const handleLogout = () => {
    signOut(auth);
    navigate('/');
  };

  if (!user) return <div className="py-20 text-center">Faça login para acessar o dashboard.</div>;

  const totalEarnings = (sales || []).filter(o => o?.status === 'delivered' || o?.status === 'completed').reduce((acc, curr) => acc + (Number(curr?.seller_amount || curr?.sellerNetAmount || curr?.amount * 0.95) || 0), 0);

  const handleRateOrder = async () => {
    if (!selectedOrderForRating || isRatingLoading) return;
    setIsRatingLoading(true);

    try {
      const order = selectedOrderForRating;
      if (!order) {
        alert('Erro: Pedido não selecionado.');
        return;
      }

      console.log('Iniciando avaliação para o pedido:', order.id);

      const serviceId = order.product_id || order.serviceId || 'unknown';
      const sellerId = order.seller_id || order.sellerId || 'unknown';
      const orderId = order.id || 'unknown';
      
      if (!user?.uid) {
        alert('Erro: Você precisa estar logado para avaliar.');
        return;
      }

      // 1. Create review document
      const reviewData: any = {
        orderId: orderId,
        serviceId: serviceId,
        sellerId: sellerId,
        buyerId: user.uid,
        buyerName: user.displayName || user.email?.split('@')[0] || 'Usuário',
        buyerPhoto: user.photoURL || '',
        rating: Number(ratingValue) || 5,
        comment: ratingComment || '',
        createdAt: new Date().toISOString()
      };

      // Remove any undefined fields just in case
      Object.keys(reviewData).forEach(key => {
        if (reviewData[key] === undefined) {
          console.warn(`Removendo campo undefined: ${key}`);
          delete reviewData[key];
        }
      });

      console.log('Enviando documento de review:', reviewData);
      const docRefReview = await addDoc(collection(db, 'reviews'), reviewData);
      
      // Dual-write to MinIO
      saveToMonio('reviews', { id: docRefReview.id, ...reviewData });

      // 2. Update order to mark as rated
      if (order.id) {
        await updateDoc(doc(db, 'orders', order.id), {
          rated: true
        });
      }

      // 3. Update seller stats
      if (sellerId && sellerId !== 'unknown') {
        const sellerRef = doc(db, 'users', sellerId);
        const sellerSnap = await getDoc(sellerRef);
        
        if (sellerSnap.exists()) {
          const sellerData = sellerSnap.data();
          const currentTotalRating = (Number(sellerData.totalRating) || 0) + ratingValue;
          const currentReviewCount = (Number(sellerData.reviewCount) || 0) + 1;
          const newAverageRating = (currentTotalRating / currentReviewCount).toFixed(1);

          await updateDoc(sellerRef, {
            totalRating: currentTotalRating,
            reviewCount: currentReviewCount,
            rating: newAverageRating
          });
        }
      }

      // 4. Update service stats
      if (serviceId && serviceId !== 'unknown') {
        const serviceRef = doc(db, 'services', serviceId);
        const serviceSnap = await getDoc(serviceRef);
        if (serviceSnap.exists()) {
          const serviceData = serviceSnap.data();
          const currentTotalRating = (Number(serviceData.totalRating) || 0) + ratingValue;
          const currentReviewCount = (Number(serviceData.reviewCount) || 0) + 1;
          const newAverageRating = (currentTotalRating / currentReviewCount).toFixed(1);

          await updateDoc(serviceRef, {
            totalRating: currentTotalRating,
            reviewCount: currentReviewCount,
            rating: newAverageRating
          });
        }
      }

      // 5. Send notification to seller
      if (sellerId && sellerId !== 'unknown') {
        try {
          // Use Firestore for notifications as it's more reliable for this app's rules
          const notifObj = {
            recipient_id: sellerId,
            sender_id: user.uid,
            sender_name: user.displayName || user.email?.split('@')[0] || 'Usuário',
            type: 'comment',
            related_id: order.id,
            message: `avaliou sua entrega com ${ratingValue} estrelas!`,
            read: false,
            created_at: new Date().toISOString()
          };
          const notifFsRef = await addDoc(collection(db, 'notifications'), notifObj);
          
          // Dual-write to MinIO
          saveToMonio('notifications', { id: notifFsRef.id, ...notifObj });
        } catch (notificationError) {
          console.error('Erro ao enviar notificação:', notificationError);
        }
      }

      alert('Avaliação enviada com sucesso!');
      setShowRatingModal(false);
      setSelectedOrderForRating(null);
      setRatingValue(5);
      setRatingComment('');
    } catch (error) {
      console.error("Error rating order:", error);
      alert('Erro ao enviar avaliação.');
    } finally {
      setIsRatingLoading(false);
    }
  };

  const handleConfirmDelivery = async (order: any) => {
    if (!window.confirm('Você confirma que recebeu o produto/serviço? Isso liberará o pagamento para o vendedor.')) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(getApiUrl('/api/orders/confirm-delivery'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId: order.id })
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Resposta inválida do servidor: ${text.slice(0, 100)}`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao confirmar entrega');
      }

      // Send Chat Message
      try {
        const qC = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', order.buyerId)
        );
        const fsSnap = await getDocs(qC);
        const chatData = fsSnap.docs.find(doc => doc.data().participants.includes(order.sellerId));
        
        if (chatData) {
          const messageText = `✅ ENTREGA CONFIRMADA: O cliente confirmou o recebimento do serviço "${order.serviceTitle}". O saldo foi liberado em sua conta!`;
          const msgObj = {
            chat_id: chatData.id,
            sender_id: order.buyerId,
            text: messageText,
            created_at: new Date().toISOString()
          };
          await addDoc(collection(db, 'messages'), msgObj);
          saveToMonio('messages', msgObj);
        }

        // Send notification to seller
        const notifData = {
          recipient_id: order.sellerId,
          sender_id: order.buyerId,
          sender_name: user?.displayName || 'Comprador',
          type: 'order',
          related_id: order.id,
          message: `confirmou o recebimento do serviço "${order.serviceTitle}". O saldo foi liberado!`,
          read: false,
          created_at: new Date().toISOString()
        };
        await addDoc(collection(db, 'notifications'), notifData);
        saveToMonio('notifications', notifData);
      } catch (e) {
        console.error('Error sending delivery chat message:', e);
      }

      alert('Entrega confirmada! O saldo foi liberado para o vendedor.');
    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      alert('Erro ao confirmar entrega: ' + error.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string, confirmMsg: string, successMsg: string, chatMsg?: string, senderId?: string, recipientId?: string) => {
    if (!window.confirm(confirmMsg)) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(getApiUrl(`/api/orders/${orderId}/status`), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Resposta inválida do servidor: ${text.slice(0, 100)}`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar status');
      }

      if (chatMsg && senderId && recipientId) {
        try {
          const qC = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', senderId)
          );
          const fsSnap = await getDocs(qC);
          const chatData = fsSnap.docs.find(doc => doc.data().participants.includes(recipientId));
          
          if (chatData) {
            const msgObj = {
              chat_id: chatData.id,
              sender_id: senderId,
              text: chatMsg,
              created_at: new Date().toISOString()
            };
            await addDoc(collection(db, 'messages'), msgObj);
            saveToMonio('messages', msgObj);
          }

          // Also send a notification
          const notif = {
            recipient_id: recipientId,
            sender_id: senderId,
            sender_name: user?.displayName || 'Sistema',
            type: 'order',
            related_id: orderId,
            message: chatMsg.split(': ')[1] || chatMsg,
            read: false,
            created_at: new Date().toISOString()
          };
          await addDoc(collection(db, 'notifications'), notif);
          saveToMonio('notifications', notif);
        } catch (e) {
          console.error('Error sending status chat message/notification:', e);
        }
      }

      alert(successMsg);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      alert('Erro ao atualizar pedido: ' + error.message);
    }
  };

  const handleDisputeOrder = async (order: any) => {
    await handleUpdateOrderStatus(
      order.id, 
      'disputed', 
      'Você confirma que NÃO recebeu o produto/serviço? Isso abrirá uma disputa.',
      'Disputa aberta. O vendedor foi notificado.',
      `⚠️ DISPUTA ABERTA: O cliente informou que NÃO recebeu o serviço "${order.serviceTitle}". Por favor, entrem em um acordo.`,
      order.buyerId,
      order.sellerId
    );
  };

  const handleAcceptOrder = async (order: any) => {
    await handleUpdateOrderStatus(
      order.id, 
      'accepted', 
      'Deseja aceitar este serviço? O cliente será notificado.',
      'Serviço aceito com sucesso! Comece a trabalhar no pedido.',
      `🤝 SERVIÇO ACEITO: O vendedor aceitou seu pedido "${order.serviceTitle}" e já começou a trabalhar!`,
      order.sellerId,
      order.buyerId
    );
  };

  const handleMarkAsDelivered = async (order: any) => {
    await handleUpdateOrderStatus(
      order.id, 
      'completed_by_seller', 
      'Você confirma que entregou este serviço? O cliente será notificado para confirmar o recebimento e liberar o saldo.',
      'Serviço marcado como entregue! Aguarde a confirmação do cliente.',
      `📦 SERVIÇO ENTREGUE: O vendedor marcou o serviço "${order.serviceTitle}" como entregue. Por favor, confirme o recebimento para liberar o pagamento.`,
      order.sellerId,
      order.buyerId
    );
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      const qN = query(
        collection(db, "notifications"),
        where("recipient_id", "==", user.uid),
        where("read", "==", false)
      );
      const snapshot = await getDocs(qN);
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();
      alert('Todas as notificações foram marcadas como lidas.');
    } catch (fsError) {
      console.error("Firestore mark all failed:", fsError);
      alert('Erro ao marcar notificações como lidas.');
    }
  };

  const handleRefuseOrder = async (order: any) => {
    await handleUpdateOrderStatus(
      order.id, 
      'refused', 
      'Deseja recusar este serviço? O cliente será notificado.',
      'Serviço recusado com sucesso.',
      `❌ SERVIÇO RECUSADO: O vendedor recusou seu pedido "${order.serviceTitle}". O reembolso será processado.`,
      order.sellerId,
      order.buyerId
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-sans selection:bg-purple-500/30">
      <div className="py-8 px-4 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Sidebar - Refined Sidebar */}
        <div className="w-full lg:w-72 flex flex-col gap-6">
          {/* Profile Card */}
          <div className="bg-[#0f0f0f] p-6 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <User className="w-16 h-16 text-white" />
            </div>
            <div className="relative z-10 flex flex-col items-center text-center gap-4">
              <div className="relative">
                <img 
                  src={photoURL} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-2 border-purple-500/50 p-1 bg-[#1a1a1a]" 
                />
                <div className="absolute -bottom-1 -right-1 p-1.5 bg-green-500 rounded-full border-2 border-[#0f0f0f]">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                  {displayName}
                  {isAdmin && <ShieldCheck className="w-5 h-5 text-blue-400 fill-blue-400/10" />}
                </h2>
                <p className="text-xs text-gray-500 font-mono tracking-tight mt-1">{user.email}</p>
              </div>
              <Link 
                to={`/profile/${user.uid}`}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
              >
                <Edit3 className="w-3 h-3" /> Ver Perfil Público
              </Link>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="bg-[#0f0f0f] p-3 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col gap-1.5">
            {[
              { id: 'overview', icon: Activity, label: 'Visão Geral' },
              { id: 'services', icon: Package, label: 'Meus Serviços' },
              { id: 'vendas', icon: History, label: 'Minhas Vendas' },
              { id: 'compras', icon: ShoppingCart, label: 'Minhas Compras' },
              { id: 'salvos', icon: BookmarkIcon, label: 'Salvos' },
              { id: 'config', icon: Building, label: 'Dados Bancários' },
              { id: 'payouts', icon: DollarSign, label: 'Finanças' },
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setSearchParams({ tab: item.id })}
                className={`flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm ${
                  activeTab === item.id 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20 translate-x-1' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" /> {item.label}
              </button>
            ))}
            
            {isAdmin && (
              <button 
                onClick={() => navigate('/adm')}
                className="flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm text-blue-400 hover:bg-blue-500/10 mt-2 border-t border-white/5 pt-4"
              >
                <ShieldCheck className="w-5 h-5" /> Painel Admin
              </button>
            )}

            <button 
              onClick={handleLogout}
              className="flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm text-red-500 hover:bg-red-500/10 mt-2 border-t border-white/5 pt-4"
            >
              <LogOut className="w-5 h-5" /> Sair da Conta
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {success === 'true' && (
            <div className="mb-8 p-5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-3xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
              <div className="p-2.5 bg-green-500/20 rounded-2xl">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-wider">Sucesso!</p>
                <p className="text-sm opacity-80">Seu pedido foi processado e já está disponível.</p>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-black text-white tracking-tight">
                    Dashboard
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">Bem-vindo de volta, {displayName.split(' ')[0]}!</p>
                </div>
                <div className="flex items-center gap-3 bg-[#0f0f0f] p-1.5 rounded-2xl border border-white/5">
                  <div className="px-4 py-2 bg-purple-500/10 rounded-xl text-purple-400 font-bold text-xs">
                    ID: {user.uid.slice(0, 8)}...
                  </div>
                </div>
              </header>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-[#0f0f0f] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                    <DollarSign className="w-20 h-20" />
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <span className="text-gray-500 font-black text-xs uppercase tracking-[0.2em]">Saldo Atual</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-purple-500">R$</span>
                    <h2 className="text-5xl font-black text-white tracking-tighter">
                      {(Number(userBalance) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h2>
                  </div>
                  <button 
                    onClick={async () => {
                      if (userBalance > 0) {
                        try {
                          const token = await auth.currentUser?.getIdToken();
                          const response = await fetch(getApiUrl('/api/withdraw'), {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            }
                          });
                          const data = await response.json();
                          if (data.success) {
                            alert('Solicitação de saque enviada com sucesso!');
                          } else {
                            alert('Erro ao solicitar saque: ' + data.error);
                          }
                        } catch (error) {
                          alert('Erro ao solicitar saque.');
                        }
                      } else {
                        alert('Você não possui saldo disponível.');
                      }
                    }}
                    className="mt-8 w-full py-4 bg-white text-black hover:bg-gray-200 font-black rounded-2xl transition-all shadow-xl active:scale-[0.98]"
                  >
                    Resgatar Saldo
                  </button>
                </div>

                <div className="bg-[#0f0f0f] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                    <Activity className="w-20 h-20" />
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-green-500/10 rounded-2xl text-green-400 border border-green-500/20">
                      <History className="w-6 h-6" />
                    </div>
                    <span className="text-gray-500 font-black text-xs uppercase tracking-[0.2em]">Ganhos Brutos</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-green-500">R$</span>
                    <h2 className="text-5xl font-black text-white tracking-tighter">
                      {(Number(totalEarnings) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h2>
                  </div>
                  <p className="mt-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-white/5 inline-block px-3 py-1 rounded-full">
                    Taxa Inclusa: 5%
                  </p>
                </div>

                <div className="bg-[#0f0f0f] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group sm:col-span-2 lg:col-span-1">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                    <Package className="w-20 h-20" />
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
                      <Package className="w-6 h-6" />
                    </div>
                    <span className="text-gray-500 font-black text-xs uppercase tracking-[0.2em]">Serviços Ativos</span>
                  </div>
                  <h2 className="text-5xl font-black text-white tracking-tighter">
                    {services.length.toString().padStart(2, '0')}
                  </h2>
                  <button 
                    onClick={() => navigate('/create-service')}
                    className="mt-8 w-full py-4 bg-blue-600 text-white hover:bg-blue-500 font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Novo Serviço
                  </button>
                </div>
              </div>

              {/* Notification & Sounds Panel - PERSISTENT PER USER REQUEST */}
              <div className="bg-[#0f0f0f] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 text-purple-500/10">
                  <Bell className="w-32 h-32" />
                </div>
                
                <div className="relative z-10">
                  <header className="flex items-center justify-between gap-4 mb-10">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-purple-500/20 rounded-3xl text-purple-400 ring-1 ring-purple-500/30">
                        <Bell className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white tracking-tight uppercase">Notificações e Sons</h2>
                        <p className="text-gray-500 text-sm">Gerencie como você recebe alertas de atividades</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/5 text-xs uppercase"
                    >
                      Marcar Tudo Lido
                    </button>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-purple-500/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-2xl text-gray-400 group-hover:text-purple-400 transition-colors">
                          <Volume2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold">Sons de Notificação</h4>
                          <p className="text-xs text-gray-500">Tocar sons suaves para interações</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`w-14 h-7 rounded-full p-1 transition-all duration-300 ${soundEnabled ? 'bg-purple-600' : 'bg-gray-800'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${soundEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-blue-500/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-2xl text-gray-400 group-hover:text-blue-400 transition-colors">
                          <Globe className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold">Notificações Push</h4>
                          <p className="text-xs text-gray-500">Alertas mesmo com o site fechado</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setBrowserNotificationsEnabled(!browserNotificationsEnabled)}
                        className={`w-14 h-7 rounded-full p-1 transition-all duration-300 ${browserNotificationsEnabled ? 'bg-blue-600' : 'bg-gray-800'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${browserNotificationsEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <button 
                        onClick={() => playSound('like')}
                        className="py-4 bg-[#1a1a1a] hover:bg-purple-600 text-white font-bold rounded-2xl transition-all border border-white/5 flex items-center justify-center gap-2 text-sm shadow-xl"
                      >
                        <div className="w-2 h-2 rounded-full bg-purple-400" /> Testar: Like
                      </button>
                      <button 
                        onClick={() => playSound('message')}
                        className="py-4 bg-[#1a1a1a] hover:bg-blue-600 text-white font-bold rounded-2xl transition-all border border-white/5 flex items-center justify-center gap-2 text-sm shadow-xl"
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-400" /> Testar: Msg
                      </button>
                      <button 
                        onClick={() => playSound('order')}
                        className="py-4 bg-[#1a1a1a] hover:bg-green-600 text-white font-bold rounded-2xl transition-all border border-white/5 flex items-center justify-center gap-2 text-sm shadow-xl"
                      >
                        <div className="w-2 h-2 rounded-full bg-green-400" /> Testar: Venda
                      </button>
                      <button 
                        onClick={() => playSound('follow')}
                        className="py-4 bg-[#1a1a1a] hover:bg-amber-600 text-white font-bold rounded-2xl transition-all border border-white/5 flex items-center justify-center gap-2 text-sm shadow-xl"
                      >
                        <div className="w-2 h-2 rounded-full bg-amber-400" /> Testar: Seguir
                      </button>
                    </div>
                    
                    <button 
                      onClick={async () => {
                        if (!('Notification' in window)) {
                          alert('Seu navegador não suporta notificações.');
                          return;
                        }
                        
                        let permission = Notification.permission;
                        if (permission !== 'granted') {
                          permission = await Notification.requestPermission();
                        }

                        if (permission === 'granted') {
                          new Notification("PackZinhu - Teste", { 
                            body: "Este é um alerta da sua central de notificações real!",
                            icon: "/favicon.ico"
                          });
                        } else {
                          alert('As notificações foram bloqueadas. Você precisa permitir nas configurações de site do navegador.');
                        }
                      }}
                      className="w-full py-5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black rounded-3xl transition-all shadow-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                    >
                      <Bell className="w-4 h-4" /> Testar Alerta do Navegador
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black text-white uppercase tracking-tight">Meus Serviços</h1>
                  <p className="text-gray-500 text-sm">Gerencie seu catálogo de ofertas na PackZinhu</p>
                </div>
                <button 
                  onClick={() => navigate('/create-service')}
                  className="p-4 bg-purple-600 hover:bg-purple-500 rounded-3xl text-white transition-all shadow-2xl shadow-purple-600/20 active:scale-95"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </header>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {services.length === 0 ? (
                  <div className="col-span-full py-24 text-center bg-[#0f0f0f] rounded-[3rem] border border-dashed border-white/5">
                    <Package className="w-20 h-20 text-gray-800 mx-auto mb-6" />
                    <p className="text-gray-500 font-bold text-lg italic">Nenhum serviço encontrado.</p>
                  </div>
                ) : (
                  services.map((service) => (
                    <div key={service.id} className="bg-[#0f0f0f] rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 overflow-hidden group hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/5">
                      <div className="relative aspect-square sm:aspect-video overflow-hidden">
                        <img 
                          src={service.coverUrl || 'https://placehold.co/800x600/141414/666666?text=Sem+Imagem'} 
                          alt={service.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 px-2 sm:px-4 py-1 sm:py-2 bg-black/70 backdrop-blur-xl rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black text-white tracking-widest border border-white/10">
                          R$ {service.price?.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-3 sm:p-8">
                        <h3 className="text-white font-bold text-[10px] sm:text-lg mb-3 sm:mb-6 line-clamp-1 group-hover:text-purple-400 transition-colors uppercase tracking-tight">{service.title}</h3>
                        <div className="flex gap-2 sm:gap-3">
                          <button 
                            onClick={() => navigate(`/edit-service/${service.id}`)}
                            className="flex-1 py-2 sm:py-4 bg-white/5 hover:bg-white/10 text-[10px] sm:text-xs font-black rounded-lg sm:rounded-2xl transition-all border border-white/10 flex items-center justify-center gap-1 sm:gap-2 uppercase"
                          >
                            <Edit3 className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Editar
                          </button>
                          <button 
                            onClick={async () => {
                              if (window.confirm('Excluir este serviço permanentemente?')) {
                                try {
                                  await deleteDoc(doc(db, 'services', service.id));
                                } catch (e) {
                                  alert('Erro ao excluir.');
                                }
                              }
                            }}
                            className="w-8 h-8 sm:w-14 sm:h-14 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg sm:rounded-2xl transition-all border border-red-500/20 flex items-center justify-center shadow-lg"
                          >
                            <X className="w-4 sm:w-5 h-4 sm:h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'vendas' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Minhas Vendas</h1>
                <p className="text-gray-500 text-sm">Acompanhe o status e entrega dos seus pedidos vendidos</p>
              </header>

              <div className="grid grid-cols-1 gap-4">
                {sales.length === 0 ? (
                  <div className="py-24 text-center bg-[#0f0f0f] rounded-[3rem] border border-dashed border-white/5">
                    <History className="w-20 h-20 text-gray-800 mx-auto mb-6" />
                    <p className="text-gray-500 font-bold italic">Nenhuma venda registrada ainda.</p>
                  </div>
                ) : (
                  sales.map((sale) => (
                    <div key={sale.id} className="bg-[#0f0f0f] p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row items-center gap-6 group hover:border-green-500/20 transition-all">
                      <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                        <History className="w-10 h-10" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h4 className="text-white font-bold text-lg mb-1">{sale.service_title || 'Pedido: ' + sale.id.slice(0, 8)}</h4>
                        <p className="text-xs text-gray-500 font-mono">ID: {sale.id}</p>
                        <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Valor</span>
                            <span className="text-white font-black">R$ {typeof sale.amount === 'number' ? sale.amount.toFixed(2) : '0.00'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Seu Ganho</span>
                            <span className="text-green-400 font-black">R$ {typeof (sale.seller_amount || (sale.amount * 0.95)) === 'number' ? (sale.seller_amount || sale.amount * 0.95).toFixed(2) : '0.00'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Data</span>
                            <span className="text-gray-400 font-bold">{new Date(sale.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center md:items-end gap-3 min-w-[150px]">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          sale.status === 'delivered' || sale.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          sale.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-400'
                        }`}>
                          {sale.status === 'delivered' ? 'Entregue' : sale.status === 'completed' ? 'Concluído' : 'Pendente'}
                        </span>
                        <Link 
                          to={`/chat/${sale.buyerId || sale.buyer_id}`}
                          className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black rounded-xl border border-white/10 transition-all uppercase"
                        >
                          Detalhes
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'compras' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Minhas Compras</h1>
                <p className="text-gray-500 text-sm">Seu histórico de aquisições na plataforma</p>
              </header>

              <div className="grid grid-cols-1 gap-4">
                {purchases.length === 0 ? (
                  <div className="py-24 text-center bg-[#0f0f0f] rounded-[3rem] border border-dashed border-white/5">
                    <ShoppingCart className="w-20 h-20 text-gray-800 mx-auto mb-6" />
                    <p className="text-gray-500 font-bold italic">Você ainda não comprou nada.</p>
                  </div>
                ) : (
                  purchases.map((purchase) => (
                    <div key={purchase.id} className="bg-[#0f0f0f] p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row items-center gap-6 group hover:border-purple-500/20 transition-all">
                      <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                        <Package className="w-10 h-10" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h4 className="text-white font-bold text-lg mb-1">{purchase.service_title || 'Pedido: ' + purchase.id.slice(0, 8)}</h4>
                        <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Valor</span>
                            <span className="text-white font-black">R$ {purchase.amount?.toFixed(2)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Status</span>
                            <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full mt-1 ${
                              purchase.status === 'delivered' || purchase.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {purchase.status === 'delivered' ? 'Disponível' : 'Em processamento'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link 
                          to={purchase.status === 'pending' ? `/checkout/${purchase.serviceId || purchase.service_id}` : `/chat/${purchase.sellerId || purchase.seller_id}`}
                          className="px-6 py-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-2xl transition-all shadow-xl shadow-purple-600/20 uppercase"
                        >
                          Acessar Conteúdo
                        </Link>
                        {purchase.status === 'delivered' && !purchase.rated && (
                          <button 
                            onClick={() => {
                              setSelectedOrderForRating(purchase);
                              setShowRatingModal(true);
                            }}
                            className="p-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-2xl border border-amber-500/20 transition-all"
                            title="Avaliar este serviço"
                          >
                            <Star className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'salvos' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Salvos</h1>
                <p className="text-gray-500 text-sm">Sua biblioteca de inspirações e desejos</p>
              </header>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {bookmarks.length === 0 ? (
                  <div className="col-span-full py-24 text-center bg-[#0f0f0f] rounded-[3rem] border border-dashed border-white/5">
                    <BookmarkIcon className="w-20 h-20 text-gray-800 mx-auto mb-6" />
                    <p className="text-gray-500 font-bold italic text-lg">Nenhum post salvo ainda.</p>
                  </div>
                ) : (
                  bookmarks.map((post) => (
                    <Link 
                      key={post.id} 
                      to={`/post/${post.id}`}
                      className="bg-[#0f0f0f] rounded-[2rem] border border-white/5 overflow-hidden group hover:border-purple-500/30 transition-all"
                    >
                      <div className="relative aspect-square">
                        <img 
                          src={post.mediaUrl || post.image || post.thumbnail} 
                          alt={post.title || "Post"}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 sm:p-6">
                           <span className="text-white font-bold text-[10px] sm:text-sm line-clamp-2">{post.title || post.content || "Ver Publicação"}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'payouts' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Finanças</h1>
                <p className="text-gray-500 text-sm">Histórico de solicitações de saque e repasses</p>
              </header>

              <div className="bg-[#0f0f0f] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-purple-500/20 rounded-3xl text-purple-400">
                    <DollarSign className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Extrato de Saques</h2>
                    <p className="text-gray-500 text-xs">Prazos de compensação: até 3 dias úteis</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {payouts.length === 0 ? (
                    <div className="py-20 text-center bg-[#141414] rounded-3xl border border-dashed border-white/5">
                      <p className="text-gray-600 font-bold">Nenhum saque solicitado até o momento.</p>
                    </div>
                  ) : (
                    payouts.map((payout: any) => (
                      <div key={payout.id} className="bg-[#141414] p-5 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                        <div>
                          <p className="text-white font-black text-lg">R$ {payout.amount?.toFixed(2)}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-1">
                            Solicitado em {new Date(payout.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 text-right">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-inner ${
                            payout.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400 animate-pulse'
                          }`}>
                            {payout.status === 'paid' ? 'Depositado' : 'Aguardando'}
                          </span>
                          {payout.paidAt && (
                            <p className="text-[9px] text-gray-600 italic">Liquidado: {new Date(payout.paidAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Configurações</h1>
                <p className="text-gray-500 text-sm">Dados de recebimento e segurança do perfil</p>
              </header>

              <div className="bg-[#0f0f0f] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                <div className="flex items-center gap-6 mb-10">
                  <div className="p-4 bg-blue-500/20 rounded-3xl text-blue-400">
                    <Building className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Dados de Recebimento</h2>
                    <p className="text-gray-500 text-sm">Atenção: Os dados devem ser do titular da conta</p>
                  </div>
                </div>

                <form onSubmit={handleSaveBank} className="space-y-10">
                  <div className="bg-[#141414] p-8 rounded-[2.5rem] border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-inner">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Nome Completo (Titular)</label>
                      <input 
                        type="text" 
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Exatamente como no banco"
                        className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl px-6 py-5 text-white outline-none focus:border-purple-500 transition-all font-bold tracking-tight shadow-lg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">CPF</label>
                      <input 
                        type="text" 
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                        placeholder="000.000.000-00"
                        className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl px-6 py-5 text-white outline-none focus:border-purple-500 transition-all font-bold tracking-tight shadow-lg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">RG ou CNH</label>
                      <input 
                        type="text" 
                        value={rgCnh}
                        onChange={(e) => setRgCnh(e.target.value)}
                        placeholder="Documento de identidade"
                        className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl px-6 py-5 text-white outline-none focus:border-purple-500 transition-all font-bold tracking-tight shadow-lg"
                        required
                      />
                    </div>

                    <div className="md:col-span-2 py-4 flex items-center gap-4">
                       <span className="shrink-0 text-[10px] font-black text-purple-500 uppercase tracking-[0.3em]">Destino do Saque</span>
                       <div className="flex-1 h-px bg-white/5" />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Chave PIX</label>
                      <input 
                        type="text" 
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        placeholder="E-mail, CPF, Tel ou Aleatória"
                        className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl px-6 py-5 text-white outline-none focus:border-purple-500 transition-all font-bold tracking-tight shadow-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Banco / Agência / Conta</label>
                      <input 
                        type="text" 
                        value={agencyAccount}
                        onChange={(e) => setAgencyAccount(e.target.value)}
                        placeholder="Ex: Inter 0001 12345-6"
                        className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl px-6 py-5 text-white outline-none focus:border-purple-500 transition-all font-bold tracking-tight shadow-lg"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={savingBank}
                    className="w-full py-6 bg-purple-600 text-white font-black rounded-[2.5rem] hover:bg-purple-500 transition-all shadow-2xl uppercase tracking-widest active:scale-[0.98] disabled:opacity-50"
                  >
                    {savingBank ? 'Processando...' : 'Salvar Dados de Recebimento'}
                  </button>
                </form>

                {/* Account Deletion */}
                <div className="mt-20 pt-10 border-t border-red-500/10">
                  <header className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Privacidade e Segurança</h3>
                  </header>
                  
                  <p className="text-gray-500 text-sm mb-8 leading-relaxed max-w-2xl">A PackZinhu respeita sua privacidade. Ao solicitar a exclusão da conta, todos os links, mídias e saldos pendentes serão destruídos em conformidade com a LGPD. Esta ação é <span className="text-red-500 font-bold">IRREVERSÍVEL</span>.</p>
                  
                  {!showDeletionConfirm ? (
                    <button 
                      onClick={handleDeleteProfile}
                      disabled={isDeletingLoading}
                      className="px-8 py-4 bg-red-500/10 text-red-500 font-black rounded-2xl hover:bg-red-600 hover:text-white transition-all border border-red-500/20 uppercase text-xs tracking-widest disabled:opacity-50"
                    >
                      {isDeletingLoading ? 'Enviando Protocolo...' : 'Encerrar Minha Conta'}
                    </button>
                  ) : (
                    <div className="bg-red-600/5 p-8 rounded-[2rem] border border-red-600/30 space-y-6">
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                         <CheckCircle2 className="w-5 h-5 text-red-500" /> Insira o código enviado para {user.email}:
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <input 
                          type="text"
                          maxLength={6}
                          value={deletionCode}
                          onChange={(e) => setDeletionCode(e.target.value)}
                          placeholder="000000"
                          className="flex-1 bg-black border border-red-500/30 rounded-2xl px-6 py-4 text-white text-center text-2xl font-mono font-black tracking-[0.5em] outline-none focus:border-red-500"
                        />
                        <button 
                          onClick={handleConfirmDeletion}
                          disabled={isDeletingLoading || deletionCode.length < 6}
                          className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-red-900/40 uppercase text-xs disabled:opacity-50 active:scale-95"
                        >
                          {isDeletingLoading ? 'Confirmando...' : 'Confirmar Exclusão'}
                        </button>
                      </div>
                      <button 
                        onClick={() => setShowDeletionConfirm(false)}
                        className="text-gray-600 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                      >
                        Abandornar solicitação
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0f0f] border border-white/5 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <Star className="w-32 h-32 text-amber-500" />
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Avaliar Serviço</h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedOrderForRating?.service_title || 'Pedido: ' + selectedOrderForRating?.id.slice(0, 8)}</p>
                </div>
                <button 
                  onClick={() => setShowRatingModal(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all text-gray-500 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="flex flex-col items-center gap-6 bg-[#141414] p-8 rounded-3xl border border-white/5 shadow-inner">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sua nota para o vendedor</p>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRatingValue(star)}
                        className="transition-transform hover:scale-125 duration-300"
                      >
                        <Star 
                          className={`w-10 h-10 ${star <= ratingValue ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' : 'text-gray-800'}`} 
                        />
                      </button>
                    ))}
                  </div>
                  <div className="px-6 py-2 bg-amber-500/10 rounded-full text-amber-400 font-black text-xl">
                    {ratingValue}.0
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Comentário Adicional</label>
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="O que você achou do conteúdo e do atendimento?"
                    className="w-full bg-[#141414] border border-white/5 rounded-[1.5rem] p-6 text-white placeholder:text-gray-700 outline-none focus:border-amber-500/50 transition-all h-32 resize-none font-bold tracking-tight text-sm shadow-inner"
                  />
                </div>

                <button
                  onClick={handleRateOrder}
                  disabled={isRatingLoading}
                  className="w-full py-5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-[2rem] transition-all shadow-xl shadow-amber-900/20 uppercase tracking-widest text-xs flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isRatingLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                  ) : (
                    <>
                      <Star className="w-4 h-4" /> Enviar Avaliação
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
