import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Star,
  ShoppingCart,
  AlertCircle,
  ShieldCheck,
  ShoppingBag,
  Edit3,
  Trash2,
} from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion } from "framer-motion";
import FeedCarousel from "../components/FeedCarousel";
import { API_URL, getApiUrl } from "../config";

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

const FALLBACK_MEDIA: Record<string, string> = {
  "sexting": "https://cdn.packzinhu.online/packzinhu-db/images/sexting.jpeg",
  "avaliacao": "https://cdn.packzinhu.online/packzinhu-db/images/avalia%C3%A7%C3%A3o.jpeg",
  "chamada-video": "https://cdn.packzinhu.online/packzinhu-db/images/chamada%20de%20video.jpeg",
  "pack-pe": "https://cdn.packzinhu.online/packzinhu-db/images/pack%20do%20p%C3%A9.jpeg",
  "pack-explicito": "https://cdn.packzinhu.online/packzinhu-db/images/pack%20de%20fotos%20e%20videos.jpeg",
  "pack-sensual": "https://cdn.packzinhu.online/packzinhu-db/images/pack%20de%20fotos%20e%20videos.jpeg"
};

const ServiceCard = ({
  service,
  index,
  onPurchase,
  isPurchasing,
  userUid,
  onDelete,
}: {
  service: any;
  index: number;
  onPurchase: (service: any) => void;
  isPurchasing: boolean;
  userUid?: string;
  onDelete?: (sid: string) => void;
}) => {
  const isOwner = userUid === service?.sellerId;
  const categorySlug = service?.category || 'sexting';
  const fallback = FALLBACK_MEDIA[categorySlug] || "https://cdn.packzinhu.online/packzinhu-db/images/default.jpg";

  return (
    <motion.div
      whileHover={{
        boxShadow: "0 25px 50px -12px rgba(168, 85, 247, 0.4)",
      }}
      className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden group transition-all duration-500 flex flex-col"
    >
      <div className="glass-shine-effect" />

      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <Link
        to={`/services/${service?.id}`}
        className="relative aspect-[4/3] overflow-hidden bg-[#131524] block"
      >
        {service?.coverUrl ? (
          service?.coverType === "video" ||
          service?.coverUrl?.includes(".mp4") ? (
            <video
              src={service.coverUrl}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
                src={service.coverUrl || fallback}
                alt={service?.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.src = fallback; }}
            />
          )
        ) : (
          <img src={fallback} className="w-full h-full object-cover" alt="Fallback" />
        )}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
          <div className="bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-white/10">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-xs font-bold text-white">
              {service?.rating || "Novo"}
            </span>
          </div>
          <div className="bg-purple-600/60 backdrop-blur-md px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-purple-500/30">
            <ShoppingBag className="w-3.5 h-3.5 text-white" />
            <span className="text-[10px] font-bold text-white">
              {service?.salesCount || 0} vendas
            </span>
          </div>
        </div>
      </Link>

      <div className="p-3 sm:p-5 flex flex-col flex-1 relative z-10">
        <div className="flex items-center gap-2 mb-3 sm:gap-2.5 sm:mb-4">
          <div className="relative">
            <img
              src={
                service?.sellerPhoto ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${service?.sellerId}`
              }
              alt="Seller"
              className="w-5 h-5 sm:w-7 sm:h-7 rounded-full object-cover ring-2 ring-purple-500/30"
            />
          </div>
          <Link
            to={`/profile/${service?.sellerId}`}
            className="shining-name text-[10px] sm:text-sm font-medium truncate hover:opacity-80 transition-opacity flex items-center gap-1"
            title="Admin Verificado"
          >
            {service?.sellerName || "Vendedor"}
            {service?.sellerVerified && (
              <img
                src="/selo.png"
                alt="Verificado"
                className="w-3 h-3 sm:w-4 sm:h-4"
                referrerPolicy="no-referrer"
              />
            )}
          </Link>

          {isOwner && (
            <div className="ml-auto flex gap-1 z-20">
              <Link
                to={`/services/edit/${service.id}`}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-500 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                title="Editar serviço"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (
                    window.confirm(
                      "Você tem certeza que deseja excluir seu serviço?",
                    )
                  ) {
                    if (onDelete) onDelete(service.id);
                  }
                }}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                title="Excluir serviço"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          )}
        </div>

        <Link to={`/profile/${service?.sellerId}`} className="block mb-1.5 sm:mb-2">
          <h3 className="font-bold text-sm sm:text-lg line-clamp-1 group-hover:text-purple-400 transition-colors duration-300">
            {service?.title}
          </h3>
        </Link>
        <p className="text-[10px] sm:text-sm text-gray-400 line-clamp-2 mb-4 sm:mb-6 h-8 sm:h-10 leading-relaxed">
          {service?.description}
        </p>

        <div className="flex items-center justify-between mt-auto pt-3 sm:pt-4 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">
              Preço
            </span>
            <div className="text-base sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              R$ {(Number(service?.price) || 0).toFixed(2)}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPurchase(service);
            }}
            disabled={isPurchasing}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[10px] sm:text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 group/btn"
          >
            {isPurchasing ? (
              "..."
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/btn:-translate-y-0.5 transition-transform duration-300" />
                Comprar
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default function Services() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user] = useAuthState(auth);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFirestoreError = (
    error: unknown,
    operationType: OperationType,
    path: string | null,
  ) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo:
          auth.currentUser?.providerData.map((provider) => ({
            providerId: provider.providerId,
            displayName: provider.displayName,
            email: provider.email,
            photoUrl: provider.photoURL,
          })) || [],
      },
      operationType,
      path,
    };
    console.error("Firestore Error: ", JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  useEffect(() => {
    const q = query(collection(db, "services"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const servicesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setServices(servicesData);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "services");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const handlePurchase = (serviceToBuy?: any) => {
    const service = serviceToBuy;
    if (!user) {
      navigate("/login?redirect=/services");
      return;
    }
    if (!service) return;

    if (user.uid === service.sellerId) {
      setPurchaseError("Você não pode comprar seu próprio serviço.");
      return;
    }

    navigate(`/checkout/${service.id}`);
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await deleteDoc(doc(db, "services", serviceId));
      alert("Serviço deletado com sucesso!");
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Erro ao deletar serviço.");
    }
  };

  return (
    <div className="py-8 relative">
      <Helmet>
        <title>PackZinhu - Explorar Serviços e Conteúdos</title>
        <meta name="description" content="Encontre os melhores serviços e conteúdos exclusivos no PackZinhu. Explore nossa vitrine de criadores." />
        <link rel="canonical" href="https://packzinhu.online/services" />
      </Helmet>
      <div className="w-full overflow-hidden mb-8">
        <FeedCarousel />
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
            Explorar Serviços
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-[#1C1E32] rounded-3xl border border-white/5">
            Nenhum serviço encontrado no momento.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {(services || []).map((service, index) => (
              <ServiceCard
                key={service?.id}
                service={service}
                index={index}
                onPurchase={handlePurchase}
                isPurchasing={isPurchasing}
                userUid={user?.uid}
                onDelete={handleDeleteService}
              />
            ))}
          </div>
        )}

        {/* Purchase Modal removed for direct checkout flow */}
      </div>
    </div>
  );
}
