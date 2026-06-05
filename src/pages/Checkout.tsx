import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/FirebaseAuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShieldCheck, CreditCard, QrCode, ArrowLeft, Lock, CheckCircle2, AlertCircle, ChevronRight, ShoppingCart } from 'lucide-react';
import { getApiUrl } from '../config';

const ReviewComponent = ({ reviews }: { reviews: any[] }) => {
  if (reviews.length === 0) return null;
  return (
    <div className="mt-8 pt-8 border-t border-white/10">
      <h3 className="text-lg font-bold mb-4">Avaliações deste serviço</h3>
      <div className="space-y-4">
        {reviews.map((review, i) => (
          <div key={i} className="bg-[#131524] p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className={`w-3 h-3 ${j < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
              ))}
            </div>
            <p className="text-sm text-gray-300">{review.comment}</p>
            <p className="text-xs text-gray-500 mt-2 font-medium">{review.buyerName}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Checkout() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [service, setService] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [reviews, setReviews] = useState<any[]>([]);
  
  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/checkout/' + serviceId);
      return;
    }

    async function fetchServiceAndSeller() {
      if (!serviceId) return;
      try {
        const docRef = doc(db, 'services', serviceId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as any;
          if (data.sellerId === user.uid) {
             setError('Você não pode comprar seu próprio serviço.');
          }
          setService(data);

          // Fetch seller info
          const sellerSnap = await getDoc(doc(db, 'users', data.sellerId));
          if (sellerSnap.exists()) {
            setSeller(sellerSnap.data());
          }
          
          // Fetch reviews
          const reviewsQuery = query(collection(db, 'reviews'), where('serviceId', '==', serviceId));
          const reviewsSnap = await getDocs(reviewsQuery);
          setReviews(reviewsSnap.docs.map(doc => doc.data()));
        } else {
          setError('Serviço não encontrado.');
        }
      } catch (err) {
        console.error("Error fetching service:", err);
        setError('Erro ao carregar informações do serviço.');
      } finally {
        setLoading(false);
      }
    }
    fetchServiceAndSeller();
  }, [serviceId, user, navigate]);

  const handlePayment = async () => {
    if (!user || !service || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl('/api/create-mercadopago-preference'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          serviceTitle: service.title,
          amount: Number(service.price),
          sellerId: service.sellerId,
          buyerId: user.uid,
          buyerName: user.displayName || user.email?.split('@')[0] || 'Usuário',
          buyerEmail: user.email,
        }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Invalid JSON response:", text);
        throw new Error("Erro no servidor ao processar o pagamento. Por favor, tente novamente mais tarde.");
      }

      if (data.error) {
        let msg = data.error || 'Erro ao processar pagamento.';
        if (msg.includes('16 UNAUTHENTICATED')) {
          msg = 'Erro de Autenticação no Firebase: A chave FIREBASE_SERVICE_ACCOUNT está ausente ou inválida.';
        }
        throw new Error(msg);
      }

      if (!response.ok) {
        throw new Error(data.message || 'Erro no servidor ao processar pagamento.');
      }

      if (data.init_point) {
        // Redirect to Mercado Pago
        setIsProcessing(true);
        // Inform the user
        const redirectMsg = document.createElement('div');
        redirectMsg.style.position = 'fixed';
        redirectMsg.style.top = '0';
        redirectMsg.style.left = '0';
        redirectMsg.style.width = '100%';
        redirectMsg.style.height = '100%';
        redirectMsg.style.backgroundColor = 'rgba(10, 5, 2, 0.95)';
        redirectMsg.style.display = 'flex';
        redirectMsg.style.flexDirection = 'column';
        redirectMsg.style.alignItems = 'center';
        redirectMsg.style.justifyContent = 'center';
        redirectMsg.style.zIndex = '9999';
        redirectMsg.style.color = 'white';
        redirectMsg.style.textAlign = 'center';
        redirectMsg.style.padding = '20px';
        redirectMsg.innerHTML = `
          <div style="width: 60px; height: 60px; border: 4px solid #a855f7; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
          <h2 style="font-size: 24px; font-weight: 900; margin-bottom: 10px;">Redirecionando para o Mercado Pago...</h2>
          <p style="color: #9ca3af; max-width: 400px;">Após concluir o pagamento, você será trazido de volta automaticamente para confirmar seu pedido.</p>
          <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        `;
        document.body.appendChild(redirectMsg);
        
        setTimeout(() => {
          window.location.href = data.init_point;
        }, 2000);
      } else {
        throw new Error('URL de pagamento não recebida.');
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || 'Erro ao iniciar o pagamento. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#131524]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error && !service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#131524] px-4">
        <div className="bg-[#1C1E32] border border-white/5 p-8 rounded-[2.5rem] text-center max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">{error}</h2>
          <button 
            onClick={() => navigate('/services')}
            className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all"
          >
            Voltar para Serviços
          </button>
        </div>
      </div>
    );
  }

  const commission = Number(service.price) * 0.05;
  const total = Number(service.price);

  return (
    <div className="min-h-screen bg-[#131524] text-white selection:bg-purple-500/30">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="hidden md:block absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="hidden md:block absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-12">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
          <span>Voltar</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Order Summary */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Checkout Seguro
              </h1>
              <p className="text-gray-400">Finalize sua compra com total segurança e garantia.</p>
            </div>

            <div className="bg-[#1C1E32] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl group-hover:bg-purple-600/20 transition-colors" />
              
              <div className="flex gap-6 mb-8">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0">
                  <img 
                    src={service.coverUrl || `https://picsum.photos/seed/${service.id}/200/200`} 
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">{service.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${service.sellerId}`} 
                        className="w-5 h-5 rounded-full" 
                        alt="Seller"
                      />
                      <span className="flex items-center gap-1">
                        Vendido por <span className="text-white font-medium">{service.sellerName}</span>
                        {(seller?.isVerified || seller?.role === 'admin' || seller?.email === 'dweminem@gmail.com' || seller?.email === 'contato.packzinhu@gmail.com') && (
                          <img src="/selo.png" alt="Verificado" className="w-5 h-5" referrerPolicy="no-referrer" />
                        )}
                      </span>
                    </div>
                    {(seller?.isVerified || seller?.role === 'admin' || seller?.email === 'dweminem@gmail.com' || seller?.email === 'contato.packzinhu@gmail.com') ? (
                      <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Verificado
                      </span>
                    ) : seller?.mercadoPagoId ? (
                      <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-md flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5" /> MP Conectado
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold rounded-md flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" /> MP Pendente
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Taxa de Serviço</span>
                  <span className="text-green-400">R$ 0,00</span>
                </div>
                <div className="flex justify-between items-end pt-4">
                  <span className="text-lg font-bold">Total a pagar</span>
                  <span className="text-3xl font-black text-white">R$ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1C1E32] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-green-400" />
                <div className="text-xs">
                  <div className="font-bold">Garantia</div>
                  <div className="text-gray-500">Compra Protegida</div>
                </div>
              </div>
              <div className="bg-[#1C1E32] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
                <Lock className="w-6 h-6 text-blue-400" />
                <div className="text-xs">
                  <div className="font-bold">Segurança</div>
                  <div className="text-gray-500">SSL Criptografado</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Payment Methods */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-[#1C1E32] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                Forma de Pagamento
              </h3>

              <div className="space-y-4 mb-8">
                <button 
                  onClick={() => setPaymentMethod('pix')}
                  className={`w-full p-5 rounded-2xl border transition-all flex items-center justify-between group ${
                    paymentMethod === 'pix' 
                    ? 'bg-purple-600/20 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]' 
                    : 'bg-[#131524] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${paymentMethod === 'pix' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold">PIX</div>
                      <div className="text-xs text-gray-500">Aprovação instantânea</div>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'pix' ? 'border-purple-500 bg-purple-500' : 'border-white/10'}`}>
                    {paymentMethod === 'pix' && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                </button>

                <button 
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full p-5 rounded-2xl border transition-all flex items-center justify-between group ${
                    paymentMethod === 'card' 
                    ? 'bg-purple-600/20 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]' 
                    : 'bg-[#131524] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${paymentMethod === 'card' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold">Cartão de Crédito</div>
                      <div className="text-xs text-gray-500">Até 12x no Mercado Pago</div>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'card' ? 'border-purple-500 bg-purple-500' : 'border-white/10'}`}>
                    {paymentMethod === 'card' && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-2xl flex items-center gap-3 text-sm mb-6 animate-shake">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button 
                onClick={handlePayment}
                disabled={isProcessing || !!error}
                className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black rounded-2xl transition-all duration-300 shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:shadow-[0_15px_40px_rgba(168,85,247,0.5)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden animate-pulse hover:animate-none hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <span className="relative z-10">Pagar com Mercado Pago</span>
                    <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <ReviewComponent reviews={reviews} />

              <div className="mt-6 flex items-center justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                <img src="https://logodownload.org/wp-content/uploads/2019/06/mercado-pago-logo.png" alt="Mercado Pago" className="h-4" />
                <div className="w-px h-4 bg-white/20" />
                <img src="https://logodownload.org/wp-content/uploads/2020/02/pix-logo.png" alt="PIX" className="h-4" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500">
                Processado com segurança pelo Mercado Pago.
              </p>
              <div className="flex justify-center gap-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-1 h-1 rounded-full bg-white/10" />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
