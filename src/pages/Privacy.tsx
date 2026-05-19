import React from 'react';

export default function Privacy() {
  return (
    <div className="w-full py-12 px-4">
      <div className="max-w-4xl mx-auto bg-[#1C1E32] p-8 md:p-12 rounded-3xl border border-white/5">
        <h1 className="text-4xl font-black text-white mb-8">Política de Privacidade</h1>
        <div className="space-y-6 text-gray-300">
          <p>A sua privacidade é importante para nós. Esta Política de Privacidade descreve como coletamos, utilizamos e protegemos suas informações.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Informações Coletadas</h2>
          <p>Podemos coletar informações como: Nome, E-mail, Informações de login, Dados de navegação.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Uso das Informações</h2>
          <p>Utilizamos os dados para: Melhorar a experiência do usuário, Permitir acesso à plataforma, Enviar notificações importantes, Garantir segurança.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Compartilhamento de Dados</h2>
          <p>Não vendemos ou compartilhamos dados pessoais com terceiros, exceto quando necessário para funcionamento da plataforma ou exigência legal.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Cookies</h2>
          <p>Utilizamos cookies para melhorar a navegação e personalizar conteúdos.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Segurança</h2>
          <p>Adotamos medidas técnicas para proteger as informações dos usuários.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Direitos do Usuário</h2>
          <p>O usuário pode solicitar alteração ou exclusão de seus dados a qualquer momento.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Alterações</h2>
          <p>Esta política pode ser atualizada periodicamente.</p>
          
          <p className="mt-8">Ao utilizar o Packzinhu, você concorda com esta Política de Privacidade.</p>
        </div>
      </div>
    </div>
  );
}
