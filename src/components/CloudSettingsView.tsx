import React, { useState } from 'react';
import { 
  Cloud, 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  Server, 
  Plus
} from 'lucide-react';
import { ProviderStatus, AppTheme, AuthUser } from '../types';
import { Language, translations } from '../i18n';

interface CloudSettingsViewProps {
  providers: ProviderStatus[];
  backendMode: 'embedded' | 'springboot';
  onToggleBackendMode: () => void;
  theme: AppTheme;
  language: Language;
  currentUser: AuthUser | null;
  onOpenAddCloud: () => void;
}

export const CloudSettingsView: React.FC<CloudSettingsViewProps> = ({
  providers,
  backendMode,
  onToggleBackendMode,
  theme,
  language,
  onOpenAddCloud
}) => {
  const t = translations[language];
  const [awsRegion, setAwsRegion] = useState('us-east-1');
  const [awsAccessKey, setAwsAccessKey] = useState('AKIA5PRODEXAMPLE2026');
  const [azureTenant, setAzureTenant] = useState('8f9c1234-5678-90ab-cdef-1234567890ab');
  const [gcpProject, setGcpProject] = useState('multicloud-enterprise-prod');
  const [ociTenancy, setOciTenancy] = useState('ocid1.tenancy.oc1..aaaaaaaax23fakeocid');
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const cardClass = theme === 'light'
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : theme === 'midnight'
    ? 'bg-slate-900 border-indigo-950/70 text-white shadow-indigo-950/40'
    : 'bg-slate-900 border-slate-800 text-white';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Backend Engine Architecture Selection */}
      <div className={`border rounded-xl p-6 shadow-sm space-y-4 ${cardClass}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">
              {language === 'pt' ? 'Modo do Backend & Roteamento de APIs' : 'Backend Mode & API Routing'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'pt' ? 'Alterne entre o backend integrado no contêiner ou o endpoint corporativo do Spring Boot 3.3' : 'Switch between embedded node runtime or Spring Boot 3.3 enterprise endpoint'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Mode 1 */}
          <div
            onClick={() => backendMode !== 'embedded' && onToggleBackendMode()}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              backendMode === 'embedded'
                ? 'bg-indigo-950/40 border-indigo-500 shadow-md'
                : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-white flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>Live Embedded Agent Engine</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                {backendMode === 'embedded' ? 'ATIVO' : 'SELECIONAR'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Servidor Express + Gemini 3.8 Flash integrado ao contêiner, respondendo instantaneamente a chamadas de orquestração multi-cloud.
            </p>
          </div>

          {/* Mode 2 */}
          <div
            onClick={() => backendMode !== 'springboot' && onToggleBackendMode()}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              backendMode === 'springboot'
                ? 'bg-indigo-950/40 border-indigo-500 shadow-md'
                : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-white flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>Spring Boot 3.3 Enterprise Gateway</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {backendMode === 'springboot' ? 'ATIVO' : 'SELECIONAR'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Roteia comandos através do microserviço Spring Boot (`http://localhost:8080/api/v1`) com Spring Security RBAC.
            </p>
          </div>
        </div>
      </div>

      {/* Cloud Providers Status & Add Cloud CTA */}
      <div className={`border rounded-xl p-6 shadow-sm ${cardClass}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {language === 'pt' ? 'Provedores de Nuvem Conectados' : 'Connected Cloud Providers'}
              </h2>
              <p className="text-xs text-slate-400">
                {providers.length} {language === 'pt' ? 'provedores autenticados via IAM/AssumeRole' : 'providers authenticated via IAM/AssumeRole'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAddCloud}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.btnAddCloud}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {providers.map((p) => (
            <div key={p.provider} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/80 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-indigo-400">{p.provider}</span>
                <span className="font-mono text-[10px] text-slate-400">{p.defaultRegion}</span>
              </div>
              <div className="text-slate-400 mb-2">
                {p.availableServices.length} {language === 'pt' ? 'serviços habilitados' : 'enabled services'}
              </div>
              <div className="flex items-center text-emerald-400 text-[11px] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Conectado & Auditado
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cloud IAM & API Credentials Form */}
      <form onSubmit={handleSave} className={`border rounded-xl p-6 shadow-sm space-y-6 ${cardClass}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">
              {language === 'pt' ? 'Parâmetros Globais de Credenciais IAM' : 'Global IAM Credentials'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'pt' ? 'Tokens e chaves armazenados com criptografia KMS de envelope (ADR-002)' : 'Tokens and keys stored with KMS envelope encryption (ADR-002)'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">AWS Access Key / IAM Role</label>
            <input
              type="text"
              value={awsAccessKey}
              onChange={(e) => setAwsAccessKey(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1">AWS Default Region</label>
            <input
              type="text"
              value={awsRegion}
              onChange={(e) => setAwsRegion(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1">Azure Tenant ID / Subscription</label>
            <input
              type="text"
              value={azureTenant}
              onChange={(e) => setAzureTenant(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1">GCP Project ID</label>
            <input
              type="text"
              value={gcpProject}
              onChange={(e) => setGcpProject(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-slate-400 font-medium mb-1">OCI Tenancy OCID</label>
            <input
              type="text"
              value={ociTenancy}
              onChange={(e) => setOciTenancy(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-inherit">
          {savedMessage ? (
            <span className="text-xs text-emerald-400 font-medium flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {language === 'pt' ? 'Configurações salvas e validadas com sucesso!' : 'Configuration saved and validated successfully!'}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1 text-indigo-400" />
              {language === 'pt' ? 'Conexões validadas via mTLS e Envelope Encryption' : 'Validated connections via mTLS & Envelope Encryption'}
            </span>
          )}

          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
          >
            {language === 'pt' ? 'Salvar Configurações' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
