import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
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
  const [username, setUsername] = useState('admin');
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
              Acesso administrativo protegido por RBAC
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

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
                  'bg-slate-50 border-slate-300 text-slate-900'
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
                  'bg-slate-50 border-slate-300 text-slate-900'
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
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
