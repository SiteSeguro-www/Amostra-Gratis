import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/FirebaseAuthProvider';
import { Star, ShoppingCart, ArrowLeft, Shield, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import JsonLd from '../components/JsonLd';
import { Helmet } from 'react-helmet-async';

import { API_URL, getApiUrl } from '../config';

export default function ServiceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchService() {
      if (!id) return;
      try {
        const docRef = doc(db, 'services', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setService({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching service:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchService();
  }, [id]);

  const handlePurchase = () => {
    if (!user) {
      navigate('/login?redirect=/services/' + id);
      return;
    }
    if (!service) return;
    
    if (user.uid === service.sellerId) {
      setPurchaseError('Você não pode comprar seu próprio serviço.');
      return;
    }

    navigate(`/checkout/${service.id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Serviço não encontrado</h2>
        <Link to="/services" className="text-purple-400 hover:text-purple-300 font-bold">
          Voltar para Serviços
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <JsonLd 
        type="Product" 
        data={{
          name: service.title,
          description: service.description,
          image: service.coverUrl,
          category: service.category || 'Conteúdo Digital',
          brand: {
            '@type': 'Brand',
            name: 'PackZinhu'
          },
          offers: {
            '@type': 'Offer',
            price: service.price,
            priceCurrency: 'BRL',
            itemCondition: 'https://schema.org/NewCondition',
            availability: 'https://schema.org/InStock',
            url: `https://packzinhu.online/services/${id}`,
            seller: {
              '@type': 'Person',
              name: service.sellerName,
              url: `https://packzinhu.online/profile/${service.sellerId}`
            }
          },
          aggregateRating: service.rating ? {
            '@type': 'AggregateRating',
            ratingValue: service.rating,
            reviewCount: service.reviewCount || 10,
            bestRating: '5',
            worstRating: '1'
          } : undefined
        }} 
      />
      <Helmet>
        <title>{service.title} | Venda de Packs no PackZinhu</title>
        <meta name="description" content={`Adquira ${service.title} por apenas R$ ${service.price.toFixed(2)}. ${service.description.substring(0, 150)}...`} />
        <meta name="keywords" content={`${service.title}, vender fotos de pés, packs online, Packzinho, Packzin, ${service.sellerName}`} />
        <link rel="canonical" href={`https://packzinhu.online/services/${id}`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="product" />
        <meta property="og:title" content={`${service.title} | PackZinhu`} />
        <meta property="og:description" content={service.description.substring(0, 200)} />
        <meta property="og:image" content={service.coverUrl || "https://packzinhu.online/banner-principal.jpeg"} />
        <meta property="product:price:amount" content={service.price.toString()} />
        <meta property="product:price:currency" content="BRL" />

        {/* Twitter */}
        <meta name="twitter:title" content={`${service.title} | PackZinhu`} />
        <meta name="twitter:description" content={service.description.substring(0, 200)} />
        <meta name="twitter:image" content={service.coverUrl || "https://packzinhu.online/banner-principal.jpeg"} />
      </Helmet>
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Media and Description */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#1C1E32] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="aspect-video bg-[#131524] relative">
              {service.coverUrl ? (
                service.coverType === 'video' || service.coverUrl.includes('.mp4') ? (
                  <video src={service.coverUrl} className="w-full h-full object-cover" controls autoPlay loop muted playsInline />
                ) : (
                  <img src={service.coverUrl} alt={service.title} className="w-full h-full object-cover" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">Sem Imagem</div>
              )}
            </div>
            <div className="p-8">
              <h1 className="text-3xl font-black mb-4">{service.title}</h1>
              <div className="flex items-center gap-6 mb-8 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-white">{service.rating || 'Novo'}</span>
                  <span>({service.reviewCount || 0} avaliações)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Entrega em 24h</span>
                </div>
              </div>
              
              <div className="prose prose-invert max-w-none">
                <h3 className="text-xl font-bold mb-4 text-white">Sobre este serviço</h3>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {service.description}
                </p>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          <div className="bg-[#1C1E32] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h3 className="text-xl font-bold mb-6">Sobre o Vendedor</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Link to={`/profile/${service.sellerId}`}>
                <img 
                  src={service.sellerPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${service.sellerId}`} 
                  alt="Seller" 
                  className="w-16 h-16 rounded-2xl object-cover border border-white/10" 
                />
              </Link>
              <div className="flex-1 min-w-[150px]">
                <Link to={`/profile/${service.sellerId}`} className="font-bold text-lg hover:text-purple-400 transition-colors flex items-center gap-1">
                  {service.sellerName}
                  <img src="/selo.png" alt="Verificado" className="w-5 h-5" referrerPolicy="no-referrer" />
                </Link>
                <p className="text-sm text-gray-400">Vendedor Verificado</p>
              </div>
              <Link 
                to={`/profile/${service.sellerId}`}
                className="w-full sm:w-auto text-center px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-colors"
              >
                Ver Perfil
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Card */}
        <div className="space-y-6">
          <div className="bg-[#1C1E32] border border-white/10 rounded-3xl p-8 shadow-2xl sticky top-24">
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-1">Preço do Serviço</div>
              <div className="text-4xl font-black text-green-400">R$ {(Number(service.price) || 0).toFixed(2)}</div>
            </div>

            {purchaseError && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl flex items-center gap-2 text-sm mb-6">
                <AlertCircle className="w-4 h-4" />
                {purchaseError}
              </div>
            )}

            <button 
              onClick={handlePurchase}
              disabled={isPurchasing}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 mb-6 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isPurchasing ? (
                <>Processando...</>
              ) : (
                <>Comprar Agora <ShoppingCart className="w-5 h-5" /></>
              )}
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Shield className="w-5 h-5 text-green-400" />
                <span>Pagamento 100% Seguro</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Acesso Imediato após confirmação</span>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
              <p className="text-xs text-center text-gray-500">
                Ao comprar, você concorda com nossos termos de uso e política de privacidade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
