import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import CategoryLayout from '../components/CategoryLayout';
import FeedView from '../components/FeedView';
import HorizontalBannerAd from '../components/HorizontalBannerAd';
import MobileBannerAd from '../components/MobileBannerAd';
import JsonLd from '../components/JsonLd';
import { CheckCircle2, Zap, ShieldCheck, DollarSign, Camera, Layout as LayoutIcon, Lock } from 'lucide-react';

export default function SEOArticleVenderFotos() {
  return (
    <CategoryLayout activeCategory="Todos">
      <JsonLd 
        type="Article"
        data={{
          headline: 'Como Vender Fotos de Pés em 2026 | Guia Completo PackZinhu',
          description: 'Aprenda passo a passo como vender fotos de pés e ganhar dinheiro online com segurança.',
          image: 'https://packzinhu.online/banner-principal.jpeg',
          author: {
            '@type': 'Organization',
            name: 'PackZinhu'
          },
          publisher: {
            '@type': 'Organization',
            name: 'PackZinhu',
            logo: {
              '@type': 'ImageObject',
              url: 'https://packzinhu.online/favicon.png'
            }
          },
          datePublished: '2026-05-01'
        }}
      />
      <JsonLd 
        type="HowTo"
        data={{
          name: 'Como vender fotos de pés online',
          description: 'Aprenda como começar a vender fotos de pés no PackZinhu.',
          step: [
            {
              '@type': 'HowToStep',
              name: 'Criar Perfil',
              text: 'Cadastre-se gratuitamente no PackZinhu.'
            },
            {
              '@type': 'HowToStep',
              name: 'Preparar Conteúdo',
              text: 'Tire fotos de alta qualidade com boa iluminação.'
            },
            {
              '@type': 'HowToStep',
              name: 'Definir Preço',
              text: 'Escolha o valor do seu pack ou assinatura.'
            },
            {
              '@type': 'HowToStep',
              name: 'Divulgar',
              text: 'Compartilhe seu link nas redes sociais.'
            }
          ]
        }}
      />
      <Helmet>
        <title>Como Vender Fotos de Pés em 2026 | Guia Completo PackZinhu</title>
        <meta name="description" content="Aprenda passo a passo como vender fotos de pés e ganhar dinheiro online com segurança. O guia definitivo para monetizar seu conteúdo e gerenciar seu perfil." />
        <meta name="keywords" content="como vender fotos de pés, guia vender packs, ganhar dinheiro com fotos online, PackZinhu, vender packs anonimamente" />
        <link rel="canonical" href="https://packzinhu.online/como-vender-fotos-de-pe" />
        <meta property="og:title" content="Como Vender Fotos de Pés em 2026 | Guia Completo PackZinhu" />
        <meta property="og:description" content="Aprenda passo a passo como vender fotos de pés e ganhar dinheiro online com segurança." />
        <meta property="og:image" content="https://packzinhu.online/banner-principal.jpeg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://packzinhu.online/banner-principal.jpeg" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 pt-12 pb-20">
        <motion.article 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-invert prose-purple max-w-none"
        >
          {/* Header */}
          <div className="text-center mb-16">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-black uppercase tracking-[0.2em] mb-6">
                <DollarSign className="w-3 h-3" />
                Guia de Monetização 2026
             </div>
             <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter leading-none mb-8">
                Como vender fotos de pés em 2026 <br/>
                <span className="text-purple-500">(Guia completo para iniciantes)</span>
             </h1>
             <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto italic">
                Ganhar dinheiro vendendo fotos de pés se tornou uma das formas mais acessíveis de renda online. Com as estratégias certas, qualquer pessoa pode começar do zero e construir um império digital.
             </p>
          </div>

          <HorizontalBannerAd />
          <div className="lg:hidden flex justify-center mb-12">
            <MobileBannerAd />
          </div>

          <div className="mt-16 space-y-16">
            <section>
              <h2 className="text-3xl font-black text-white flex items-center gap-4 mb-6 italic uppercase tracking-tight">
                <Camera className="text-purple-500" />
                O que você precisa para começar
              </h2>
              <p className="text-gray-400 leading-7 text-lg mb-6">
                Diferente do que muitos pensam, você não precisa de uma câmera profissional de última geração. Os celulares modernos possuem lentes potentes o suficiente para criar conteúdo de alta qualidade que vende.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                   { t: 'Iluminação', d: 'Prefira sempre a luz do dia perto de janelas. Evite flash direto.' },
                   { t: 'Cenário Clean', d: 'Mantenha o ambiente organizado. Use tapetes, lençóis limpos ou fundos neutros.' },
                   { t: 'Higiene e Estética', d: 'Pés bem cuidados, unhas feitas e hidratação são essenciais para o valor do pack.' },
                   { t: 'Consistência', d: 'Defina um cronograma. Quem não é visto, não é lembrado.' }
                ].map((item, i) => (
                  <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                    <h3 className="text-white font-black uppercase tracking-wider mb-2">{item.t}</h3>
                    <p className="text-gray-500 text-sm">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-black text-white flex items-center gap-4 mb-6 italic uppercase tracking-tight">
                <LayoutIcon className="text-purple-500" />
                Onde vender fotos e ganhar dinheiro online
              </h2>
              <p className="text-gray-400 leading-7 text-lg mb-6">
                Existem dezenas de plataformas, mas a escolha do site certo define quanto você realmente coloca no bolso no final do mês.
              </p>
              <div className="space-y-4">
                <div className="p-8 bg-purple-500/5 border border-purple-500/10 rounded-[2.5rem]">
                   <h3 className="text-xl font-black text-white mb-2 italic">PackZinhu (A Melhor Opção)</h3>
                   <p className="text-gray-400 text-sm mb-4">Alternativa poderosa ao Privacy e OnlyFans focada no público brasileiro. No PackZinhu, você recebe via PIX imediato, conta com taxas reduzidas e uma interface moderna estilo YouTube.</p>
                   <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                     <li className="flex items-center gap-2 text-[10px] text-green-500 font-black uppercase"><CheckCircle2 className="w-3 h-3" /> Recebimento Instantâneo</li>
                     <li className="flex items-center gap-2 text-[10px] text-green-500 font-black uppercase"><CheckCircle2 className="w-3 h-3" /> Zero Taxas de Saque</li>
                     <li className="flex items-center gap-2 text-[10px] text-green-500 font-black uppercase"><CheckCircle2 className="w-3 h-3" /> Proteção Total Antifraude</li>
                     <li className="flex items-center gap-2 text-[10px] text-green-500 font-black uppercase"><CheckCircle2 className="w-3 h-3" /> Privacidade Garantida</li>
                   </ul>
                </div>
                <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] opacity-60">
                   <h3 className="text-xl font-black text-gray-300 mb-2 italic">OnlyFans & Privacy</h3>
                   <p className="text-gray-500 text-sm">Plataformas tradicionais, porém com taxas elevadas (chegando a 20%) e processos de aprovação burocráticos para brasileiros.</p>
                </div>
              </div>
            </section>

            <HorizontalBannerAd />
            <div className="lg:hidden flex justify-center mb-12">
              <MobileBannerAd />
            </div>

            <section>
              <h2 className="text-3xl font-black text-white flex items-center gap-4 mb-6 italic uppercase tracking-tight">
                <Zap className="text-purple-500" />
                Quanto dá pra ganhar vendendo fotos de pés?
              </h2>
              <p className="text-gray-400 leading-7 text-lg mb-8">
                O céu é o limite. O mercado de fetiche por pés é um dos nichos mais lucrativos do mundo. Iniciantes costumam faturar entre <strong>R$ 500 a R$ 2.000</strong> nos primeiros meses. Criadoras estabelecidas com audiência fiel podem ultrapassar os <strong>R$ 10.000 mensais</strong>.
              </p>
              <div className="bg-[#131524] p-10 rounded-[3rem] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-6xl opacity-10 font-black italic">$$$</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="text-3xl font-black text-white italic mb-1">R$ 50</div>
                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Foto Avulsa</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-purple-500 italic mb-1">R$ 150+</div>
                    <div className="text-[10px] text-purple-500/50 uppercase font-black tracking-widest">Pack de Vídeos</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white italic mb-1">R$ 500</div>
                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Assinatura VIP</div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-black text-white flex items-center gap-4 mb-6 italic uppercase tracking-tight">
                <ShieldCheck className="text-purple-500" />
                Dicas para iniciantes (Vale a pena?)
              </h2>
              <div className="space-y-6">
                <p className="text-gray-400 leading-7 text-lg">
                  Sim, vale muito a pena! Mas para ter sucesso sem dor de cabeça, siga estas regras de ouro:
                </p>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4 p-6 bg-white/5 rounded-3xl border border-white/5">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="text-white font-black uppercase text-sm mb-1">Proteja sua Identidade</h4>
                      <p className="text-gray-500 text-xs leading-relaxed">Se deseja anonimato, nunca mostre o rosto ou tatuagens identificadoras. Use filtros e ângulos estratégicos.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-6 bg-white/5 rounded-3xl border border-white/5">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="text-white font-black uppercase text-sm mb-1">Divulgação é Tudo</h4>
                      <p className="text-gray-500 text-xs leading-relaxed">Use o Twitter (X), Telegram e TikTok para atrair tráfego para seu perfil no PackZinhu.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-20 p-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[2.5rem]">
             <div className="bg-black/90 p-12 text-center rounded-[2.4rem] backdrop-blur-xl">
                <h2 className="text-3xl md:text-5xl font-black text-white mb-4 italic uppercase tracking-tighter">
                   Pronta para começar?
                </h2>
                <p className="text-gray-400 mb-8 max-w-lg mx-auto italic">
                   Crie seu perfil agora no PackZinhu e comece a vender suas fotos para milhares de compradores reais.
                </p>
                <button 
                  onClick={() => window.location.href = '/register'}
                  className="px-10 py-5 bg-white text-black font-black uppercase italic tracking-widest rounded-full hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                   Criar Minha Vitrine Grátis
                </button>
             </div>
          </div>
        </motion.article>
      </div>

      {/* Standard Feed View below the article to keep the Home behavior */}
      <div className="border-t border-white/5 pt-20">
        <div className="max-w-7xl mx-auto px-4">
           <div className="flex flex-col items-center mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-widest mb-4">Explore a Vitrine</h2>
              <p className="text-gray-500 uppercase text-[10px] font-black tracking-[0.5em]">Serviços em Destaque no PackZinhu</p>
           </div>
           <FeedView initialCategory="Todos" />
        </div>
      </div>
    </CategoryLayout>
  );
}
