import { useNavigate } from 'react-router-dom';
import CategoryLayout from '../components/CategoryLayout';
import MobileBannerAd from '../components/MobileBannerAd';
import HorizontalBannerAd from '../components/HorizontalBannerAd';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useMemo } from 'react';

const CATEGORY_CARDS_DATA = [
  {
    title: 'Sexting',
    slug: 'sexting',
    images: [
      'https://cdn.packzinhu.online/packzinhu-db/images/sexting.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/sexting2.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/sexting3.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/sexting4.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/sexting5.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/sexting6.jpeg',
    ],
  },
  {
    title: 'Avaliação',
    slug: 'avaliacao',
    images: [
      'https://cdn.packzinhu.online/packzinhu-db/images/avalia%C3%A7%C3%A3o.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/avalia%C3%A7%C3%A3o2.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/avalia%C3%A7%C3%A3o3.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/avalia%C3%A7%C3%A3o4.jpeg',
    ],
  },
  {
    title: 'Chamada de Video',
    slug: 'chamada-video',
    images: [
      'https://cdn.packzinhu.online/packzinhu-db/images/chamada%20de%20video.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/chamada%20de%20video2.jpeg',
    ],
  },
  {
    title: 'Pack do Pé',
    slug: 'pack-pe',
    images: [
      'https://cdn.packzinhu.online/packzinhu-db/images/pack%20do%20p%C3%A9.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/pack%20do%20p%C3%A92.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/pack%20do%20p%C3%A93.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/pack%20do%20p%C3%A94.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/pack%20do%20p%C3%A95.jpeg',
    ],
  },
  {
    title: 'Pack Explicito',
    slug: 'pack-explicito',
    images: [
      'https://cdn.packzinhu.online/packzinhu-db/images/pack%20de%20fotos%20e%20videos.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/pack%20de%20fotos%20e%20videos2.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/pack%20de%20fotos%20e%20videos3.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/pack%20de%20fotos%20e%20videos4.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/pack%20de%20fotos%20e%20videos5.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/pack%20de%20fotos%20e%20videos6.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/pack%20de%20fotos%20e%20videos7.jpeg',
    ],
  },
  {
    title: 'Pack Sensual',
    slug: 'pack-sensual',
    images: [
      'https://cdn.packzinhu.online/packzinhu-db/images/pack%20de%20fotos%20e%20videos.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/pack%20de%20fotos%20e%20videos2.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/pack%20de%20fotos%20e%20videos3.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/pack%20de%20fotos%20e%20videos4.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/pack%20de%20fotos%20e%20videos5.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/pack%20de%20fotos%20e%20videos6.jpeg',
      'https://cdn.packzinhu.online/packzinhu-db/images/pack%20de%20fotos%20e%20videos7.jpeg',
    ],
  }
];

export default function Landing() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  
  // Randomize images once per mount
  const categories = useMemo(() => {
    return CATEGORY_CARDS_DATA.map(cat => ({
      ...cat,
      image: cat.images[Math.floor(Math.random() * cat.images.length)]
    }));
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <CategoryLayout activeCategory="Todos">
      <Helmet>
        <title>PackZinhu - Destaques e Categorias</title>
        <meta name="description" content="Explore as nossas categorias exclusivas." />
        {categories.map((cat, idx) => (
          <link key={idx} rel="preload" as="image" href={cat.image} />
        ))}
      </Helmet>

      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        
        {/* Horizontal Banner Ad (728x90) - Only shown on PC */}
        {!isMobile && <HorizontalBannerAd />}

        <div className="text-center mb-10 mt-8">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4">Escolha a sua categoria e aproveite!</h1>
          <p className="text-gray-400 text-lg">Selecione uma das opções abaixo para ver os melhores conteúdos de nossos criadores.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {categories.map((cat, idx) => (
            <div 
              key={idx} 
              onClick={() => navigate(`/category/${cat.slug}`)}
              className="group cursor-pointer relative rounded-2xl overflow-hidden aspect-[4/5] transition-transform duration-300 hover:scale-105"
            >
              <img 
                src={cat.image} 
                alt={cat.title} 
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 bg-gray-900"
              />
              <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6">
                <h3 className="text-white font-bold text-lg md:text-2xl [text-shadow:_0_2px_4px_rgb(0_0_0_/_80%)]">{cat.title}</h3>
                <span className="text-purple-400 text-xs md:text-sm font-semibold mt-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 [text-shadow:_0_1px_2px_rgb(0_0_0_/_80%)]">Explorar &rarr;</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 mb-8">
            <MobileBannerAd />
        </div>

      </div>
    </CategoryLayout>
  );
}
