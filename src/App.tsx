import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './firebase';
import { requestNotificationPermission } from './utils/notifications';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import JsonLd from './components/JsonLd';
import { Helmet } from 'react-helmet-async';

// Lazy loading for pages to optimize initial bundle size
const Home = lazy(() => import('./pages/Home'));
const Landing = lazy(() => import('./pages/Landing'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const Feed = lazy(() => import('./pages/Feed'));
const Services = lazy(() => import('./pages/Services'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const ServiceDetails = lazy(() => import('./pages/ServiceDetails'));
const CreatePost = lazy(() => import('./pages/CreatePost'));
const CreateService = lazy(() => import('./pages/CreateService'));
const Chat = lazy(() => import('./pages/Chat'));
const ChatList = lazy(() => import('./pages/ChatList'));
const Checkout = lazy(() => import('./pages/Checkout'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const MercadoPagoCallback = lazy(() => import('./pages/MercadoPagoCallback'));
const About = lazy(() => import('./pages/About'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Contact = lazy(() => import('./pages/Contact'));
const Admin = lazy(() => import('./pages/Admin'));
const Shop = lazy(() => import('./pages/Shop'));
const Packzin = lazy(() => import('./pages/Packzin'));
const Packzinho = lazy(() => import('./pages/Packzinho'));
const FAQ = lazy(() => import('./pages/FAQ'));
const DownloadApp = lazy(() => import('./pages/DownloadApp'));
const SEOArticleVenderFotos = lazy(() => import('./pages/SEOArticleVenderFotos'));
const SEOArticleComparison = lazy(() => import('./pages/SEOArticleComparison'));
const SEOArticleBestSites = lazy(() => import('./pages/SEOArticleBestSites'));
const SEOArticleFeetPhotos = lazy(() => import('./pages/SEOArticleFeetPhotos'));
const SEOArticleFeetMoney = lazy(() => import('./pages/SEOArticleFeetMoney'));
const SEOArticleFamousSites = lazy(() => import('./pages/SEOArticleFamousSites'));
const SEOArticleBestSitesList = lazy(() => import('./pages/SEOArticleBestSitesList'));
const SEOArticlePackzinhuReliable = lazy(() => import('./pages/SEOArticlePackzinhuReliable'));
const SEOArticleSimilarPrivacy = lazy(() => import('./pages/SEOArticleSimilarPrivacy'));
const SEOArticleSimilarOnlyFans = lazy(() => import('./pages/SEOArticleSimilarOnlyFans'));
const SEOArticleEarnMoneyPhotos = lazy(() => import('./pages/SEOArticleEarnMoneyPhotos'));
const SEOArticleBestAppsFeet = lazy(() => import('./pages/SEOArticleBestAppsFeet'));
const Blog = lazy(() => import('./pages/Blog'));
const HomeEN = lazy(() => import('./pages/HomeEN'));
const HomeJA = lazy(() => import('./pages/HomeJA'));
const HomeAR = lazy(() => import('./pages/HomeAR'));
const Exclusivos = lazy(() => import('./pages/Exclusivos'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
  </div>
);

function App() {
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    }
    testConnection();

    // Auto-request notifications on first load and every return
    const requestNotifications = async () => {
      // Small delay to ensure browser readiness
      setTimeout(async () => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
          try {
             // We attempt to trigger the browser prompt. 
             // Note: Most browsers block this without user interaction, 
             // but we try anyway as per user "Nativo Persistente" requirement.
             await requestNotificationPermission();
          } catch (e) {
            console.warn('Initial notification request ignored/blocked by browser. User gesture will be required via UI.');
          }
        }
      }, 2000);
    };
    
    requestNotifications();

    const handleFocus = () => {
      // Re-request if still default when returning to the tab
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        requestNotificationPermission().catch(() => {});
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <ErrorBoundary>
      <JsonLd 
        type="WebSite" 
        data={{
          name: 'PackZinhu',
          url: 'https://packzinhu.online',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://packzinhu.online/shop?search={search_term_string}',
            'query-input': 'required name=search_term_string'
          }
        }} 
      />
      <JsonLd 
        type="Organization" 
        data={{
          name: 'PackZinhu',
          url: 'https://packzinhu.online',
          logo: 'https://packzinhu.online/favicon.png',
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+55-11-99999-9999',
            contactType: 'customer service',
            areaServed: 'BR',
            availableLanguage: 'Portuguese'
          },
          sameAs: [
            'https://twitter.com/packzinhu',
            'https://instagram.com/packzinhu',
            'https://t.me/packzinhu'
          ]
        }} 
      />
      <Router key={Math.random()}>
        <ScrollToTop />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Landing />} />
              <Route path="home" element={<Home />} />
              <Route path="en" element={<HomeEN />} />
              <Route path="ja" element={<HomeJA />} />
              <Route path="ar" element={<HomeAR />} />
              <Route path="exclusivos" element={<Exclusivos />} />
              <Route path="category/:categorySlug" element={<CategoryPage />} />
              <Route path="shop" element={<Shop />} />
              <Route path="feed" element={<Feed />} />
              <Route path="services" element={<Services />} />
              <Route path="services/:id" element={<ServiceDetails />} />
              <Route path="checkout/:serviceId" element={<Checkout />} />
              <Route path="payment/success" element={<PaymentSuccess />} />
              <Route path="callback" element={<MercadoPagoCallback />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="profile/:id" element={<Profile />} />
              <Route path="create-post" element={<CreatePost />} />
              <Route path="create-service" element={<CreateService />} />
              <Route path="edit-service/:id" element={<CreateService />} />
              <Route path="services/edit/:id" element={<CreateService />} />
              <Route path="chat/:id" element={<Chat />} />
              <Route path="chat/list" element={<ChatList />} />
              <Route path="about" element={<About />} />
              <Route path="terms" element={<Terms />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="contact" element={<Contact />} />
              <Route path="adm" element={<Admin />} />
              <Route path="packzin" element={<Packzin />} />
              <Route path="packzinho" element={<Packzinho />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="baixar-app" element={<DownloadApp />} />
              
              {/* SEO Landing Pages */}
              <Route path="como-vender-fotos-de-pe" element={<SEOArticleVenderFotos />} />
              <Route path="melhores-sites-para-vender-fotos" element={<SEOArticleBestSites />} />
              <Route path="Qual-site-paga-por-fotos-de-pés" element={<SEOArticleFeetPhotos />} />
              <Route path="Vender-fotos-dos-pés-dá-dinheiro" element={<SEOArticleFeetMoney />} />
              <Route path="os-sites-mais-conhecidos-para-vender-fotos-de-pés" element={<SEOArticleFamousSites />} />
              <Route path="os-melhores-sites-para-vender-fotos-dos-pés-packzinhu-FeetFinder-Instafeet-Feetify-FeetPics-onlyfans-privacy" element={<SEOArticleBestSitesList />} />
              <Route path="packzinhu-é-confiável" element={<SEOArticlePackzinhuReliable />} />
              <Route path="Sites-parecidos-com-Privacy" element={<SEOArticleSimilarPrivacy />} />
              <Route path="Sites-parecidos-com-OnlyFans" element={<SEOArticleSimilarOnlyFans />} />
              <Route path="blog" element={<Blog />} />
              <Route path="onlyfans-vs-privacy-vs-packzinhu" element={<SEOArticleComparison />} />
              <Route path="como-ganhar-dinheiro-com-fotos-online" element={<SEOArticleEarnMoneyPhotos />} />
              <Route path="Os-melhores-apps-para-vender-foto-do-pe-e-lucrar-muito" element={<SEOArticleBestAppsFeet />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
