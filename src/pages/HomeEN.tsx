import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, ShieldCheck, Zap, Lock, Globe } from 'lucide-react';
import FeedView from '../components/FeedView';

export default function HomeEN() {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Helmet>
        <title>Best OnlyFans Alternative | Sell Your Content Online | PackZinhu</title>
        <meta name="description" content="Discover the best OnlyFans alternative. PackZinhu offers lower fees, instant payouts, and full privacy for content creators." />
        <link rel="canonical" href="https://packzinhu.online/en/" />
        <meta property="og:title" content="Best OnlyFans Alternative | Sell Your Content Online | PackZinhu" />
        <meta property="og:description" content="Discover the best OnlyFans alternative. PackZinhu offers lower fees, instant payouts, and full privacy for content creators." />
        <meta property="og:image" content="https://packzinhu.online/alternativa4.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Best OnlyFans Alternative | Sell Your Content Online | PackZinhu" />
        <meta name="twitter:description" content="Discover the best OnlyFans alternative. PackZinhu offers lower fees, instant payouts, and full privacy for content creators." />
        <meta name="twitter:image" content="https://packzinhu.online/alternativa4.png" />
        <link rel="alternate" hrefLang="pt-br" href="https://packzinhu.online/" />
        <link rel="alternate" hrefLang="en" href="https://packzinhu.online/en/" />
        <link rel="alternate" hrefLang="ja" href="https://packzinhu.online/ja/" />
        <link rel="alternate" hrefLang="ar" href="https://packzinhu.online/ar/" />
      </Helmet>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-black uppercase tracking-[0.2em] mb-6">
              <Globe className="w-4 h-4" />
              Global Creator Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter leading-tight mb-8">
              The Best OnlyFans Alternative <br/>
              <span className="text-purple-500">to Sell Your Content</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto italic mb-10">
              Why settle for 20% fees? PackZinhu empowers digital creators to sell photos, videos, and subscriptions with higher profits and total security.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={() => window.location.href = '/register'}
                className="px-8 py-4 bg-purple-600 text-white font-black uppercase tracking-widest rounded-full hover:bg-purple-500 transition-all shadow-[0_0_30px_rgba(147,51,234,0.3)] flex items-center gap-2"
              >
                Start Earning Now <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#131524] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
              Why creators are switching to PackZinhu
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                icon: Zap, 
                title: 'Fast payouts', 
                desc: 'Get your money quickly without waiting weeks. We process payments securely and fast.',
                color: 'text-yellow-400',
                bg: 'bg-yellow-400/10'
              },
              { 
                icon: ShieldCheck, 
                title: 'No hidden fees', 
                desc: 'Keep up to 95% of your earnings. Stop losing money to massive platform cuts.',
                color: 'text-green-400',
                bg: 'bg-green-400/10'
              },
              { 
                icon: Lock, 
                title: 'Full privacy', 
                desc: 'Advanced protection against leaks and strict DRM. You control who sees your content.',
                color: 'text-purple-400',
                bg: 'bg-purple-400/10'
              },
              { 
                icon: Globe, 
                title: 'More freedom', 
                desc: 'Sell direct photos, subscriptions, or complete content packs all in one place.',
                color: 'text-blue-400',
                bg: 'bg-blue-400/10'
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-black/40 p-8 rounded-[2rem] border border-white/5"
              >
                <div className={`w-12 h-12 rounded-2xl ${feature.bg} flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-3">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-12">
            Keep more of what you earn
          </h2>
          
          <div className="bg-[#131524] rounded-[3rem] p-8 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="p-6 bg-white/5 rounded-3xl opacity-50 border border-white/5 text-left">
                <div className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">OnlyFans & Others</div>
                <div className="text-4xl font-black text-white opacity-50 italic mb-2">80%</div>
                <div className="text-sm text-gray-500">Creator Earnings</div>
                <div className="mt-4 text-xs text-red-400 font-bold">20% Platform Fee</div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-3xl border border-purple-500/30 text-left scale-105 shadow-xl shadow-purple-500/10">
                <div className="text-purple-400 text-xs font-black uppercase tracking-widest mb-2">PackZinhu</div>
                <div className="text-5xl font-black text-white italic mb-2 line-clamp-1">Up to 95%</div>
                <div className="text-sm text-gray-300">Creator Earnings</div>
                <div className="mt-4 text-xs text-green-400 font-bold uppercase tracking-widest">+ Instant Payouts</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Section */}
      <section className="py-16 pt-0 border-t border-white/5 mt-16 max-w-7xl mx-auto">
        <div className="pt-20 px-4">
           <div className="flex flex-col items-center mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-widest mb-4">Explore Our Creators</h2>
              <p className="text-gray-500 uppercase text-[10px] font-black tracking-[0.5em]">Global Content Marketplace</p>
           </div>
           {/* Fallback to FeedView, but maybe wrap it to show that the feed works generally well */}
           <FeedView initialCategory="Todos" />
        </div>
      </section>
    </div>
  );
}
