import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { AuthUser, AppTheme } from '../types';
import { Language, translations } from '../i18n';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  currentLanguage: Language;
  theme: AppTheme;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentLanguage,
  theme
}) => {
  const t = translations[currentLanguage];
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (u = username, p = password) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha na autenticação');
      }

      onLoginSuccess(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao conectar ao serviço de autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickUsers = [
    {
      id: 'demo',
      label: 'Demo (Simulação)',
      role: 'ROLE_OBSERVER',
      desc: 'Único perfil de demonstração; somente leitura e sem mutações de cloud.',
      u: 'demo',
      p: 'demo',
      color: 'border-slate-400 bg-slate-100 text-slate-700'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl p-6 relative transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {t.login}
            </h2>
            <p className="text-xs text-slate-400">
              Spring Boot Security (RBAC): Admin, Dev e Observer
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1-Click Profile Selectors for Fast Verification */}
        <div className="mb-5 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Exemplo de demonstração (opcional):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {quickUsers.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setUsername(item.u);
                  setPassword(item.p);
                  handleLogin(item.u, item.p);
                }}
                disabled={isLoading}
                className={`p-2.5 rounded-xl border text-left transition-all hover:scale-[1.02] cursor-pointer ${item.color}`}
              >
                <div className="font-bold text-xs">{item.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{item.u} / {item.p}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Credentials Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-4 pt-2 border-t border-slate-200"
        >
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Usuário (Username):
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-900/80 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Senha (Password):
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full pl-9 pr-10 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-900/80 border-slate-700 text-white'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {t.btnCancel}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              {isLoading && <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>}
              <span>{t.login}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
