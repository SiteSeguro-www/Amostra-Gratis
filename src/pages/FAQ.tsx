import React, { useState } from 'react';
import { ShieldCheck, Lock, Package, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../components/JsonLd';

const faqs = [
  {
    question: "O pagamento é seguro?",
    answer: "Sim. O valor fica protegido na plataforma até você confirmar que recebeu o serviço corretamente."
  },
  {
    question: "E se eu não receber?",
    answer: "Você pode abrir uma solicitação de suporte dentro da plataforma e o pagamento não será liberado ao vendedor, garantindo o estorno do seu dinheiro."
  },
  {
    question: "Quanto tempo demora para receber?",
    answer: "Depende exclusivamente da complexidade do serviço contratado, mas você tem acesso a um chat para acompanhar tudo diretamente com quem vai executar."
  },
  {
    question: "Como vender packs fotos de pés?",
    answer: "Você pode vender fotos de pés criando um perfil no PackZinhu, OnlyFans ou Privacy. No PackZinhu, você cria sua vitrine, define seus preços e recebe pagamentos via PIX ou Cartão com segurança total."
  },
  {
    question: "Qual melhor site? OnlyFans, Privacy ou PackZinhu?",
    answer: "Depende do seu objetivo. OnlyFans e Privacy são populares, mas o PackZinhu oferece taxas menores (95% do valor é seu), suporte humanizado e foco total no público brasileiro com pagamento imediato."
  },
  {
    question: "Vale a pena vender fotos de pés?",
    answer: "Sim! É uma das formas de ganhar dinheiro online que mais cresce no Brasil. Muitas criadoras utilizam o PackZinhu como alternativa poderosa ao OnlyFans e Privacy para monetizar conteúdo exclusivo de forma segura."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-20 pb-32">
      <JsonLd 
        type="FAQPage"
        data={{
          mainEntity: faqs.map(f => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: f.answer
            }
          }))
        }}
      />
      <Helmet>
        <title>Como Vender Fotos de Pés | Dúvidas Frequentes PackZinhu</title>
        <meta name="description" content="Tire todas as suas dúvidas sobre como vender fotos de pés, packs online e como ganhar dinheiro na internet com segurança no PackZinhu." />
        <meta name="keywords" content="como vender fotos de pés, FAQ PackZinhu, segurança OnlyFans vs Privacy, guia vender packs" />
        <link rel="canonical" href="https://packzinhu.online/faq" />
      </Helmet>
      {/* Header Banner */}
      <div className="w-full bg-gradient-to-b from-[#1a1a24] to-[#0f0f0f] border-b border-white/5 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold text-sm mb-6">
            <AlertCircle className="w-4 h-4" />
            Remova suas dúvidas e realize serviços seguros
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
            Como vender fotos de pés e ganhar dinheiro online
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Descubra as melhores plataformas e entenda como funciona a proteção do PackZinhu para vender ou comprar com total tranquilidade.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="p-8 bg-[#131524] rounded-3xl border border-white/5">
            <h2 className="text-2xl font-black text-white mb-4 italic">Melhores plataformas</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Existem diversas opções no mercado, mas as principais hoje são OnlyFans, Privacy e o PackZinhu. Cada uma possui suas vantagens em alcance e taxas.
            </p>
          </div>
          <div className="p-8 bg-[#131524] rounded-3xl border border-white/5">
            <h2 className="text-2xl font-black text-white mb-4 italic">Quanto dá pra ganhar?</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              O faturamento varia conforme sua dedicação e divulgação. Algumas criadoras faturam de R$ 500 a mais de R$ 10.000 mensais vendendo conteúdo exclusivo.
            </p>
          </div>
          <div className="p-8 bg-[#131524] rounded-3xl border border-white/5">
            <h2 className="text-2xl font-black text-white mb-4 italic">Vale a pena?</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Sim! Vendendo fotos de pés você tem liberdade de horários, anonimato se desejar e um mercado em constante expansão com alta demanda por pacotes personalizados.
            </p>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white mb-12 text-center uppercase tracking-widest">
           Alternativas para OnlyFans e Privacy e Packzin
        </h2>
      </div>

      <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Column: FAQs Accordion */}
        <div>
          <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-8 bg-purple-600 rounded-full"></span>
            Principais Dúvidas
          </h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-[#131524] rounded-2xl border border-white/5 overflow-hidden transition-colors hover:border-purple-500/30"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-bold text-lg text-white">{faq.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-purple-500' : ''}`} 
                  />
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 pt-0 text-gray-400 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Trust Block */}
        <div>
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#131524] rounded-[2.5rem] p-8 md:p-10 border border-white/10 shadow-2xl shadow-purple-900/10 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                <ShieldCheck className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Como garantimos</h2>
                <span className="text-green-500 font-bold uppercase tracking-widest text-sm">sua segurança</span>
              </div>
            </div>

            <div className="space-y-6 flex-1">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 z-10">
                    <span className="text-lg">💳</span>
                  </div>
                  <div className="w-px h-full bg-white/10 my-2"></div>
                </div>
                <div className="pt-2 pb-6">
                  <h3 className="text-white font-bold text-lg mb-1">Você realiza o pagamento</h3>
                  <p className="text-gray-500 text-sm">Pague usando métodos seguros 100% integrados à plataforma.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 z-10">
                    <Lock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="w-px h-full bg-white/10 my-2"></div>
                </div>
                <div className="pt-2 pb-6">
                  <h3 className="text-white font-bold text-lg mb-1">O dinheiro fica protegido</h3>
                  <p className="text-gray-500 text-sm">O valor é retido em uma conta segura (escrow) não acessível ao vendedor.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30 z-10">
                    <Package className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="w-px h-full bg-white/10 my-2"></div>
                </div>
                <div className="pt-2 pb-6">
                  <h3 className="text-white font-bold text-lg mb-1">O vendedor entrega o serviço</h3>
                  <p className="text-gray-500 text-sm">Você acompanha a entrega e revisa tudo antes do próximo passo.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30 z-10">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <div className="pt-2">
                  <h3 className="text-white font-bold text-lg mb-1">Você aprova e libera</h3>
                  <p className="text-gray-500 text-sm">Pagamento só é liberado para o vendedor com a sua permissão.</p>
                </div>
              </div>
            </div>

            <div className="mt-10 p-5 rounded-2xl bg-white/5 border border-white/10 text-center">
              <p className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 font-extrabold text-xl">
                "Se não receber, você não perde seu dinheiro."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
