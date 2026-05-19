import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getApiUrl } from '../config';

export default function MercadoPagoCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Conectando sua conta do Mercado Pago...');

  useEffect(() => {
    const code = searchParams.get('code');
    const userId = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      setStatus('error');
      setMessage(errorDescription || 'Erro na autorização com o Mercado Pago.');
      return;
    }

    if (!code || !userId) {
      setStatus('error');
      setMessage('Código de autorização ou identificação do usuário ausente.');
      return;
    }

    async function exchangeCode() {
      try {
        const response = await fetch(getApiUrl('/api/auth/mercadopago/exchange'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, userId }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Sua conta foi conectada com sucesso! Redirecionando...');
          setTimeout(() => {
            navigate('/dashboard?tab=config&success=true');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Erro ao vincular sua conta.');
        }
      } catch (err) {
        console.error('Error exchanging code:', err);
        setStatus('error');
        setMessage('Erro de conexão com o servidor.');
      }
    }

    exchangeCode();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#0a0502] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#1C1E32] border border-white/10 rounded-[2.5rem] p-8 text-center shadow-2xl"
      >
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-purple-500 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Processando...</h2>
            <p className="text-gray-400">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Tudo Pronto!</h2>
            <p className="text-gray-400">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Ops! Algo deu errado</h2>
            <p className="text-gray-400 mb-8">{message}</p>
            <button 
              onClick={() => navigate('/dashboard?tab=config')}
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10"
            >
              Voltar para Configurações
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
