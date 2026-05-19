import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import CategoryLayout from '../components/CategoryLayout';
import HorizontalBannerAd from '../components/HorizontalBannerAd';
import MobileBannerAd from '../components/MobileBannerAd';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, Tag } from 'lucide-react';

const articles = [
  {
    title: 'Como vender fotos de pé e ganhar dinheiro online',
    description: 'Guia completo de como vender fotos de pé na internet. Aprenda sobre plataformas como OnlyFans e Privacy e como usar o Packzinhu para lucrar mais.',
    url: '/como-vender-fotos-de-pe',
    date: '01 Mai 2026',
    category: 'Guias Iniciais',
    image: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=800&q=80',
  },
  {
    title: 'OnlyFans vs Privacy vs Packzinhu: Qual o Melhor?',
    description: 'Comparativo definitivo entre OnlyFans, Privacy e Packzinhu. Analisamos taxas, facilidade de uso, pagamento via Pix e anonimato.',
    url: '/onlyfans-vs-privacy-vs-packzinhu',
    date: '02 Mai 2026',
    category: 'Comparativos',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
  },
  {
    title: 'Melhores sites para vender fotos',
    description: 'Descubra os melhores sites para vender fotos de pés no Brasil e no mundo. Análise completa das plataformas mais rentáveis do mercado atual.',
    url: '/melhores-sites-para-vender-fotos',
    date: '03 Mai 2026',
    category: 'Plataformas',
    image: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=800&q=80',
  },
  {
    title: 'Qual site paga por fotos de pés?',
    description: 'Guia revelando os melhores sites para vender fotos de pés. Aprenda como funciona, quanto dá para ganhar e as melhores plataformas como PackZinhu e FeetFinder.',
    url: '/Qual-site-paga-por-fotos-de-pés',
    date: '04 Mai 2026',
    category: 'Monetização',
    image: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&q=80',
  },
  {
    title: 'Vender fotos dos pés dá dinheiro?',
    description: 'Guia completo revelando o potencial financeiro da venda de fotos de pés. Aprenda as estratégias de quem ganha alto nesse mercado e as melhores plataformas.',
    url: '/Vender-fotos-dos-pés-dá-dinheiro',
    date: '04 Mai 2026',
    category: 'Ganhos',
    image: 'https://images.unsplash.com/photo-1579621970588-a3f5ce599fac?w=800&q=80',
  },
  {
    title: 'Os sites mais conhecidos para vender fotos de pés',
    description: 'Conheça as principais plataformas do mercado de fotos de pés. Compare PackZinhu, FeetFinder, Instafeet e tome a melhor decisão para lucrar online.',
    url: '/os-sites-mais-conhecidos-para-vender-fotos-de-pés',
    date: '04 Mai 2026',
    category: 'Plataformas',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
  },
  {
    title: 'Os melhores sites para vender fotos dos pés: O Ranking Completo',
    description: 'Análise profunda das melhores plataformas (PackZinhu, FeetFinder, OnlyFans, etc.) para vender conteúdo, além de dicas de segurança e sucesso no nicho.',
    url: '/os-melhores-sites-para-vender-fotos-dos-pés-packzinhu-FeetFinder-Instafeet-Feetify-FeetPics-onlyfans-privacy',
    date: '04 Mai 2026',
    category: 'Ranking',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  },
  {
    title: 'PackZinhu é Confiável? Análise Completa',
    description: 'Tudo o que você precisa saber sobre a segurança do PackZinhu. Proteção contra chargeback, Pix instantâneo e garantia de anonimato para criadores de conteúdo.',
    url: '/packzinhu-é-confiável',
    date: '04 Mai 2026',
    category: 'Segurança',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80',
  },
  {
    title: 'Como ganhar dinheiro com fotos online',
    description: 'Aprenda os segredos e as melhores práticas para começar a faturar vendendo fotos online, alcançando clientes de forma anônima e segura.',
    url: '/como-ganhar-dinheiro-com-fotos-online',
    date: '04 Mai 2026',
    category: 'Monetização',
    image: 'https://images.unsplash.com/photo-1583752028088-91e3e9880b46?w=800&q=80',
  },
  {
    title: 'Sites parecidos com Privacy: Melhores Alternativas',
    description: 'Conheça plataformas similares à Privacy para venda de conteúdo (+18) e serviços de privacidade financeira. Descubra a alternativa ideal.',
    url: '/Sites-parecidos-com-Privacy',
    date: '04 Mai 2026',
    category: 'Plataformas',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  },
  {
    title: 'Sites parecidos com OnlyFans: As Melhores Alternativas em 2026',
    description: 'Descubra as melhores alternativas ao OnlyFans, como PackZinhu, Privacy, Fansly, e outras opções para ganhar dinheiro com conteúdo.',
    url: '/Sites-parecidos-com-OnlyFans',
    date: '04 Mai 2026',
    category: 'Plataformas',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
  },
  {
    title: 'Os melhores apps para vender foto do pé e lucrar muito!',
    description: 'Guia completo dos melhores aplicativos para transformar suas fotos de pés em uma fonte de renda segura e rentável em 2026.',
    url: '/Os-melhores-apps-para-vender-foto-do-pe-e-lucrar-muito',
    date: '05 Mai 2026',
    category: 'Aplicativos',
    image: 'https://images.unsplash.com/photo-1512428559083-a4979b2b51ff?w=800&q=80',
  }
];

