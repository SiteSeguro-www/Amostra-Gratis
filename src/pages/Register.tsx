import { useState } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, increment } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { saveToMonio } from '../lib/monio';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('As senhas não coincidem.');
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name
      });

      // Create new user profile in Firestore
      const isAdmin = user.email === 'dweminem@gmail.com' || user.email === 'contato.packzinhu@gmail.com';
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: name,
        email: user.email,
        username: user.email?.split('@')[0] || user.uid,
        createdAt: new Date().toISOString(),
        followersCount: 0,
        followingCount: 0,
        lastSeen: new Date().toISOString(),
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
        name,
        email: user.email,
        authProvider: 'email',
        createdAt: new Date().toISOString()
      });
      
      navigate('/feed');
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
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
          lastSeen: new Date().toISOString(),
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
    <div className="py-20 max-w-md mx-auto px-4">
      <div className="bg-[#1C1E32] border border-white/5 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2 text-white">
            Criar conta
          </h1>
          <p className="text-sm text-gray-400">Cadastre-se para começar a vender seus serviços</p>
        </div>
        
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl mb-6 text-sm">{error}</div>}

        <button 
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full mb-6 py-3.5 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Cadastrar com Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#1C1E32] text-gray-400">Ou cadastre-se com email</span>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-white mb-1.5">Nome</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500 transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-white mb-1.5">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-1.5">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-1.5">Confirmar senha</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#131524] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500 transition-colors"
              required
            />
          </div>

          <div className="flex items-start gap-3 mt-4">
            <div className="flex items-center h-5">
              <input 
                id="terms" 
                type="checkbox" 
                required 
                className="w-4 h-4 mt-0.5 rounded border-white/10 bg-[#131524] text-pink-500 focus:ring-pink-500 focus:ring-offset-[#1C1E32] accent-pink-500 cursor-pointer" 
              />
            </div>
            <label htmlFor="terms" className="text-xs text-gray-400 leading-tight cursor-pointer">
              Eu concordo com os Termos de Serviço e Política de Privacidade da plataforma.
            </label>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-[#F43F5E] text-white font-bold rounded-xl hover:bg-[#E11D48] transition-colors shadow-lg disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar conta'}
          </button>
        </form>
        
        <p className="text-sm text-center text-gray-400 mt-6">
          Já tem uma conta? <Link to="/login" className="text-blue-500 hover:text-blue-400 font-medium">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
