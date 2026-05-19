import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, ShieldCheck, Zap, Lock, Globe } from 'lucide-react';
import FeedView from '../components/FeedView';

export default function HomeJA() {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Helmet>
        <title>OnlyFansの最高の代替プラットフォーム | PackZinhu</title>
        <meta name="description" content="OnlyFansの代替となる最高のプラットフォームをご覧ください。PackZinhuでは、手数料が安く、即時支払いが可能で、クリエイターのプライバシーを完全に保護します。" />
        <link rel="canonical" href="https://packzinhu.online/ja/" />
        <meta property="og:title" content="OnlyFansの最高の代替プラットフォーム | PackZinhu" />
        <meta property="og:description" content="OnlyFansの代替となる最高のプラットフォームをご覧ください。PackZinhuでは、手数料が安く、即時支払いが可能で、クリエイターのプライバシーを完全に保護します。" />
        <meta property="og:image" content="https://packzinhu.online/alternativa4.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="OnlyFansの最高の代替プラットフォーム | PackZinhu" />
        <meta name="twitter:description" content="OnlyFansの代替となる最高のプラットフォームをご覧ください。PackZinhuでは、手数料が安く、即時支払いが可能で、クリエイターのプライバシーを完全に保護します。" />
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
              グローバル・クリエイター・プラットフォーム
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white italic tracking-tighter leading-tight mb-8 drop-shadow-lg">
              コンテンツ販売のための <br/>
              最高の<span className="text-purple-500">OnlyFans代替手段</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto italic mb-10 leading-relaxed">
              なぜ20%も手数料を払うのですか？PackZinhuは、より多くの利益と完全なセキュリティで、写真、ビデオ、サブスクリプションを販売できるようにデジタルクリエイターを支援します。
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={() => window.location.href = '/register'}
                className="px-10 py-5 bg-purple-600 text-white font-black uppercase tracking-widest rounded-full hover:bg-purple-500 transition-all shadow-[0_0_30px_rgba(147,51,234,0.3)] flex items-center gap-2"
              >
                今すぐ稼ぐ <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#131524] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter">
              クリエイターがPackZinhuに移行する理由
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                icon: Zap, 
                title: '迅速な支払い', 
                desc: '何週間も待つことなく、すぐに資金を受け取れます。安全かつ迅速に処理します。',
                color: 'text-yellow-400',
                bg: 'bg-yellow-400/10'
              },
              { 
                icon: ShieldCheck, 
                title: '隠し手数料なし', 
                desc: '収益の最大95%を維持できます。プラットフォームに多額の利益を奪われるのはやめましょう。',
                color: 'text-green-400',
                bg: 'bg-green-400/10'
              },
              { 
                icon: Lock, 
                title: '完全なプライバシー', 
                desc: '漏洩に対する高度な保護。誰があなたのコンテンツを見るかをあなたが管理します。',
                color: 'text-purple-400',
                bg: 'bg-purple-400/10'
              },
              { 
                icon: Globe, 
                title: '自由な販売', 
                desc: '写真の直接販売、サブスクリプション、パッケージ販売など、すべてを一箇所で提供します。',
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
                <h3 className="text-xl font-black text-white italic tracking-tight mb-3">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white italic tracking-tighter mb-12">
            もっと多くの利益を手元に
          </h2>
          
          <div className="bg-[#131524] rounded-[3rem] p-8 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="p-6 bg-white/5 rounded-3xl opacity-50 border border-white/5 text-left">
                <div className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">OnlyFans などの他社</div>
                <div className="text-4xl font-black text-white opacity-50 italic mb-2">80%</div>
                <div className="text-sm text-gray-500">クリエイターの収益</div>
                <div className="mt-4 text-xs text-red-400 font-bold">20% のプラットフォーム手数料</div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-3xl border border-purple-500/30 text-left scale-105 shadow-xl shadow-purple-500/10">
                <div className="text-purple-400 text-xs font-black uppercase tracking-widest mb-2">PackZinhu</div>
                <div className="text-5xl font-black text-white italic mb-2 line-clamp-1">最大 95%</div>
                <div className="text-sm text-gray-300">クリエイターの収益</div>
                <div className="mt-4 text-xs text-green-400 font-bold uppercase tracking-widest">+ 即時引き出し</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Section */}
      <section className="py-16 pt-0 border-t border-white/5 mt-16 max-w-7xl mx-auto">
        <div className="pt-20 px-4">
           <div className="flex flex-col items-center mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-widest mb-4">クリエイターを探索する</h2>
              <p className="text-gray-500 uppercase text-[10px] font-black tracking-[0.5em]">グローバル・コンテンツ・マーケットプレイス</p>
           </div>
           {/* Fallback to FeedView */}
           <FeedView initialCategory="Todos" />
        </div>
      </section>
    </div>
  );
}
