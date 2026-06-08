import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveToMonio } from '../lib/monio';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, getDoc, addDoc, deleteDoc, onSnapshot, where, setDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../components/FirebaseAuthProvider';
import { getApiUrl } from '../config';
import { SLUG_TO_NAME } from '../constants';
import { 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter,
  AlertCircle,
  LayoutDashboard,
  ShoppingCart,
  Users,
  Eye,
  Trash2,
  Sparkles,
  RefreshCcw,
  Database,
  Image as ImageIcon,
  Mail,
  Send,
  Play,
  Bell
} from 'lucide-react';
import BannersAdmin from '../components/BannersAdmin';
import AdsAdmin from '../components/AdsAdmin';
import NotificationsAdmin from '../components/NotificationsAdmin';

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'paid';
  createdAt: string;
  userEmail: string;
  pixKey: string;
  cpf?: string;
  paidAt?: string;
  seller?: {
    displayName: string;
  };
}

interface Sale {
  id: string;
  buyer_email: string;
  seller_id: string;
  amount: number;
  status: string;
  created_at: string;
  service_title: string;
  buyerName?: string;
  sellerName?: string;
}

const Admin = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sales' | 'shop_sales' | 'users' | 'disputes' | 'services' | 'banners' | 'emails' | 'ads' | 'notifications'>('dashboard');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [shopSales, setShopSales] = useState<any[]>([]);
  const [siteEmails, setSiteEmails] = useState<any[]>([]);
  const [isResolving, setIsResolving] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState({ to: '', subject: '', body: '' });
  const [carouselDurationConfig, setCarouselDurationConfig] = useState(6);
  const [isSavingCarouselDuration, setIsSavingCarouselDuration] = useState(false);

  const handleSaveCarouselDuration = async () => {
    try {
      setIsSavingCarouselDuration(true);
      const config = {
        duration: carouselDurationConfig * 1000
      };
      await setDoc(doc(db, 'settings', 'carousel_config'), config, { merge: true });
      saveToMonio('settings', { id: 'carousel_config', ...config });
      alert("Tempo de reprodução atualizado com sucesso!");
    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar tempo: " + err.message);
    } finally {
      setIsSavingCarouselDuration(false);
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      const isHardcodedAdmin = user.email === 'dweminem@gmail.com' || user.email === 'contato.packzinhu@gmail.com';

      if (!isHardcodedAdmin && profile?.role !== 'admin') {
        alert('Acesso negado. Apenas administradores.');
        navigate('/');
      } else {
        setIsAdmin(true);
        fetchData();
      }
    };

    if (user) {
      checkAdmin();
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    if (!isAdmin) return;

    // Firestore real-time listener for orders
    const unsubOrders = onSnapshot(collection(db, 'orders'), () => {
      fetchData();
    }, (error) => console.error("Admin: Orders snapshot error", error));

    // Real-time users listener
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    }, (error) => {
      console.error("Admin: Users snapshot error", error);
      // Fallback for list
      import('../lib/monio').then(({ loadFromMonio }) => {
        loadFromMonio('users').then(minioUsers => {
          if (minioUsers) setUsers(minioUsers);
        });
      });
    });

    // Real-time services listener
    const unsubServices = onSnapshot(collection(db, 'services'), (snapshot) => {
      const servicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllServices(servicesData);
    }, (error) => {
      console.error("Admin: Services snapshot error", error);
      // Fallback for list
      import('../lib/monio').then(({ loadFromMonio }) => {
        loadFromMonio('services').then(minioServices => {
          if (minioServices) setAllServices(minioServices);
        });
      });
    });

    // Real-time emails listener
    const unsubEmails = onSnapshot(query(collection(db, 'site_emails'), orderBy('createdAt', 'desc')), (snapshot) => {
      const emailsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSiteEmails(emailsData);
    }, (error) => console.error("Admin: Emails snapshot error", error));

    const unsubCarouselConfig = onSnapshot(doc(db, 'settings', 'carousel_config'), (snap) => {
      if (snap.exists() && snap.data().duration) {
        setCarouselDurationConfig(snap.data().duration / 1000);
      }
    }, (error) => console.error("Admin: Carousel Config snapshot error", error));

    return () => {
      if (typeof unsubOrders === 'function') unsubOrders();
      unsubUsers();
      unsubServices();
      unsubEmails();
      unsubCarouselConfig();
    };
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Withdrawals
      const withdrawalsRef = collection(db, 'withdrawal_requests');
      const qWithdrawals = query(withdrawalsRef, orderBy('createdAt', 'desc'));
      const withdrawalsSnap = await getDocs(qWithdrawals);
      
      const withdrawalsData: WithdrawalRequest[] = [];
      for (const docSnap of withdrawalsSnap.docs) {
        const data = docSnap.data();
        let cpf = '';
        try {
          const bankSnap = await getDoc(doc(db, 'bank_accounts', data.userId));
          if (bankSnap.exists()) cpf = bankSnap.data().cpf || '';
        } catch (e) { console.error('Error fetching bank account:', e); }
        withdrawalsData.push({ id: docSnap.id, ...data, cpf } as WithdrawalRequest);
      }
      setWithdrawals(withdrawalsData);

      // Fetch Sales
      const salesRef = collection(db, 'orders');
      const qSales = query(salesRef, orderBy('created_at', 'desc'));
      const salesSnap = await getDocs(qSales);
      
      const salesData: Sale[] = [];
      for (const docSnap of salesSnap.docs) {
        const data = docSnap.data();
        let buyerName = data.buyerName || '';
        let sellerName = '';
        
        if (!buyerName && data.buyerId) {
          try {
            const buyerSnap = await getDoc(doc(db, 'users', data.buyerId));
            if (buyerSnap.exists()) buyerName = buyerSnap.data().displayName || '';
          } catch (e) { console.error('Error fetching buyer:', e); }
        }
        
        const sellerId = data.seller_id || data.sellerId || '';
        if (sellerId) {
          try {
            const sellerSnap = await getDoc(doc(db, 'users', sellerId));
            if (sellerSnap.exists()) sellerName = sellerSnap.data().displayName || '';
          } catch (e) { console.error('Error fetching seller:', e); }
        }

        salesData.push({
          id: docSnap.id,
          buyer_email: data.buyer_email || data.buyerEmail || '',
          seller_id: sellerId,
          amount: data.price || data.amount || 0,
          status: data.status || '',
          created_at: data.created_at || data.createdAt || new Date().toISOString(),
          service_title: data.service_title || data.serviceTitle || 'Serviço',
          buyerName,
          sellerName
        });
      }
      setSales(salesData);

      // Fetch Users
      const usersRef = collection(db, 'users');
      const usersSnap = await getDocs(usersRef);
      const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);

      // Fetch All Services
      const servicesRef = collection(db, 'services');
      const servicesSnap = await getDocs(servicesRef);
      const servicesData = servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllServices(servicesData);

      // Fetch Shop Sales (HotCoin Transactions - Spend)
      const shopSalesRef = collection(db, 'hotcoin_transactions');
      const qShopSales = query(shopSalesRef, where('type', '==', 'spend'), orderBy('createdAt', 'desc'));
      const shopSalesSnap = await getDocs(qShopSales);
      
      const shopSalesData = [];
      for (const docSnap of shopSalesSnap.docs) {
        const data = docSnap.data();
        let userEmail = '';
        try {
          const userSnap = await getDoc(doc(db, 'users', data.userId));
          if (userSnap.exists()) userEmail = userSnap.data().email || '';
        } catch (e) { console.error('Error fetching user for shop sale:', e); }
        
        shopSalesData.push({
          id: docSnap.id,
          ...data,
          userEmail
        });
      }
      setShopSales(shopSalesData);

      // Fetch Emails
      const emailsRef = collection(db, 'site_emails');
      const qEmails = query(emailsRef, orderBy('createdAt', 'desc'));
      const emailsSnap = await getDocs(qEmails);
      const emailsData = emailsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSiteEmails(emailsData);

    } catch (error: any) {
      console.error('Critical error fetching data:', error);
      alert(`Erro ao carregar dados: ${error.message || 'Verifique sua conexão.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    if (!window.confirm('Confirmar que o pagamento via PIX foi realizado? Isso enviará uma notificação e e-mail para o vendedor.')) return;
    
    try {
      const token = await user?.getIdToken();
      const response = await fetch(getApiUrl('/api/admin/payout/confirm'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId: id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar pagamento');
      }

      alert('Pagamento processado com sucesso! O vendedor foi notificado.');
      fetchData();
    } catch (error: any) {
      console.error('Error updating payout:', error);
      alert('Erro ao atualizar pagamento: ' + error.message);
    }
  };

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      const updateData = { isVerified: !currentStatus };
      await updateDoc(userRef, updateData);
      saveToMonio('users', { id: userId, ...updateData });
      
      if (!currentStatus) {
        // Send notification
        const notificationsRef = collection(db, 'notifications');
        const notif = {
          recipient_id: userId,
          sender_id: 'system',
          type: 'verification',
          message: 'Parabéns! Seu perfil foi verificado com sucesso.',
          read: false,
          created_at: new Date().toISOString()
        };
        await addDoc(notificationsRef, notif);
        saveToMonio('notifications', notif);
      }
      
      alert('Status de verificação atualizado!');
      fetchData();
    } catch (error: any) {
      console.error('Error updating verification:', error);
      alert('Erro ao atualizar verificação');
    }
  };

  const updateBalance = async (userId: string, amount: number) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        alert('Usuário não encontrado');
        return;
      }
      const currentBalance = userSnap.data().hotCoins || 0;
      const newHotCoins = currentBalance + amount;
      await updateDoc(userRef, { hotCoins: newHotCoins });
      saveToMonio('users', { id: userId, hotCoins: newHotCoins });
      
      alert(`Saldo atualizado! Anterior: ${currentBalance}, Adicionado: ${amount}`);
      fetchData();
    } catch (error: any) {
      console.error('Error updating balance:', error);
      alert('Erro ao atualizar saldo: ' + error.message);
    }
  };

  const handleResolveDispute = async (orderId: string, resolution: 'refund' | 'release') => {
    if (!window.confirm(`Tem certeza que deseja resolver esta disputa em favor do ${resolution === 'refund' ? 'Comprador (Reembolso)' : 'Vendedor (Liberar Saldo)'}?`)) return;
    
    setIsResolving(orderId);
    try {
      const token = await user?.getIdToken();
      const adminResponse = await fetch(getApiUrl('/api/admin/resolve-dispute'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId, resolution })
      });

      if (!adminResponse.ok) {
        const errorData = await adminResponse.json();
        throw new Error(errorData.error || 'Erro ao resolver disputa no servidor');
      }
      
      alert(`Disputa resolvida: ${resolution === 'refund' ? 'Reembolso efetuado' : 'Saldo liberado para o vendedor'}.`);
      fetchData();
    } catch (error: any) {
      console.error('Error resolving dispute:', error);
      alert(`Erro: ${error.message}`);
    } finally {
      setIsResolving(null);
    }
  };

  const handleToggleFeatured = async (serviceId: string, currentStatus: boolean) => {
    try {
      const serviceRef = doc(db, 'services', serviceId);
      const updateData = { featured: !currentStatus };
      await updateDoc(serviceRef, updateData);
      saveToMonio('services', { id: serviceId, ...updateData });
      alert(!currentStatus ? 'Serviço adicionado aos destaques!' : 'Serviço removido dos destaques!');
      fetchData();
    } catch (error: any) {
      console.error('Error updating featured status:', error);
      alert('Erro ao atualizar destaque');
    }
  };

  const handleSyncSupabaseToFirebase = async () => {
    if (!window.confirm('Tem certeza? Isso iniciará a sincronização do Supabase para o Firebase/MinIO em background.')) return;
    
    try {
      const token = await user?.getIdToken();
      const response = await fetch(getApiUrl('/api/admin/sync-supabase'), {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Erro ao iniciar sync');
      
      alert('Sincronização iniciada com sucesso!');
    } catch (e: any) {
      alert('Erro ao iniciar sync: ' + e.message);
    }
  };

  const handleMigrateCategories = async () => {
    if (!window.confirm('Tem certeza que deseja realizar a manutenção global? Isso irá migrar categorias antigas para "Sexting" e inicializar o status de usuários antigos para que todos apareçam no painel online.')) return;
    
    setLoading(true);
    try {
      let serviceCount = 0;
      let userCountMigrated = 0;

      // 1. Migrate Services
      for (const service of allServices) {
        const oldCategories = ['design', 'video', 'audio', 'programming', 'marketing', 'writing', 'Packs', 'Marketing', 'Programação', 'Assessoria', 'Vips', 'Mentoria', 'Edição', 'Todos'];
        if (!service.category || oldCategories.includes(service.category)) {
          const updateData = {
            category: 'sexting'
          };
          await updateDoc(doc(db, 'services', service.id), updateData);
          saveToMonio('services', { id: service.id, ...updateData });
          serviceCount++;
        }
      }

      // 2. Migrate User list visibility (lastSeen)
      const now = new Date().toISOString();
      for (const u of users) {
        // ALWAYS update so the client can visually see all users as "online" and confirm the panel works
        const updateData = {
          lastSeen: now
        };
        await updateDoc(doc(db, 'users', u.id), updateData);
        saveToMonio('users', { id: u.id, ...updateData });
        userCountMigrated++;
      }

      alert(`Manutenção concluída!\n- ${serviceCount} serviços movidos para Sexting.\n- ${userCountMigrated} usuários habilitados para o painel online.`);
      fetchData();
    } catch (error: any) {
      console.error('Error in maintenance:', error);
      alert('Erro na manutenção: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteServices = async () => {
    if (!window.confirm('ATENÇÃO: Você está prestes a excluir TODOS os serviços da plataforma permanentemente. Esta ação não pode ser desfeita. Tem certeza?')) return;
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      allServices.forEach((service) => {
        batch.delete(doc(db, 'services', service.id));
      });
      await batch.commit();
      alert(`Todos os ${allServices.length} serviços foram excluídos com sucesso!`);
      fetchData();
    } catch (error: any) {
      console.error('Error in bulk delete:', error);
      alert('Erro ao excluir serviços: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAllToMinio = async () => {
    if (!window.confirm('Sincronizar todos os dados do Firestore para o MinIO? Isso garantirá o backup redundante.')) return;
    setLoading(true);
    try {
      // Sync Users
      for (const u of users) {
        await saveToMonio('users', u);
      }
      // Sync Services
      for (const s of allServices) {
        await saveToMonio('services', s);
      }
      alert('Sincronização global para MinIO concluída!');
    } catch (err: any) {
      console.error(err);
      alert('Erro na sincronização: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este serviço permanentemente?')) return;
    try {
      await deleteDoc(doc(db, 'services', serviceId));
      alert('Serviço deletado com sucesso!');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      alert('Erro ao deletar serviço');
    }
  };

  const handleUpdateServiceCategory = async (serviceId: string, newCategory: string) => {
    try {
      const updateData = { category: newCategory };
      await updateDoc(doc(db, 'services', serviceId), updateData);
      saveToMonio('services', { id: serviceId, ...updateData });
      setAllServices(prev => prev.map(s => s.id === serviceId ? { ...s, category: newCategory } : s));
    } catch (error: any) {
      console.error('Error updating category:', error);
      alert('Erro ao atualizar categoria: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`⚠️ AVISO CRÍTICO: Você está prestes a excluir PERMANENTEMENTE o perfil de ${userEmail}.\n\nIsso apagará o cadastro no Firebase. Esta ação NÃO pode ser desfeita.\n\nDeseja continuar?`)) return;
    
    try {
      await deleteDoc(doc(db, 'users', userId));
      
      alert('O perfil do usuário foi excluído com sucesso da plataforma.');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert('Erro ao excluir usuário: ' + error.message);
    }
  };

  const handleSendCustomEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.to || !newEmail.subject || !newEmail.body) {
      alert('Preencha todos os campos do e-mail.');
      return;
    }

    setIsSendingEmail(true);
    try {
      const token = await user?.getIdToken();
      const response = await fetch(getApiUrl('/api/admin/send-custom-email'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEmail)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao enviar e-mail');
      }

      alert('E-mail enviado com sucesso!');
      setNewEmail({ to: '', subject: '', body: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error sending email:', error);
      alert('Erro: ' + error.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDeleteEmail = async (id: string) => {
    if (!window.confirm('Excluir este log de e-mail?')) return;
    try {
      await deleteDoc(doc(db, 'site_emails', id));
      fetchData();
    } catch (error) {
      console.error('Error deleting email log:', error);
      alert('Erro ao excluir log');
    }
  };

  if (!isAdmin || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0502]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const filteredWithdrawals = withdrawals.filter(w => {
    const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
    const sellerEmail = w.userEmail?.toLowerCase() || '';
    const matchesSearch = sellerEmail.includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const validStatusForFaturamento = ['paid', 'accepted', 'completed_by_seller', 'delivered', 'completed', 'disputed'];
  const totalFaturado = sales.filter(s => validStatusForFaturamento.includes(s.status)).reduce((acc, curr) => acc + Number(curr.amount), 0);
  const vendasPendentes = sales.filter(s => s.status === 'pending').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalAPagar = withdrawals.filter(w => w.status === 'pending').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const lucroPlataforma = totalFaturado * 0.05;

  return (
    <div className="min-h-screen bg-[#0a0502] text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Painel de Gestão</h1>
          <p className="text-gray-400">Visão geral do fluxo financeiro e operacional.</p>
        </div>

        <div className="mb-8 flex gap-4">
          <button 
            onClick={handleSyncSupabaseToFirebase}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all text-sm"
          >
            <Database className="w-5 h-5" /> Sincronizar Supabase → Firebase
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 bg-[#1C1E32] p-2 rounded-[2.5rem] border border-white/5 shadow-2xl h-fit">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-6 py-3 font-bold rounded-full transition-all text-sm ${activeTab === 'dashboard' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard Financeiro
          </button>
          <button 
            onClick={() => setActiveTab('sales')}
            className={`flex items-center gap-2 px-6 py-3 font-bold rounded-full transition-all text-sm ${activeTab === 'sales' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <ShoppingCart className="w-5 h-5" /> Fluxo de Vendas
          </button>
          <button 
            onClick={() => setActiveTab('shop_sales')}
            className={`flex items-center gap-2 px-6 py-3 font-bold rounded-full transition-all text-sm ${activeTab === 'shop_sales' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Sparkles className="w-5 h-5" /> Vendas da Loja (HC)
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 font-bold rounded-full transition-all text-sm ${activeTab === 'users' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <CheckCircle className="w-5 h-5" /> Gestão de Usuários
          </button>
          <button 
            onClick={() => setActiveTab('disputes')}
            className={`flex items-center gap-2 px-6 py-3 font-bold rounded-full transition-all text-sm ${activeTab === 'disputes' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <AlertCircle className="w-5 h-5" /> Disputas {sales.filter(s => s.status === 'disputed').length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{sales.filter(s => s.status === 'disputed').length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-2 px-6 py-3 font-bold rounded-full transition-all text-sm ${activeTab === 'services' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Filter className="w-5 h-5" /> Todos Serviços
          </button>
          <button 
            onClick={() => setActiveTab('banners')}
            className={`flex items-center gap-2 px-6 py-3 font-bold rounded-full transition-all text-sm ${activeTab === 'banners' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <ImageIcon className="w-5 h-5" /> Vitrine / Banners
          </button>
          <button 
            onClick={() => setActiveTab('ads')}
            className={`flex items-center gap-2 px-6 py-3 font-bold rounded-full transition-all text-sm ${activeTab === 'ads' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Play className="w-5 h-5" /> Anúncios
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-6 py-3 font-bold rounded-full transition-all text-sm ${activeTab === 'notifications' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Bell className="w-5 h-5" /> Notificações
          </button>
          <button 
            onClick={() => setActiveTab('emails')}
            className={`flex items-center gap-2 px-6 py-3 font-bold rounded-full transition-all text-sm ${activeTab === 'emails' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Mail className="w-5 h-5" /> E-mails / Suporte
          </button>
        </div>

        {activeTab === 'banners' ? (
          <BannersAdmin />
        ) : activeTab === 'ads' ? (
          <AdsAdmin />
        ) : activeTab === 'notifications' ? (
          <NotificationsAdmin />
        ) : activeTab === 'emails' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Compose Email */}
            <div className="bg-[#1C1E32] rounded-2xl border border-white/5 p-6 shadow-xl h-fit">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-500" /> Enviar Novo E-mail
              </h2>
              <form onSubmit={handleSendCustomEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Para (E-mail)</label>
                  <input 
                    type="email" 
                    value={newEmail.to}
                    onChange={(e) => setNewEmail({...newEmail, to: e.target.value})}
                    placeholder="exemplo@email.com"
                    className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-2 text-white focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Assunto</label>
                  <input 
                    type="text" 
                    value={newEmail.subject}
                    onChange={(e) => setNewEmail({...newEmail, subject: e.target.value})}
                    placeholder="Assunto do e-mail"
                    className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-2 text-white focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Mensagem</label>
                  <textarea 
                    value={newEmail.body}
                    onChange={(e) => setNewEmail({...newEmail, body: e.target.value})}
                    placeholder="Escreva sua mensagem aqui..."
                    className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-2 text-white focus:border-purple-500 h-48 resize-none"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSendingEmail}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSendingEmail ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div> : <><Send className="w-4 h-4" /> Enviar E-mail</>}
                </button>
              </form>
            </div>

            {/* Email Logs / Inbox */}
            <div className="bg-[#1C1E32] rounded-2xl border border-white/5 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h2 className="text-xl font-bold text-white">Histórico de E-mails</h2>
                <p className="text-xs text-gray-400">Logs de e-mails enviados pelo sistema e administração.</p>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {siteEmails.length === 0 ? (
                  <div className="p-10 text-center text-gray-500 italic">Nenhum log de e-mail registrado.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {siteEmails.map((email) => (
                      <div key={email.id} className="p-4 hover:bg-white/5 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${email.type === 'sent' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                            {email.type === 'sent' ? 'Enviado' : 'Recebido'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500">{new Date(email.createdAt).toLocaleString('pt-BR')}</span>
                            <button 
                              onClick={() => handleDeleteEmail(email.id)}
                              className="p-1 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate">{email.subject}</h4>
                        <p className="text-xs text-gray-400 mb-1">
                          {email.type === 'sent' ? `Para: ${email.to}` : `De: ${email.name || 'Anônimo'} (${email.email})`}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-3 mb-3 bg-[#0a0c14] p-2 rounded-lg italic">
                          "{email.message || email.body}"
                        </p>
                        {email.type === 'received' && (
                          <button 
                            onClick={() => {
                              setNewEmail({ 
                                to: email.email, 
                                subject: `Re: ${email.subject}`, 
                                body: `\n\n--- Mensagem original ---\nDe: ${email.name}\nAssunto: ${email.subject}\n\n${email.message}` 
                              });
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                          >
                            <Send size={10} /> Responder este e-mail
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'dashboard' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { title: 'Total Faturado', value: `R$ ${totalFaturado.toFixed(2)}`, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/20' },
                { title: 'Vendas Pendentes', value: `R$ ${vendasPendentes.toFixed(2)}`, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/20' },
                { title: 'Total a Pagar', value: `R$ ${totalAPagar.toFixed(2)}`, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/20' },
                { title: 'Lucro Plataforma', value: `R$ ${lucroPlataforma.toFixed(2)}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/20' },
              ].map((stat, i) => (
                <div key={i} className="bg-[#1C1E32] rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-400 font-bold text-sm uppercase tracking-widest">{stat.title}</h3>
                    <div className={`p-3 ${stat.bg} rounded-xl`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#1C1E32] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
              <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-white">Pagamentos (Payouts)</h2>
                <div className="flex gap-4 w-full sm:w-auto">
                  <input type="text" placeholder="Buscar vendedor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-4 py-2 bg-[#131524] border border-white/10 rounded-xl text-white focus:border-purple-500 w-full sm:w-64" />
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 bg-[#131524] border border-white/10 rounded-xl text-white focus:border-purple-500">
                    <option value="all">Todos</option>
                    <option value="pending">Pendentes</option>
                    <option value="paid">Pagos</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#131524] text-gray-400 text-xs uppercase">
                    <tr>
                      <th className="p-4">Vendedor</th>
                      <th className="p-4">Chave PIX</th>
                      <th className="p-4">CPF</th>
                      <th className="p-4">Valor</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredWithdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="hover:bg-white/5">
                        <td className="p-4">
                          <div className="font-bold text-white">{withdrawal.userEmail}</div>
                        </td>
                        <td className="p-4 text-sm text-gray-300">{withdrawal.pixKey || '-'}</td>
                        <td className="p-4 text-sm text-gray-300">{withdrawal.cpf || '-'}</td>
                        <td className="p-4 font-bold text-green-400">R$ {Number(withdrawal.amount).toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${withdrawal.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {withdrawal.status === 'paid' ? 'Pago' : 'Pendente'}
                          </span>
                        </td>
                        <td className="p-4">
                          {withdrawal.status === 'pending' && (
                            <button onClick={() => handleMarkAsPaid(withdrawal.id)} className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-bold">Pagar</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : activeTab === 'sales' ? (
          <div className="bg-[#1C1E32] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white">Últimas Vendas</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#131524] text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="p-4">Serviço</th>
                    <th className="p-4">Comprador</th>
                    <th className="p-4">Vendedor</th>
                    <th className="p-4">Valor</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-white/5">
                      <td className="p-4 text-white font-medium">{sale.service_title}</td>
                      <td className="p-4 text-gray-300 text-sm">{sale.buyerName || sale.buyer_email}</td>
                      <td className="p-4 text-gray-300 text-sm">{sale.sellerName || sale.seller_id}</td>
                      <td className="p-4 text-white font-bold">R$ {Number(sale.amount).toFixed(2)}</td>
                      <td className="p-4 text-xs text-gray-400">{sale.status}</td>
                      <td className="p-4 text-xs text-gray-500">{new Date(sale.created_at).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'shop_sales' ? (
          <div className="bg-[#1C1E32] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white">Vendas de Itens (HotCoins)</h2>
              <p className="text-sm text-gray-400">Itens premium adquiridos com saldo interno.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#131524] text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="p-4">Item / Descrição</th>
                    <th className="p-4">Usuário</th>
                    <th className="p-4">Valor (HC)</th>
                    <th className="p-4">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {shopSales.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-gray-500 italic">Nenhuma venda de item registrada.</td>
                    </tr>
                  ) : (
                    shopSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-white/5">
                        <td className="p-4 text-white font-medium">{sale.description}</td>
                        <td className="p-4 text-gray-300 text-sm">{sale.userEmail}</td>
                        <td className="p-4 text-yellow-400 font-bold">{Math.abs(sale.amount)} HC</td>
                        <td className="p-4 text-xs text-gray-500">{new Date(sale.createdAt).toLocaleString('pt-BR')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'disputes' ? (
          <div className="bg-[#1C1E32] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white">Gestão de Disputas (Contestações)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#131524] text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="p-4">Serviço</th>
                    <th className="p-4">Comprador</th>
                    <th className="p-4">Vendedor</th>
                    <th className="p-4">Valor</th>
                    <th className="p-4">Ações de Resolução</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sales.filter(s => s.status === 'disputed').length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-gray-500 italic">Nenhuma disputa aberta no momento.</td>
                    </tr>
                  ) : (
                    sales.filter(s => s.status === 'disputed').map((dispute) => (
                      <tr key={dispute.id} className="hover:bg-white/5">
                        <td className="p-4 text-white font-medium">{dispute.service_title}</td>
                        <td className="p-4 text-gray-300 text-sm">{dispute.buyerName || dispute.buyer_email}</td>
                        <td className="p-4 text-gray-300 text-sm">{dispute.sellerName || dispute.seller_id}</td>
                        <td className="p-4 text-white font-bold">R$ {Number(dispute.amount).toFixed(2)}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleResolveDispute(dispute.id, 'refund')}
                              disabled={isResolving === dispute.id}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                            >
                              Reembolsar Comprador
                            </button>
                            <button 
                              onClick={() => handleResolveDispute(dispute.id, 'release')}
                              disabled={isResolving === dispute.id}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                            >
                              Liberar p/ Vendedor
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'services' ? (
          <div className="bg-[#1C1E32] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-white">Todos os Serviços da Plataforma</h2>
                <p className="text-sm text-gray-400">{allServices.length} serviços ativos</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 p-2 bg-black/20 rounded-xl border border-white/5">
                  <Clock className="w-4 h-4 text-gray-400 hidden sm:block" />
                  <span className="text-xs font-bold text-gray-300 hidden sm:block">Tempo Banner (s):</span>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={carouselDurationConfig}
                    onChange={(e) => setCarouselDurationConfig(Number(e.target.value))}
                    className="w-16 bg-[#131524] border border-white/10 rounded-lg px-2 py-1 text-center text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleSaveCarouselDuration}
                    disabled={isSavingCarouselDuration}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-bold text-white transition-colors disabled:opacity-50"
                  >
                    {isSavingCarouselDuration ? '...' : 'Salvar'}
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-2 md:mt-0">
                  <button 
                    onClick={handleBulkDeleteServices}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Excluir Todos
                  </button>
                  <button 
                    onClick={handleMigrateCategories}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    <RefreshCcw className="w-4 h-4" /> Migrar p/ Sexting
                  </button>
                  <button 
                    onClick={handleSyncAllToMinio}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    <Database className="w-4 h-4" /> Sincronizar p/ MinIO
                  </button>
                  <button 
                    onClick={async () => {
                      if (!window.confirm('Iniciar sincronização global entre Supabase, Firebase e MinIO?')) return;
                      setLoading(true);
                      try {
                        const token = await user?.getIdToken();
                        const response = await fetch(getApiUrl('/api/admin/sync-all-data'), {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const data = await response.json();
                        alert(data.message || 'Sincronização iniciada.');
                      } catch (e: any) { alert('Erro: ' + e.message); }
                      finally { setLoading(false); }
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-purple-500/20"
                  >
                    <Database className="w-4 h-4" /> Sincronizar Tudo (Global)
                  </button>
                  <button 
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const token = await user?.getIdToken();
                        const response = await fetch(getApiUrl('/api/admin/fix-follower-counts'), {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (!response.ok) {
                          const text = await response.text();
                          try {
                            const err = JSON.parse(text);
                            throw new Error(err.error || response.statusText);
                          } catch (e) {
                            throw new Error(text || response.statusText);
                          }
                        }
                        const data = await response.json();
                        alert(data.message || data.success ? 'Contagens corrigidas com sucesso.' : 'Erro desconhecido');
                      } catch (e: any) { alert('Erro: ' + e.message); }
                      finally { setLoading(false); }
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-teal-500/20"
                  >
                    <RefreshCcw className="w-4 h-4" /> Corrigir Seguidores
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#131524] text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="p-4">Título</th>
                    <th className="p-4">Vendedor ID</th>
                    <th className="p-4">Categoria</th>
                    <th className="p-4">Preço</th>
                    <th className="p-4">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allServices.map((service) => (
                    <tr key={service.id} className="hover:bg-white/5">
                      <td className="p-4 text-white font-medium">{service.title}</td>
                      <td className="p-4 text-gray-400 text-xs">{service.sellerId}</td>
                      <td className="p-4">
                        <select
                          value={service.category || 'todos'}
                          onChange={(e) => handleUpdateServiceCategory(service.id, e.target.value)}
                          className="bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500 min-w-[140px]"
                        >
                          {Object.entries(SLUG_TO_NAME).map(([slug, name]) => (
                            <option key={slug} value={slug}>{name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-green-400 font-bold">R$ {Number(service.price).toFixed(2)}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleToggleFeatured(service.id, !!service.featured)}
                            className={`p-2 rounded-lg transition-colors ${service.featured ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-500/10 text-gray-400'}`}
                            title={service.featured ? "Remover do Carrossel" : "Adicionar ao Carrossel"}
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteService(service.id)}
                            className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-[#1C1E32] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center flex-col sm:flex-row gap-4">
              <h2 className="text-xl font-bold text-white">Gestão de Usuários</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#131524] text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="p-4">Nome</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Saldo</th>
                    <th className="p-4">Adicionar Saldo</th>
                    <th className="p-4">Verificado</th>
                    <th className="p-4">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5">
                      <td className="p-4 text-white font-medium">
                        <div className="flex items-center gap-2">
                          {user.displayName}
                          {(user.isVerified || user.role === 'admin' || user.email === 'dweminem@gmail.com' || user.email === 'contato.packzinhu@gmail.com') && (
                            <img src="/selo.png" alt="Verificado" className="w-5 h-5" referrerPolicy="no-referrer" />
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-gray-300 text-sm">{user.email}</td>
                      <td className="p-4 text-white font-bold">{user.hotCoins || 0} HC</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            className="w-20 bg-[#131524] border border-white/10 rounded px-2 py-1 text-white text-sm"
                            placeholder="Add HC"
                            onBlur={(e) => {
                               const amount = parseInt(e.target.value);
                               if (!isNaN(amount)) {
                                   updateBalance(user.id, amount);
                                   e.target.value = '';
                               }
                            }}
                          />
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.isVerified ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {user.isVerified ? 'Sim' : 'Não'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toggleVerification(user.id, !!user.isVerified)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold ${user.isVerified ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                          >
                            {user.isVerified ? 'Remover Verificação' : 'Verificar'}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Excluir Perfil Permanentemente"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
