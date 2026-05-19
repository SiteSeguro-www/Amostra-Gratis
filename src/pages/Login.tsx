import { useState } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { saveToMonio } from '../lib/monio';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, DollarSign, CheckCircle2, Lock, ArrowRight, Wallet, Percent, Clock } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      navigate('/feed');
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Email ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;

      // Check if user profile already exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create new user profile in Firestore if it doesn't exist
        const isAdmin = user.email === 'dweminem@gmail.com' || user.email === 'contato.packzinhu@gmail.com';
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Usuário',
          email: user.email,
          username: user.email?.split('@')[0] || user.uid,
          photoURL: user.photoURL || '',
          createdAt: new Date().toISOString(),
          followersCount: 0,
          followingCount: 0,
          role: isAdmin ? 'admin' : 'user',
          hotCoins: isAdmin ? 2000 : 0
        }, { merge: true });

        // Increment user count
        await setDoc(doc(db, 'system_stats', 'global'), {
          user_count: increment(1)
        }, { merge: true });
        
        // Save to Monio
        saveToMonio('users', {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Usuário',
          email: user.email,
          authProvider: 'google',
          photoURL: user.photoURL || '',
          createdAt: new Date().toISOString()
        });
      }

      navigate('/feed');
    } catch (err: any) {
      console.error('Google auth error:', err);
      setError('Erro ao autenticar com o Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-16 pb-24">
      {/* Hero Section with Split Layout */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Column: Value Proposition */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="order-2 lg:order-1"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-[0.2em] mb-6">
              <Zap className="w-3.5 h-3.5" />
              A Melhor Plataforma
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white italic tracking-tighter leading-[1.1] mb-6">
              Acesse sua conta e <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
                Aumente Seus Ganhos
              </span>
            </h1>
            
            <p className="text-lg text-gray-400 mb-8 max-w-xl">
              Entre e continue faturando com seu conteúdo. Se você ainda não começou, descubra por que o PackZinhu é a escolha número um dos criadores.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-[#131524] border border-white/5 p-4 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Percent className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">95% é Seu!</h3>
                  <p className="text-sm text-gray-400 leading-tight">A maior taxa de repasse do mercado. Fique com quase tudo que vende.</p>
                </div>
              </div>
              <div className="bg-[#131524] border border-white/5 p-4 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Sem Taxa de Saque</h3>
                  <p className="text-sm text-gray-400 leading-tight">Você não paga nada para retirar o seu dinheiro via PIX.</p>
                </div>
              </div>
              <div className="bg-[#131524] border border-white/5 p-4 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Receba no Mesmo Dia</h3>
                  <p className="text-sm text-gray-400 leading-tight">Dinheiro na sua conta de forma ultra rápida e descomplicada, no mesmo dia.</p>
                </div>
              </div>
              <div className="bg-[#131524] border border-white/5 p-4 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Sem Assinatura Mensal</h3>
                  <p className="text-sm text-gray-400 leading-tight">Você não precisa pagar nenhuma mensalidade para usar a plataforma.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Login Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="order-1 lg:order-2"
          >
            <div className="bg-[#1C1E32]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Lock className="w-32 h-32" />
              </div>
              
              <div className="relative z-10 text-center mb-8">
                <h2 className="text-3xl font-black mb-2 text-white italic">Bem-vindo de volta</h2>
                <p className="text-sm text-gray-400">Entre com seu email para acessar ou criar sua conta</p>
              </div>
              
              <div className="relative z-10">
                {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl mb-6 text-sm flex items-center justify-center font-medium">{error}</div>}

                <button 
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full mb-6 py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-transform active:scale-[0.98] shadow-lg disabled:opacity-50 flex items-center justify-center gap-3 text-base"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Entrar com Google
                </button>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[#1C1E32] text-gray-500 font-medium">Ou continue com email</span>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1.5 ml-1">Email</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-purple-500 transition-colors focus:ring-1 focus:ring-purple-500/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1.5 ml-1">Senha</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-purple-500 transition-colors focus:ring-1 focus:ring-purple-500/50"
                      required
                    />
                  </div>

                  <div className="flex items-start gap-3 mt-2">
                    <div className="flex items-center h-5">
                      <input 
                        id="terms" 
                        type="checkbox" 
                        required 
                        className="w-4 h-4 mt-0.5 rounded border-white/10 bg-[#131524] text-purple-500 focus:ring-purple-500 focus:ring-offset-[#1C1E32] accent-purple-500 cursor-pointer" 
                      />
                    </div>
                    <label htmlFor="terms" className="text-xs text-gray-400 leading-tight cursor-pointer">
                      Eu concordo com os Termos de Serviço e Política de Privacidade da plataforma.
                    </label>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 mt-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black rounded-xl hover:opacity-90 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50 text-base"
                  >
                    {loading ? 'Processando...' : 'Entrar na Plataforma'}
                  </button>
                </form>
                
                <p className="text-sm text-center text-gray-400 mt-8">
                  Ainda não tem experiência? <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-bold ml-1 transition-colors">Abra sua conta grátis</Link>
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Trust & Security Section */}
      <div className="max-w-7xl mx-auto px-4 mt-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-white italic mb-4">Construído para Criadores Exigentes</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Toda a segurança estrutural e as vantagens que você não encontra em outras plataformas, disponíveis gratuitamente para quem cria.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#131524]/50 border border-white/5 p-8 rounded-3xl text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Segurança Total</h3>
            <p className="text-gray-400 text-sm">Transações protegidas de ponta a ponta. Seus dados e seu conteúdo estão blindados usando os mais altos padrões do mercado.</p>
          </div>

          <div className="bg-[#131524]/50 border border-white/5 p-8 rounded-3xl text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-400 relative z-10">
              <DollarSign className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 relative z-10">PIX Integrado</h3>
            <p className="text-gray-400 text-sm relative z-10">Receba suas vendas instantaneamente e realize saques diretos para sua conta bancária a qualquer momento, sem taxas de transferência.</p>
          </div>

          <div className="bg-[#131524]/50 border border-white/5 p-8 rounded-3xl text-center">
            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-purple-400">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Privacidade Garantida</h3>
            <p className="text-gray-400 text-sm">Controle completo sobre quem vê seu conteúdo. Bloqueio por estado ou país e recursos anti-print incorporados nativamente.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
