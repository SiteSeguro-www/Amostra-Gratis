import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ShieldCheck, Zap, Lock, Globe } from 'lucide-react';
import FeedView from '../components/FeedView';

export default function HomeAR() {
  return (
    <div className="min-h-screen bg-[#0f0f0f]" dir="rtl">
      <Helmet>
        <title>أفضل بديل لأونلي فانز | بيع محتواك عبر الإنترنت | PackZinhu</title>
        <meta name="description" content="اكتشف أفضل بديل لأونلي فانز. يقدم PackZinhu رسومًا أقل، ومدفوعات فورية، وخصوصية كاملة لمنشئي المحتوى." />
        <link rel="canonical" href="https://packzinhu.online/ar/" />
        <meta property="og:title" content="أفضل بديل لأونلي فانز | بيع محتواك عبر الإنترنت | PackZinhu" />
        <meta property="og:description" content="اكتشف أفضل بديل لأونلي فانز. يقدم PackZinhu رسومًا أقل، ومدفوعات فورية، وخصوصية كاملة لمنشئي المحتوى." />
        <meta property="og:image" content="https://packzinhu.online/alternativa4.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="أفضل بديل لأونلي فانز | بيع محتواك عبر الإنترنت | PackZinhu" />
        <meta name="twitter:description" content="اكتشف أفضل بديل لأونلي فانز. يقدم PackZinhu رسومًا أقل، ومدفوعات فورية، وخصوصية كاملة لمنشئي المحتوى." />
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
              منصة عالمية لمنشئي المحتوى
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white italic tracking-tighter leading-tight mb-8">
              أفضل بديل لأونلي فانز <br/>
              <span className="text-purple-500">لبيع محتواك الخاص</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto italic mb-10 leading-relaxed">
              لماذا تقبل برسوم 20%؟ PackZinhu يمنح المبدعين الرقميين القدرة على بيع الصور ومقاطع الفيديو والاشتراكات بأرباح أعلى وأمان تام.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={() => window.location.href = '/register'}
                className="px-10 py-5 bg-purple-600 text-white font-black uppercase tracking-widest rounded-full hover:bg-purple-500 transition-all shadow-[0_0_30px_rgba(147,51,234,0.3)] flex items-center gap-2"
              >
                ابدأ الربح الآن <ArrowLeft className="w-5 h-5" />
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
              لماذا ينتقل المبدعون إلى PackZinhu
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-right">
            {[
              { 
                icon: Zap, 
                title: 'مدفوعات سريعة', 
                desc: 'احصل على أموالك بسرعة دون الانتظار لأسابيع. نقوم بمعالجة المدفوعات بأمان وسرعة.',
                color: 'text-yellow-400',
                bg: 'bg-yellow-400/10'
              },
              { 
                icon: ShieldCheck, 
                title: 'لا رسوم خفية', 
                desc: 'احتفظ بما يصل إلى 95% من أرباحك. توقف عن خسارة المال بسبب عمولات المنصات الضخمة.',
                color: 'text-green-400',
                bg: 'bg-green-400/10'
              },
              { 
                icon: Lock, 
                title: 'خصوصية كاملة', 
                desc: 'حماية متقدمة ضد التسريبات وقواعد صارمة لإدارة الحقوق الرقمية. أنت تتحكم في من يرى محتواك.',
                color: 'text-purple-400',
                bg: 'bg-purple-400/10'
              },
              { 
                icon: Globe, 
                title: 'حرية أكبر', 
                desc: 'بع الصور المباشرة أو الاشتراكات أو حزم المحتوى الكاملة في مكان واحد.',
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
                <div className={`w-12 h-12 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 ml-auto mr-0`}>
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
          <h2 className="text-3xl font-black text-white italic tracking-tighter mb-12 uppercase">
            احتفظ بالمزيد من أرباحك
          </h2>
          
          <div className="bg-[#131524] rounded-[3rem] p-8 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="p-6 bg-white/5 rounded-3xl opacity-50 border border-white/5 text-right">
                <div className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">OnlyFans والمنصات الأخرى</div>
                <div className="text-4xl font-black text-white opacity-50 italic mb-2">80%</div>
                <div className="text-sm text-gray-500">أرباح منشئ المحتوى</div>
                <div className="mt-4 text-xs text-red-400 font-bold">20% رسوم المنصة</div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-3xl border border-purple-500/30 text-right scale-105 shadow-xl shadow-purple-500/10">
                <div className="text-purple-400 text-xs font-black uppercase tracking-widest mb-2">PackZinhu</div>
                <div className="text-5xl font-black text-white italic mb-2 line-clamp-1">تصل إلى 95%</div>
                <div className="text-sm text-gray-300">أرباح منشئ المحتوى</div>
                <div className="mt-4 text-xs text-green-400 font-bold uppercase tracking-widest">+ سحب فوري (PIX)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Section */}
      <section className="py-16 pt-0 border-t border-white/5 mt-16 max-w-7xl mx-auto">
        <div className="pt-20 px-4">
           <div className="flex flex-col items-center mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-widest mb-4">اكتشف منشئي المحتوى لدينا</h2>
              <p className="text-gray-500 uppercase text-[10px] font-black tracking-[0.5em]">سوق المحتوى العالمي</p>
           </div>
           <FeedView initialCategory="Todos" />
        </div>
      </section>
    </div>
  );
}