export default function Blog() {
  return (
    <CategoryLayout activeCategory="Todos">
      <Helmet>
        <title>Blog PackZinhu | Dicas, Guias e Análises sobre Venda de Conteúdo</title>
        <meta name="description" content="Explore o blog do PackZinhu. Encontre dicas de como vender fotos de pés, análises de plataformas, guias de segurança e estratégias para monetizar seu conteúdo online." />
        <link rel="canonical" href="https://packzinhu.online/blog" />
        <meta property="og:title" content="Blog PackZinhu | Dicas, Guias e Análises" />
        <meta property="og:description" content="Estratégias, comparações de plataformas como OnlyFans e Privacy, dicas de anonimato e como faturar mais com venda de conteúdo." />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 pt-12 pb-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-black uppercase tracking-[0.2em] mb-6">
            <BookOpen className="w-3 h-3" />
            Conteúdo Exclusivo
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white italic tracking-tighter leading-none mb-6">
            Blog <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">PackZinhu</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto italic">
            Tudo o que você precisa saber para ter sucesso no mercado de venda de conteúdo. Guias práticos, comparativos de plataformas e dicas de segurança.
          </p>
        </div>

        {/* Ad Banners at the top */}
        <div className="mb-12">
           <div className="hidden md:block">
             <HorizontalBannerAd />
           </div>
           <div className="md:hidden flex justify-center">
             <MobileBannerAd />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Link 
                to={article.url}
                className="flex flex-col h-full bg-[#131524] rounded-3xl overflow-hidden border border-white/5 hover:border-purple-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]"
              >
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#131524] to-transparent z-10" />
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4 z-20">
                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-black text-purple-400 uppercase tracking-wider border border-white/10">
                      {article.category}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-3">
                    <Clock className="w-3 h-3" />
                    {article.date}
                  </div>
                  
                  <h2 className="text-xl font-black text-white italic mb-3 group-hover:text-purple-400 transition-colors line-clamp-2">
                    {article.title}
                  </h2>
                  
                  <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-grow line-clamp-3">
                    {article.description}
                  </p>

                  <div className="flex items-center text-purple-400 font-black text-sm uppercase tracking-widest mt-auto group-hover:gap-2 transition-all">
                    Ler Artigo <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Ad Banners at the bottom */}
        <div className="mt-16">
           <div className="hidden md:block">
             <HorizontalBannerAd />
           </div>
           <div className="md:hidden flex justify-center">
             <MobileBannerAd />
           </div>
        </div>

      </div>
    </CategoryLayout>
  );
}
