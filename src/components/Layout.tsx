import { useState, useRef, useEffect, useCallback } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { getApiUrl } from "../config";
import { requestNotificationPermission, getNotificationPermission } from "../utils/notifications";
import AdPlacement from './AdPlacement';
import {
  Home,
  Search,
  PlusSquare,
  User,
  LayoutDashboard,
  LogOut,
  Bell,
  Heart,
  MessageSquare,
  Settings,
  Building,
  History,
  Edit3,
  Globe,
  Mail,
  X,
  DollarSign,
  Volume2,
  VolumeX,
  ShieldCheck,
  Download,
  ShoppingBag,
  Flame,
  Eye,
  Compass,
  Clapperboard,
  LayoutGrid,
  Palette,
  ChevronDown,
  EyeOff,
  CheckCheck,
} from "lucide-react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  updateDoc,
  doc,
  deleteDoc,
  increment,
  getDoc,
  setDoc,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { useNotificationSound } from "./NotificationSoundProvider";

import { useAuth } from "./FirebaseAuthProvider";
import {
  PremiumName,
  PremiumAvatar,
  PremiumBackground,
} from "./PremiumEffects";
import "./FireText.css";
import { CinematicFireText } from "./CinematicFireText";
import AgeVerification from "./AgeVerification";
import CookieConsent from "./CookieConsent";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const createFireParticles = (
  element: HTMLElement,
  count: number = 10,
) => {
  const rect = element.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    particle.className = "absolute pointer-events-none rounded-full";

    const size = Math.random() * 8 + 4;
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;
    particle.style.background = Math.random() > 0.5 ? "#f97316" : "#ef4444";
    particle.style.boxShadow = "0 0 10px #f97316";
    particle.style.zIndex = "9999";

    document.body.appendChild(particle);

    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 40 + 20;
    const time = Math.random() * 0.5 + 0.5;

    particle.animate(
      [
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance}px - 20px)) scale(0)`,
          opacity: 0,
        },
      ],
      {
        duration: time * 1000,
        easing: "cubic-bezier(0,0,0.2,1)",
      },
    ).onfinish = () => particle.remove();
  }
};

export default function Layout() {
  const { user, profile: userProfile } = useAuth();
  const { playSound, browserNotificationsEnabled } = useNotificationSound();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [readGlobalIds, setReadGlobalIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('read_global_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'pt', name: 'PT', path: '/', flag: '🇧🇷' },
    { code: 'en', name: 'EN', path: '/en', flag: '🇺🇸' },
    { code: 'ja', name: 'JA', path: '/ja', flag: '🇯🇵' },
    { code: 'ar', name: 'AR', path: '/ar', flag: '🇸🇦' },
  ];

  const currentLang = languages.find(l => 
    l.path === location.pathname || (l.path === '/' && location.pathname === '')
  ) || languages[0];

  useEffect(() => {
    const handleFocusOrLoad = async () => {
      if (getNotificationPermission() === 'default') {
        const result = await requestNotificationPermission();
        console.log('[Layout] Initial notification request:', result);
      }
    };

    handleFocusOrLoad();
    window.addEventListener('focus', handleFocusOrLoad);
    return () => window.removeEventListener('focus', handleFocusOrLoad);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // (Removed system_stats global listener to save read quota)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = () => {
    setShowInstallModal(true);
  };

  const confirmInstall = async () => {
    setShowInstallModal(false);
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    // FirebaseAuthProvider already handles user.lastSeen updates correctly every 1 min!
    // This duplicate effect has been safely stripped out to prevent rate-limiting and double-writes.
  }, [user]);

  const subscribeToPush = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window && user) {
      if (Notification.permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready;
          let subscription = await registration.pushManager.getSubscription();
          if (!subscription) {
            const response = await fetch(getApiUrl('/api/webpush/vapidPublicKey'));
            const vapidPublicKey = await response.text();
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey.trim());
            
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedVapidKey
            });
          }
          
          await fetch(getApiUrl('/api/webpush/subscribe'), {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await user.getIdToken()}` 
            }
          });
          console.log('[Web Push] Subscribed successfully');
        } catch (e) {
          console.error('Push signup failed', e);
        }
      }
    }
  };

  useEffect(() => {
    if (user && browserNotificationsEnabled) {
      setTimeout(() => subscribeToPush(), 500);
    }
  }, [user, browserNotificationsEnabled]);

  useEffect(() => {
    if (!user) return;

    let fsUnsubscribe: any = null;

    const fetchNotifications = async () => {
      try {
        // Setup Firestore Listen (Primary Realtime)
        const qN = query(
          collection(db, "notifications"),
          where("recipient_id", "in", [user.uid, 'global']),
          orderBy("created_at", "desc"),
          limit(30)
        );
        
        fsUnsubscribe = onSnapshot(qN, (snapshot) => {
          const fsNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const filtered = fsNotifications.filter((n: any) => !(n.recipient_id === 'global' && n.sender_id === user.uid));
          setNotifications(filtered);
          
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const notif: any = change.doc.data();
              if (notif.recipient_id === user.uid || (notif.recipient_id === 'global' && notif.sender_id !== user.uid)) {
                // Play sound if recent
                const timeCreated = ifTs(notif.created_at || notif.createdAt);
                if (new Date().getTime() - timeCreated.getTime() < 10000) {
                     playSound(notif.type);
                     // Browser notification logic... (omitted for brevity in logic but needed)
                }
              }
            }
          });
        });

        // Old legacy fetch removed
      } catch (error: any) {
        console.warn("Notifications sync issue:", error.message);
      }
    };

    // Helper for timestamp conversion since FS and Supa differ
    const ifTs = (v: any) => v?.toDate ? v.toDate() : new Date(v);

    fetchNotifications();

    return () => {
      if (fsUnsubscribe) fsUnsubscribe();
    };
  }, [user, playSound, browserNotificationsEnabled]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('read_global_notifications', JSON.stringify(readGlobalIds));
    }
  }, [readGlobalIds, user]);

  const unreadCount = notifications.filter((n) => {
    if (n.recipient_id === 'global') {
      return !readGlobalIds.includes(n.id);
    }
    return !n.read;
  }).length;
  const unreadOrdersCount = notifications.filter(
    (n) => {
      const isRead = n.recipient_id === 'global' ? readGlobalIds.includes(n.id) : n.read;
      return !isRead && n.type === "order";
    }
  ).length;

  const handleMarkAllAsRead = async () => {
    // 1. Marcar notifficações globais
    const globalUnreadIds = notifications
      .filter((n) => n.recipient_id === 'global' && !readGlobalIds.includes(n.id))
      .map((n) => n.id);
    if (globalUnreadIds.length > 0) {
      setReadGlobalIds((prev) => [...prev, ...globalUnreadIds]);
    }

    // 2. Marcar notificações pessoais
    const personalUnreadIds = notifications
      .filter((n) => n.recipient_id !== 'global' && !n.read)
      .map((n) => n.id);
      
    if (personalUnreadIds.length > 0) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      
      try {
        const batch = writeBatch(db);
        personalUnreadIds.forEach(id => {
          batch.update(doc(db, "notifications", id), { read: true });
        });
        await batch.commit();
      } catch (error) {
        console.error("Error marking all notifications as read in Firestore:", error);
      }
    }
  };

  const handleNotificationClick = async (notification: any) => {
    const isGlobal = notification.recipient_id === 'global';
    const isAlreadyRead = isGlobal ? readGlobalIds.includes(notification.id) : notification.read;

    // Mark as read
    if (!isAlreadyRead) {
      if (isGlobal) {
        setReadGlobalIds(prev => [...prev, notification.id]);
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
        );

        try {
          await updateDoc(doc(db, "notifications", notification.id), { read: true });
        } catch (error) {
          console.error("Error marking notification as read in Firestore:", error);
        }
      }
    }

    // Navigate based on type
    setTimeout(() => {
      setNotificationsOpen(false);

      if (notification.type === 'feed_post') {
        navigate('/feed');
        return;
      }

      switch (notification.type) {
        case "message":
          navigate(`/chat/${notification.sender_id}`);
          break;
        case "like":
        case "comment":
          navigate("/feed");
          break;
        case "order":
          if (
            notification.message.includes("aceitou") ||
            notification.message.includes("recusou") ||
            notification.message.includes("marcou")
          ) {
            navigate("/dashboard?tab=compras");
          } else {
            navigate("/dashboard?tab=vendas");
          }
          break;
        case "follow":
          navigate(`/profile/${notification.sender_id}`);
          break;
        default:
          break;
      }
    }, 150);
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, "notifications", notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setDropdownOpen(false);
    navigate("/");
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef, notificationsRef]);

  // Remove deferredPrompt - App.tsx already uses VisitTracker component
  
  const displayName =
    userProfile?.displayName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Usuário";
  const photoURL =
    userProfile?.photoURL ||
    user?.photoURL ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || "default"}`;
  const isAdmin =
    userProfile?.role === "admin" ||
    user?.email === "dweminem@gmail.com" ||
    user?.email === "contato.packzinhu@gmail.com";
  const isAdminRoute = location.pathname.startsWith("/adm");

  return (
    <div
      className={`min-h-screen text-white font-sans flex flex-col relative ${
        isAdminRoute ? "bg-[#131524]" : "bg-[#0f0f0f]"
      }`}
    >
      <AgeVerification />
      {/* Global Background Effect */}
      {userProfile?.backgroundStyle && (
        <PremiumBackground
          backgroundStyle={userProfile.backgroundStyle}
          className="fixed inset-0 z-[-1] pointer-events-none"
        >
          <div />
        </PremiumBackground>
      )}

      {!isAdminRoute && !userProfile?.backgroundStyle && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            }}
          ></div>
        </div>
      )}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient
            id="greenYellowGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#FACC15" />
          </linearGradient>
          <linearGradient
            id="purplePinkGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <linearGradient
            id="mobileFireGradient"
            x1="0%"
            y1="100%"
            x2="0%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
        </defs>
      </svg>
      <header
        className={`sticky top-0 z-50 transition-colors ${isAdminRoute ? "bg-[#131524]" : "bg-[#0f0f0f] border-b border-white/5"}`}
      >
        <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xl font-black tracking-tighter text-white group"
            >
              <div className="relative">
                <img
                  src="/favicon.png"
                  alt="Logo"
                  className="w-8 h-8 rounded-full transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-purple-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="hidden sm:inline font-black text-2xl tracking-tight text-white">
                PackZinhu
              </span>
            </Link>
            <button
              onClick={() => setShowInstallModal(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white text-xs font-black rounded-full transition-all ml-1 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            >
              <Download className="w-3.5 h-3.5" />
              APP
            </button>
          </div>

          {/* Nav Icons (Desktop) */}
          <div className="hidden lg:flex items-center gap-1 sm:gap-2 px-2">
            <Link
              to="/"
              title="Início"
              className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-full transition-all group"
            >
              <Home className={`w-5 h-5 transition-colors ${location.pathname === "/" ? "text-white" : "text-gray-400 group-hover:text-white"}`} />
              <span className={`text-sm font-semibold transition-colors ${location.pathname === "/" ? "text-white" : "text-gray-400 group-hover:text-white"}`}>Início</span>
            </Link>
            <Link
              to="/services"
              title="Explorar"
              className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-full transition-all group"
              onClick={(e) => createFireParticles(e.currentTarget, 10)}
            >
              <Flame className={`w-5 h-5 transition-colors ${location.pathname === "/services" ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" : "text-orange-500 group-hover:text-orange-400"}`} />
              <span className={`text-sm font-semibold transition-colors ${location.pathname === "/services" ? "text-white" : "text-gray-400 group-hover:text-white"}`}>Explorar</span>
            </Link>
            <Link
              to="/feed"
              title="Feed"
              className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-full transition-all group"
            >
              <MessageSquare className={`w-5 h-5 transition-colors ${location.pathname === "/feed" ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]" : "text-pink-500 group-hover:text-pink-400"}`} />
              <span className={`text-sm font-semibold transition-colors ${location.pathname === "/feed" ? "text-white" : "text-gray-400 group-hover:text-white"}`}>Feed</span>
            </Link>
            <Link
              to="/exclusivos"
              title="Secreto"
              className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-full transition-all group"
            >
              <EyeOff className={`w-5 h-5 transition-colors ${location.pathname === "/exclusivos" ? "text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]" : "text-purple-500 group-hover:text-purple-400"}`} />
              <span className={`text-sm font-semibold transition-colors ${location.pathname === "/exclusivos" ? "text-white" : "text-gray-400 group-hover:text-white"}`}>Secreto</span>
            </Link>
          </div>

          {/* Stats removed / Mobile Install Button Space */}
          <div className="flex flex-col items-center justify-center flex-1 min-w-0">
            {/* Mobile Install Button */}
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="md:hidden mt-1 px-3 py-0.5 bg-purple-600 text-white rounded-full text-[8px] font-bold shadow-lg"
              >
                Instalar App
              </button>
            )}
          </div>

          {/* Actions (Right) */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Selector */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-xs font-black text-gray-400 hover:text-white uppercase tracking-wider"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{currentLang.name}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isLangMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-32 bg-[#131524] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 overflow-hidden"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          navigate(lang.path);
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${
                          currentLang.code === lang.code ? 'bg-purple-500 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span>{lang.name}</span>
                        <span>{lang.flag}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Install App Button */}
            <button
              onClick={handleInstallClick}
              className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-full text-xs font-bold transition-all border border-white/10"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar App
            </button>

            {user ? (
              <>
                <Link
                  to="/chat/list"
                  className="flex flex-col items-center gap-0.5 hover:bg-white/10 rounded-xl px-2 sm:px-3 py-1 transition-colors relative group"
                >
                  <MessageSquare className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors" />
                </Link>

                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="flex flex-col items-center gap-0.5 hover:bg-white/10 rounded-xl px-2 sm:px-3 py-1 transition-colors relative group"
                  >
                    <div className="relative">
                      <Bell className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#0f0f0f]">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </button>

                  {notificationsOpen && (
                    <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:w-80 bg-[#1f1f1f] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 modal-enter">
                      <div className="p-4 border-b border-white/5 bg-[#1f1f1f] flex justify-between items-center">
                        <h3 className="font-bold text-sm">Notificações</h3>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                            title="Marcar tudo como lido"
                          >
                            <CheckCheck className="w-4 h-4" />
                          </button>
                            <button
                              onClick={() => {
                                setNotificationsOpen(false);
                                navigate('/dashboard?tab=config');
                              }}
                              className="text-gray-400 hover:text-white transition-colors"
                              title="Configurações de Notificações"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                        </div>
                      </div>
                      <div className="max-h-[500px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-500 text-sm">
                            Nenhuma notificação por aqui.
                          </div>
                        ) : (
                            notifications.map((n) => {
                              const isRead = n.recipient_id === 'global' ? readGlobalIds.includes(n.id) : n.read;
                              return (
                                <div
                                  key={n.id}
                                  className={`p-4 border-b border-white/5 flex gap-3 hover:bg-white/10 transition-colors cursor-pointer ${!isRead ? "bg-white/5" : "opacity-60"}`}
                                  onClick={() => handleNotificationClick(n)}
                                >
                                  <img
                                    src={
                                      n.sender_photo ||
                                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.sender_id}`
                                    }
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm line-clamp-2">
                                      <span className="font-bold">
                                        {n.sender_name}
                                      </span>{" "}
                                      {n.message}
                                    </p>
                                    <p className="text-[10px] text-gray-500 mt-1">
                                      {new Date(n.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          )}
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  to="/dashboard"
                  className="flex flex-col items-center gap-0.5 hover:bg-white/10 rounded-xl px-2 sm:px-3 py-1 transition-colors"
                >
                  <DollarSign className="w-6 h-6 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]" />
                  <span className="text-[10px] font-bold">Saldo</span>
                </Link>

                <div className="relative ml-2" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-8 h-8 rounded-full overflow-hidden border border-white/10 hover:border-white/30 transition-colors"
                  >
                    <img
                      src={photoURL}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:w-72 bg-[#1f1f1f] border border-white/10 rounded-xl shadow-2xl py-2 z-50 modal-enter">
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 mb-2">
                        <img
                          src={photoURL}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">
                            {displayName}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/profile/${user.uid}`}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 text-sm"
                      >
                        <User size={20} /> Canal (Perfil)
                      </Link>
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 text-sm"
                      >
                        <LayoutDashboard size={20} /> Dashboard
                      </Link>
                      <Link
                        to="/shop"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 text-sm"
                      >
                        <Palette size={20} /> Personalizar Perfil
                      </Link>
                      <div className="border-t border-white/5 my-2"></div>
                      {isAdmin && (
                        <Link
                          to="/adm"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 text-sm text-purple-400"
                        >
                          <ShieldCheck size={20} /> Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/10 text-sm text-red-500"
                      >
                        <LogOut size={20} /> Sair
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-1.5 border border-white/20 rounded-full hover:bg-blue-500/10 hover:border-blue-500/50 transition-colors group"
                >
                  <div className="p-1 rounded-full border border-gray-400 group-hover:border-blue-400">
                    <User
                      size={14}
                      className="text-gray-400 group-hover:text-blue-400"
                    />
                  </div>
                  <span className="text-sm font-bold text-blue-400">
                    Fazer login
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 w-full max-w-screen-2xl mx-auto relative">
        <AdPlacement placementKey="global" />
        
        {/* PC Side Banners are dynamically added to body or global */}


        <main className="flex-1 pb-24 md:pb-0 w-full overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Footer */}
      <footer
        className={`border-t border-white/5 pt-16 pb-8 mt-auto ${isAdminRoute ? "bg-[#131524]" : "bg-transparent relative z-10"}`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img
                  src="/favicon.png"
                  alt="Logo"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-2xl font-black text-white">
                  PackZinhu
                </span>
              </Link>
              <p className="text-gray-400 text-sm max-w-sm">
                VENDEU 95% do Valor é Seu !! SEM Taxa de Saque
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">LINKS RÁPIDOS</h4>
              <div className="flex flex-col gap-4">
                <Link
                  to="/"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Início
                </Link>
                <Link
                  to="/services"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Explorar serviços
                </Link>
                <Link
                  to="/dashboard"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/about"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Sobre Nós
                </Link>
                <Link
                  to="/contact"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Contato
                </Link>
                <Link
                  to="/faq"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Dúvidas (FAQ)
                </Link>
                <Link
                  to="/baixar-app"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Baixar App
                </Link>
                <Link
                  to="/blog"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Blog
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">LEGAL</h4>
              <div className="flex flex-col gap-4">
                <Link
                  to="/privacy"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Política de Privacidade
                </Link>
                <Link
                  to="/terms"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Termos de Uso
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center md:items-start gap-1">
              <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-2 opacity-30 text-center md:text-left leading-tight">
                Os melhores sites para vender fotos dos pés são OnlyFans, Privacy e PackZinhu. Como vender fotos de pés e ganhar dinheiro online agora com Packzin. Vale a pena ganhar dinheiro online com plataformas tipo OnlyFans e alternativa ao Privacy.
              </p>
              <p className="text-gray-500 text-sm">
                © 2026 PackZinhu. Todos os direitos reservados.
              </p>
              <p className="text-gray-500 text-xs">CNPJ: 66.214.569/0001-68</p>
            </div>
            <div className="flex gap-6">
              <Link
                to="/privacy"
                className="text-gray-500 hover:text-white text-sm transition-colors"
              >
                Privacidade
              </Link>
              <Link
                to="/terms"
                className="text-gray-500 hover:text-white text-sm transition-colors"
              >
                Termos
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Navigation */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 border-t border-white/10 z-50 h-[4.5rem] grid grid-cols-5 items-center ${isAdminRoute ? "bg-[#131524]" : "bg-[#0f0f0f]/98 backdrop-blur-xl"}`}
      >
        <Link
          to="/"
          className={`flex flex-col items-center justify-center gap-1 transition-all ${location.pathname === "/" ? "text-gray-200" : "text-gray-500/70"}`}
        >
          <Home className={`w-6 h-6 transition-all ${location.pathname === "/" ? "text-gray-200 drop-shadow-[0_0_8px_rgba(229,231,235,0.5)]" : "text-gray-400"}`} />
          <span className="text-[10px] font-black uppercase tracking-wider">Início</span>
        </Link>
        <Link
          to="/services"
          className={`flex flex-col items-center justify-center gap-1 transition-all ${location.pathname === "/services" ? "text-gray-200" : "text-gray-500/70"}`}
        >
          <Flame className={`w-6 h-6 transition-all ${location.pathname === "/services" ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" : "text-orange-500"}`} />
          <span className="text-[10px] font-black uppercase tracking-wider">Explorar</span>
        </Link>
        <Link
          to="/feed"
          className={`flex flex-col items-center justify-center gap-1 transition-all ${location.pathname === "/feed" ? "text-gray-200" : "text-gray-500/70"}`}
        >
          <MessageSquare
            className={`w-6 h-6 transition-all ${location.pathname === "/feed" ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]" : "text-pink-500"}`}
          />
          <span className="text-[10px] font-black uppercase tracking-wider">Feed</span>
        </Link>
        <Link
          to="/exclusivos"
          className={`flex flex-col items-center justify-center gap-1 transition-all ${location.pathname === "/exclusivos" ? "text-gray-200" : "text-gray-500/70"}`}
        >
          <EyeOff
            className={`w-6 h-6 transition-all ${location.pathname === "/exclusivos" ? "text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]" : "text-purple-500"}`}
          />
          <span className="text-[10px] font-black uppercase tracking-wider">Secreto</span>
        </Link>
        {user ? (
          <Link
            to={`/profile/${user.uid}`}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${location.pathname.startsWith("/profile") ? "text-white active-mobile-icon" : "text-white/40"}`}
          >
            <div className="relative flex items-center justify-center h-6 w-6">
              <img
                src={photoURL}
                className={`w-full h-full rounded-full object-cover ring-2 ${location.pathname.startsWith("/profile") ? "ring-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "ring-white/10"}`}
              />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider">Você</span>
          </Link>
        ) : (
          <Link
            to="/login"
            className={`flex flex-col items-center justify-center gap-1 transition-all ${location.pathname === "/login" ? "text-white active-mobile-icon" : "text-white/40"}`}
          >
            <User className={`w-6 h-6 ${location.pathname === "/login" ? "white-glow-mobile" : ""}`} />
            <span className="text-[10px] font-black uppercase tracking-wider">Login</span>
          </Link>
        )}
      </nav>

      {/* Install App Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1E32] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl modal-enter">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">
                Instalar Aplicativo
              </h3>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center mb-6">
              <img
                src="/android-chrome-512x512.png"
                alt="Logo"
                className="w-32 h-32 rounded-3xl object-cover mb-4 shadow-[0_0_30px_rgba(168,85,247,0.4)]"
              />
              <p className="text-gray-300 text-sm">
                Instale o PackZinhu no seu dispositivo para ter acesso rápido,
                notificações nativas e uma experiência melhor.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowInstallModal(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                Agora não
              </button>
              <button
                onClick={confirmInstall}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Instalar
              </button>
            </div>
          </div>
        </div>
      )}
      <CookieConsent />
    </div>
  );
}
