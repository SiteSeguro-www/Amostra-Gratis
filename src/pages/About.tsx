import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function About() {
  return (
    <div className="w-full py-12 px-4">
      <Helmet>
        <title>PackZinhu - Sobre Nós</title>
        <meta name="description" content="Saiba mais sobre o PackZinhu, nossa missão, visão e valores como a plataforma líder para criadores de conteúdo." />
        <link rel="canonical" href="https://packzinhu.online/about" />
      </Helmet>
      <div className="max-w-4xl mx-auto bg-[#1C1E32] p-8 md:p-12 rounded-3xl border border-white/5">
        <h1 className="text-4xl font-black text-white mb-8">Sobre Nós</h1>
        <div className="space-y-6 text-gray-300">
          <p>Bem-vindo ao Packzinhu.</p>
          <p>O Packzinhu é uma plataforma digital criada para conectar criadores e usuários em um ambiente simples, rápido e seguro. Nosso objetivo é oferecer um espaço onde pessoas possam compartilhar, divulgar e comercializar conteúdos digitais de forma prática.</p>
          <p>Acreditamos na economia criativa e no potencial de cada usuário em transformar ideias em oportunidades. Por isso, desenvolvemos uma plataforma intuitiva, focada em facilitar a publicação de conteúdos, interação entre usuários e geração de renda.</p>
          <p>Nossa missão é democratizar o acesso à monetização digital, permitindo que qualquer pessoa possa divulgar seus conteúdos e alcançar novos públicos.</p>
          <p>Nossa visão é se tornar uma referência em marketplace social, conectando criadores e consumidores em um ambiente confiável e inovador.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Nossos valores:</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Transparência</li>
            <li>Segurança</li>
            <li>Inovação</li>
            <li>Simplicidade</li>
            <li>Respeito aos usuários</li>
          </ul>
          
          <p className="mt-8">Estamos constantemente trabalhando para melhorar a experiência e adicionar novos recursos à plataforma.</p>
          <p>Obrigado por fazer parte do Packzinhu.</p>
        </div>
      </div>
    </div>
  );
}
