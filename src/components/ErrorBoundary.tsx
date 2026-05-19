import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log caught errors for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'Ocorreu um erro inesperado.';
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Erro de permissão no banco de dados: ${parsed.error}`;
            isFirestoreError = true;
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-[#131524] flex items-center justify-center p-4 text-white font-sans">
          <div className="max-w-md w-full bg-[#1C1E32] border border-white/10 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
              <AlertCircle className="w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black">Ops! Algo deu errado</h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                {isFirestoreError 
                  ? "Parece que você não tem permissão para realizar esta ação ou houve um problema de conexão."
                  : "Não conseguimos processar sua solicitação no momento. Tente recarregar a página."}
              </p>
            </div>

            <div className="bg-black/20 rounded-xl p-4 text-left">
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">Detalhes do Erro</p>
              <p className="text-xs font-mono text-red-400 break-all line-clamp-3">
                {errorMessage}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" /> Recarregar
              </button>
              <button 
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold transition-colors text-sm"
              >
                <Home className="w-4 h-4" /> Início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
