import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import CategoryLayout from '../components/CategoryLayout';
import FeedView from '../components/FeedView';
import HorizontalBannerAd from '../components/HorizontalBannerAd';
import MobileBannerAd from '../components/MobileBannerAd';
import JsonLd from '../components/JsonLd';
import { TrendingUp, DollarSign, Star, Briefcase, Zap, CheckCircle2, Award, Camera } from 'lucide-react';

export default function SEOArticleBestSites() {
  return (
    <CategoryLayout activeCategory="Todos">
      <JsonLd 
        type="Article"
        data={{
          headline: 'Sites que Pagam por Fotos: Como Ganhar Dinheiro Online em 2026',
          description: 'Descubra os melhores sites que pagam por fotos e aprenda como transformar imagens em renda online de forma simples e segura.',
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
      <Helmet>
        <title>Sites que Pagam por Fotos: Como Ganhar Dinheiro Online em 2026</title>
        <meta name="description" content="Descubra os melhores sites que pagam por fotos e aprenda como transformar imagens em renda online de forma simples e segura. Guia completo atualizado." />
        <meta name="keywords" content="sites que pagam por fotos, ganhar dinheiro online, vender fotos, PackZinhu, sites tipo OnlyFans" />
        <link rel="canonical" href="https://packzinhu.online/melhores-sites-para-vender-fotos" />
        <meta property="og:title" content="Sites que Pagam por Fotos: Como Ganhar Dinheiro Online em 2026" />
        <meta property="og:description" content="Descubra os melhores sites que pagam por fotos e aprenda como transformar imagens em renda online de forma simples e segura." />
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
          {/* Header Section */}
          <div className="text-center mb-16">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-black uppercase tracking-[0.2em] mb-6">
                <Star className="w-3 h-3" />
                Guia Premium 2026
             </div>
             <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter leading-tight mb-8">
                Sites que pagam por fotos: <br/>
                <span className="text-purple-500">ganhe dinheiro online em 2026</span>
             </h1>
             <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto italic">
                Ganhar dinheiro na internet nunca foi tão acessível — e uma das formas que mais cresce é através de sites que pagam por fotos. Descubra como transformar seu celular em uma fonte de renda.
             </p>
          </div>

          <div className="flex justify-center mb-12">
            <div className="hidden lg:block w-full">
              <HorizontalBannerAd />
            </div>
            <div className="lg:hidden">
              <MobileBannerAd />
            </div>
          </div>

          <div className="space-y-16">
            <section>
              <h2 className="text-3xl font-black text-white flex items-center gap-4 mb-6 italic uppercase tracking-tight">
                <Camera className="text-purple-500" />
                Sites que pagam por fotos: como funciona?
              </h2>
              <p className="text-gray-400 leading-7 text-lg mb-6">
                Hoje, qualquer pessoa com um celular pode começar a vender imagens online, seja de forma profissional ou em nichos específicos. O segredo está em escolher as plataformas certas e entender como atrair compradores.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                   <div className="text-purple-500 font-black text-xs uppercase mb-2">Modelo 01</div>
                   <h3 className="text-white font-black uppercase tracking-tight mb-2 italic">Venda Direta</h3>
                   <p className="text-gray-500 text-xs leading-relaxed">Você define o preço de cada foto ou pack individualmente. Ideal para conteúdos premium exclusivos.</p>
                </div>
                <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                   <div className="text-purple-500 font-black text-xs uppercase mb-2">Modelo 02</div>
                   <h3 className="text-white font-black uppercase tracking-tight mb-2 italic">Assinatura</h3>
                   <p className="text-gray-500 text-xs leading-relaxed">Clientes pagam um valor mensal fixo para ter acesso ao seu feed completo de fotos e vídeos.</p>
                </div>
                <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                   <div className="text-purple-500 font-black text-xs uppercase mb-2">Modelo 03</div>
                   <h3 className="text-white font-black uppercase tracking-tight mb-2 italic">Sob Demanda</h3>
                   <p className="text-gray-500 text-xs leading-relaxed">Pedidos personalizados onde o cliente solicita poses ou temas específicos por valores maiores.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-black text-white flex items-center gap-4 mb-6 italic uppercase tracking-tight">
                <Award className="text-purple-500" />
                Melhores sites que pagam por fotos
              </h2>
              
              <div className="space-y-6">
                {/* OnlyFans */}
                <div className="p-8 bg-[#131524] rounded-3xl border border-white/5 group hover:border-blue-500/30 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">OnlyFans</h3>
                    <div className="px-3 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-black rounded-full uppercase">Global</div>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">A plataforma mais conhecida mundialmente. Funciona com assinaturas mensais e venda de conteúdo extra via mensagens diretas.</p>
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-blue-500" /> Alta Demanda</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-blue-500" /> Renda Recorrente</span>
                  </div>
                </div>

                {/* Privacy */}
                <div className="p-8 bg-[#131524] rounded-3xl border border-white/5 group hover:border-red-500/30 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Privacy</h3>
                    <div className="px-3 py-1 bg-red-500/20 text-red-400 text-[10px] font-black rounded-full uppercase">Brasil</div>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">Muito popular no Brasil, com foco total no público nacional e facilidade de saque via bancos locais.</p>
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-red-500" /> Saque Fácil</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-red-500" /> Público Nacional</span>
                  </div>
                </div>

                {/* PackZinhu */}
                <div className="p-10 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-[2.5rem] border border-purple-500/30 relative overflow-hidden group">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full group-hover:bg-purple-500/20 transition-all" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">PackZinhu</h3>
                      <div className="px-4 py-1.5 bg-purple-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-purple-500/20">Recomendado</div>
                    </div>
                    <p className="text-gray-300 text-base mb-8 leading-relaxed max-w-lg">O PackZinhu oferece <strong>controle total dos ganhos</strong>, sem depender de regras burocráticas de terceiros, com as maiores margens de lucro do mercado brasileiro.</p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                      <li className="flex items-center gap-2 text-xs font-bold text-white"><CheckCircle2 className="w-4 h-4 text-purple-400" /> PIX Instantâneo</li>
                      <li className="flex items-center gap-2 text-xs font-bold text-white"><CheckCircle2 className="w-4 h-4 text-purple-400" /> Taxas de 5 a 10%</li>
                      <li className="flex items-center gap-2 text-xs font-bold text-white"><CheckCircle2 className="w-4 h-4 text-purple-400" /> Anonimato Total</li>
                      <li className="flex items-center gap-2 text-xs font-bold text-white"><CheckCircle2 className="w-4 h-4 text-purple-400" /> Suporte VIP</li>
                    </ul>
                    <button 
                      onClick={() => window.location.href = '/register'}
                      className="px-8 py-4 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-full hover:scale-105 transition-all"
                    >
                      Começar Agora no PackZinhu
                    </button>
                  </div>
                </div>

                {/* Other specialized sites */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-8 bg-white/5 border border-white/5 rounded-3xl">
                      <h3 className="text-xl font-black text-white mb-2 italic">FeetFinder</h3>
                      <p className="text-gray-500 text-xs">Especializado em fotos de pés. Menos concorrência geral e compradores altamente qualificados.</p>
                   </div>
                   <div className="p-8 bg-white/5 border border-white/5 rounded-3xl">
                      <h3 className="text-xl font-black text-white mb-2 italic">Foap</h3>
                      <p className="text-gray-500 text-xs">Voltado para fotos comerciais. Ideal para quem quer vender lifestyle e fotos gerais para empresas.</p>
                   </div>
                </div>
              </div>
            </section>

            <div className="flex justify-center my-12">
               <HorizontalBannerAd />
            </div>

            <section>
              <h2 className="text-3xl font-black text-white flex items-center gap-4 mb-6 italic uppercase tracking-tight">
                <DollarSign className="text-purple-500" />
                Quanto dá pra ganhar vendendo fotos?
              </h2>
              <p className="text-gray-400 leading-7 text-lg mb-8">
                Tudo depende da sua frequência de postagem, qualidade técnica e principalmente da sua estratégia de divulgação nas redes sociais.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 bg-[#0a0a0a] rounded-3xl border border-white/5 flex flex-col items-center text-center">
                   <div className="text-gray-500 text-[10px] font-black uppercase mb-4 tracking-widest">Iniciante</div>
                   <div className="text-2xl font-black text-white mb-1 italic">R$ 100 - R$ 1k</div>
                   <div className="text-[10px] text-gray-600 font-bold uppercase">Por Mês</div>
                </div>
                <div className="p-8 bg-[#0a0a0a] rounded-3xl border border-purple-500/20 flex flex-col items-center text-center scale-105 shadow-xl shadow-purple-500/5">
                   <div className="text-purple-500 text-[10px] font-black uppercase mb-4 tracking-widest">Intermediário</div>
                   <div className="text-2xl font-black text-white mb-1 italic">R$ 1k - R$ 5k</div>
                   <div className="text-[10px] text-purple-500/50 font-bold uppercase">Por Mês</div>
                </div>
                <div className="p-8 bg-[#0a0a0a] rounded-3xl border border-white/5 flex flex-col items-center text-center">
                   <div className="text-gray-500 text-[10px] font-black uppercase mb-4 tracking-widest">Avançado</div>
                   <div className="text-2xl font-black text-white mb-1 italic">R$ 5k+</div>
                   <div className="text-[10px] text-gray-600 font-bold uppercase">Por Mês</div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-black text-white flex items-center gap-4 mb-6 italic uppercase tracking-tight">
                <Zap className="text-purple-500" />
                🚀 Dicas para ganhar mais dinheiro
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { t: '1. Escolha um nicho', d: 'Quanto mais específico (artístico, lifestyle, pés), mais fácil fidelizar compradores.' },
                  { t: '2. Poste com frequência', d: 'Consistência gera visibilidade. Tente postar pelo menos 3 vezes por semana.' },
                  { t: '3. Redes Sociais', d: 'Use o Instagram e TikTok para atrair tráfego gratuito para sua vitrine.' },
                  { t: '4. Conexão Real', d: 'Responder mensagens e criar proximidade aumenta drásticamente sua conversão.' }
                ].map((tip, i) => (
                  <div key={i} className="flex gap-4 p-6 bg-white/5 rounded-3xl border border-white/5 group hover:bg-white/10 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0 text-purple-500 font-black">
                      {i+1}
                    </div>
                    <div>
                      <h4 className="text-white font-black uppercase text-sm mb-1 italic tracking-tight">{tip.t}</h4>
                      <p className="text-gray-500 text-xs leading-relaxed">{tip.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-20 p-12 bg-[#131524] rounded-[3rem] border border-white/5 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
             <TrendingUp className="w-12 h-12 text-purple-500 mx-auto mb-6" />
             <h2 className="text-3xl md:text-5xl font-black text-white mb-6 italic tracking-tighter uppercase">
               Pronta para monetizar seu conteúdo?
             </h2>
             <p className="text-gray-400 mb-10 max-w-lg mx-auto italic">
               Entre para a comunidade PackZinhu e descubra por que somos a plataforma que mais gera lucro real para criadoras brasileiras.
             </p>
             <button 
               onClick={() => window.location.href = '/register'}
               className="px-12 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black uppercase italic tracking-[0.2em] rounded-full hover:scale-105 transition-all shadow-[0_0_40px_rgba(147,51,234,0.3)]"
             >
               Criar Meu Perfil Grátis
             </button>
             <p className="mt-6 text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">Cadastro rápido em menos de 1 minuto</p>
          </div>
        </motion.article>
      </div>

      <div className="border-t border-white/5 pt-20">
        <div className="max-w-7xl mx-auto px-4">
           <div className="flex flex-col items-center mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-widest mb-4">Veja quem já está vendendo</h2>
              <p className="text-gray-500 uppercase text-[10px] font-black tracking-[0.5em]">Explore as Criadoras PackZinhu</p>
           </div>
           <FeedView initialCategory="Todos" />
        </div>
      </div>
    </CategoryLayout>
  );
}
