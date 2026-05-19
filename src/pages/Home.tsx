import CategoryLayout from '../components/CategoryLayout';
import FeedView from '../components/FeedView';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import JsonLd from '../components/JsonLd';
import { SLUG_TO_NAME } from '../constants';

export default function Home() {
  const location = useLocation();
  const path = location.pathname;
  
  // Pegar a categoria do state da rota ou do SLUG_TO_NAME se for navegação
  const stateCategory = location.state?.category;
  
  // Find name from slug
  let activeCatName = "Todos";
  if (stateCategory) {
    activeCatName = SLUG_TO_NAME[stateCategory] || "Todos";
  }

  // SEO Configurations
  const seoConfigs: Record<string, { title: string; description: string; h1?: string }> = {
    '/como-vender-fotos-de-pe': {
      title: 'Como Vender Fotos de Pés | Guia Completo PackZinhu',
      description: 'Aprenda como vender fotos de pés e ganhar dinheiro online. O guia definitivo para monetizar seu conteúdo no PackZinhu.',
      h1: 'Como vender fotos de pés'
    },
    '/como-ganhar-dinheiro-com-fotos-online': {
      title: 'Como Ganhar Dinheiro com Fotos Online | PackZinhu',
      description: 'Estratégias reais para ganhar dinheiro online vendendo fotos e conteúdo exclusivo. Comece agora no PackZinhu.',
      h1: 'Quanto dá pra ganhar vendendo fotos online'
    }
  };

  const currentSEO = seoConfigs[path] || {
    title: 'PackZinhu - Explore e venda conteúdos exclusivos',
    description: 'Bem-vindo ao PackZinhu, a plataforma líder para vender fotos de pés, sexting e conteúdo exclusivo com segurança.',
    h1: ''
  };

  return (
    <CategoryLayout activeCategory={activeCatName}>
      <JsonLd 
        type="BreadcrumbList"
        data={{
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Início',
              item: 'https://packzinhu.online'
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: activeCatName,
              item: `https://packzinhu.online${path}`
            }
          ]
        }}
      />
      <JsonLd 
        type="SpecialAnnouncement" 
        data={{
          name: 'Promoção de Novos Criadores PackZinhu',
          description: 'Cadastre-se hoje e comece a vender suas fotos com taxa reduzida nos primeiros 30 dias.',
          announcementLocation: {
            '@type': 'WebSite',
            url: 'https://packzinhu.online'
          },
          datePosted: '2026-05-01'
        }} 
      />
      <Helmet>
        <title>{currentSEO.title}</title>
        <meta name="description" content={currentSEO.description} />
        <meta name="keywords" content="como vender fotos de pés, ganhar dinheiro online, Packzinho, Packzin, vender packs, alternativa OnlyFans, alternativa Privacy" />
        <link rel="canonical" href={`https://packzinhu.online${path}`} />
        <meta property="og:title" content={currentSEO.title} />
        <meta property="og:description" content={currentSEO.description} />
        <meta property="og:image" content="https://packzinhu.online/banner-principal.jpeg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={currentSEO.title} />
        <meta name="twitter:description" content={currentSEO.description} />
        <meta name="twitter:image" content="https://packzinhu.online/banner-principal.jpeg" />
        {path === '/' && (
          <>
            <link rel="alternate" hrefLang="pt-br" href="https://packzinhu.online/" />
            <link rel="alternate" hrefLang="en" href="https://packzinhu.online/en/" />
            <link rel="alternate" hrefLang="ja" href="https://packzinhu.online/ja/" />
            <link rel="alternate" hrefLang="ar" href="https://packzinhu.online/ar/" />
          </>
        )}
      </Helmet>

      {/* Visually hidden but SEO relevant headers */}
      <div className="sr-only">
        {currentSEO.h1 && <h1>{currentSEO.h1}</h1>}
        <h2>Como vender fotos de pés no PackZinhu</h2>
        <p>Descubra como ganhar dinheiro online vendendo fotos de pés e conteúdo exclusivo. O PackZinhu é a melhor plataforma para quem busca uma alternativa segura ao OnlyFans e Privacy no Brasil.</p>
        <h2>Melhores plataformas para vender packs e fotos online</h2>
        <p>Se você procura os melhores sites para vender fotos de pés, o PackZinhu oferece a melhor taxa e pagamento via PIX imediato.</p>
        <h2>Alternativas para OnlyFans e Privacy e Packzin</h2>
        <h2>Quanto dá pra ganhar vendendo fotos no PackZinhu</h2>
        <h2>Vale a pena vender fotos de pés? Sim, aprenda como começar.</h2>
        <nav>
          <ul>
            <li><a href="/como-vender-fotos-de-pe">Guia Completo de Como Vender Fotos</a></li>
            <li><a href="/melhores-sites-para-vender-fotos">Lista dos Melhores Sites</a></li>
            <li><a href="/blog">Nossas últimas dicas no Blog</a></li>
          </ul>
        </nav>
      </div>

      <FeedView initialCategory={activeCatName} />
    </CategoryLayout>
  );
}
