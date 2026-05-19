import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    // Auto redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      navigate('/dashboard?tab=compras&success=true');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0a0502] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#1C1E32] p-8 rounded-3xl border border-white/5 text-center shadow-2xl">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-400" />
        </div>
        
        <h1 className="text-3xl font-black text-white mb-4">Pagamento Confirmado!</h1>
        <p className="text-gray-400 mb-8">
          Seu pagamento foi processado com sucesso. Você será redirecionado para o seu painel em instantes.
        </p>

        {paymentId && (
          <p className="text-[10px] text-gray-500 mb-8 uppercase tracking-widest">
            ID do Pagamento: {paymentId}
          </p>
        )}

        <button 
          onClick={() => navigate('/dashboard?tab=purchases&success=true')}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group"
        >
          Ir para Meus Pedidos
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
