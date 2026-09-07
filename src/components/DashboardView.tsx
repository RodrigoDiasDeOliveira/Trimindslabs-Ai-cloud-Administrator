import React from 'react';
import { 
  Server, 
  DollarSign, 
  ShieldCheck, 
  Activity, 
  ArrowUpRight, 
  CheckCircle2, 
  Zap,
  Plus,
  Cloud
} from 'lucide-react';
import { CloudResource, ProviderStatus, AuditLog, AppTheme } from '../types';
import { Language, translations } from '../i18n';

interface DashboardViewProps {
  resources: CloudResource[];
  providers: ProviderStatus[];
  auditLogs: AuditLog[];
  onTriggerAgentPrompt: (prompt: string) => void;
  onNavigateToResources: () => void;
  onOpenAddCloud: () => void;
  theme: AppTheme;
  language: Language;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  resources,
  providers,
  auditLogs,
  onTriggerAgentPrompt,
  onNavigateToResources,
  onOpenAddCloud,
  theme,
  language
}) => {
  const t = translations[language];

  const totalCost = resources.reduce((acc, r) => acc + r.estimatedMonthlyCost, 0);
  const runningCount = resources.filter(r => r.status === 'RUNNING').length;
  const avgLatency = Math.round(
    providers.reduce((acc, p) => acc + p.latencyMs, 0) / (providers.length || 1)
  );

  const quickShortcuts = [
    {
      title: language === 'pt' ? 'Auditar Buckets e Armazenamento' : language === 'es' ? 'Auditar Buckets y Almacenamiento' : 'Audit Buckets & Storage',
      prompt: language === 'pt' ? 'Liste todos os buckets de storage em AWS e Azure, verificando se há algum com acesso público desprotegido.' : language === 'es' ? 'Enumere todos los buckets de almacenamiento en AWS y Azure, comprobando acceso público.' : 'List all storage buckets across AWS and Azure, checking for unencrypted public access.',
      badge: 'Storage & Security'
    },
    {
      title: language === 'pt' ? 'Inventário de Computação Multi-Cloud' : language === 'es' ? 'Inventario de Cómputo Multi-Nube' : 'Multi-Cloud Compute Inventory',
      prompt: language === 'pt' ? 'Mostre todas as instâncias de VMs e nós de computação em AWS, Azure, GCP e OCI com custos estimados.' : language === 'es' ? 'Muestre todas las instancias de VMs en AWS, Azure, GCP y OCI con costes estimados.' : 'Display all VM instances and nodes across AWS, Azure, GCP and OCI with estimated costs.',
      badge: 'Compute & FinOps'
    },
    {
      title: language === 'pt' ? 'Saúde dos Bancos de Dados' : language === 'es' ? 'Salud de Bases de Datos' : 'Database Health & Backups',
      prompt: language === 'pt' ? 'Liste os bancos de dados gerenciados ativos (RDS, Cloud SQL, Autonomous DB) e verifique os backups.' : language === 'es' ? 'Enumere las bases de datos activas (RDS, Cloud SQL, Autonomous DB) y revise copias de seguridad.' : 'List active managed databases (RDS, Cloud SQL, Autonomous DB) and check backup status.',
      badge: 'Database Ops'
    },
    {
      title: language === 'pt' ? 'Otimização de Custos (FinOps)' : language === 'es' ? 'Optimización de Costes (FinOps)' : 'Cost Optimization (FinOps)',
      prompt: language === 'pt' ? 'Analise os custos mensais consolidados por nuvem e recomende economias com instâncias reservadas.' : language === 'es' ? 'Analice los costes mensuales por nube y recomiende ahorros con instancias reservadas.' : 'Analyze consolidated monthly costs per cloud and recommend reserved instance savings.',
      badge: 'FinOps AI'
    }
  ];

  const cardClass = theme === 'light'
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : theme === 'midnight'
    ? 'bg-slate-900 border-indigo-950/70 text-white shadow-indigo-950/40'
    : 'bg-slate-900 border-slate-800 text-white';

  const tableHeaderClass = theme === 'light'
    ? 'bg-slate-100 text-slate-600 border-slate-200'
    : 'bg-slate-800/80 text-slate-400 border-slate-700';

  const tableRowClass = theme === 'light'
    ? 'hover:bg-slate-50 border-slate-200 text-slate-800'
    : 'hover:bg-slate-800/40 border-slate-800 text-slate-300';

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className={`border rounded-xl p-5 relative overflow-hidden transition-all ${cardClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.activeResources}</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold">{runningCount}</span>
            <span className="text-xs text-slate-400">/ {resources.length} {language === 'pt' ? 'total' : 'allocated'}</span>
          </div>
          <div className="mt-3 flex items-center space-x-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-medium flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" /> 100% Online
            </span>
            <span>• {providers.length} {language === 'pt' ? 'Nuvens' : 'Clouds'}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className={`border rounded-xl p-5 relative overflow-hidden transition-all ${cardClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.monthlyEstimate}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold">${totalCost.toFixed(2)}</span>
            <span className="text-xs text-slate-400">USD/{language === 'pt' ? 'mês' : 'mo'}</span>
          </div>
          <div className="mt-3 flex items-center space-x-1 text-xs text-emerald-400">
            <span>FinOps AI Guardrails Actives</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className={`border rounded-xl p-5 relative overflow-hidden transition-all ${cardClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.cisCompliance}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold">96%</span>
            <span className="text-xs text-emerald-400 font-medium">{language === 'pt' ? 'Grau A' : 'Grade A'}</span>
          </div>
          <div className="mt-3 flex items-center space-x-1 text-xs text-slate-400">
            <span>ADR-004 RBAC & Audit Active</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className={`border rounded-xl p-5 relative overflow-hidden transition-all ${cardClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.avgLatency}</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold">{avgLatency}ms</span>
            <span className="text-xs text-slate-400">{language === 'pt' ? 'Multi-região' : 'Multi-region'}</span>
          </div>
          <div className="mt-3 flex items-center space-x-1 text-xs text-slate-400">
            <span className="text-emerald-400">{providers.length} {language === 'pt' ? 'Provedores Conectados' : 'Connected Providers'}</span>
          </div>
        </div>
      </div>

      {/* Cloud Providers Status Grid with Add Cloud CTA */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">
              {language === 'pt' ? 'Nuvens Conectadas & Serviços' : language === 'es' ? 'Nubes Conectadas y Servicios' : 'Connected Clouds & Services'}
            </h3>
          </div>
          <button
            id="btn-add-cloud-panel"
            onClick={onOpenAddCloud}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm hover:scale-102 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.btnAddCloud}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {providers.map((p) => {
            const providerResources = resources.filter(r => r.provider === p.provider);
            const providerCost = providerResources.reduce((a, b) => a + b.estimatedMonthlyCost, 0);

            return (
              <div
                key={p.provider}
                className={`border rounded-xl p-4 transition-all hover:border-indigo-500/50 ${cardClass}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                    <h3 className="font-bold text-base">{p.provider}</h3>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {p.defaultRegion}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs py-2 border-y border-inherit">
                  <div>
                    <span className="text-slate-400 block">{t.activeResources}:</span>
                    <span className="font-semibold text-sm">{providerResources.length}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{t.monthlyEstimate}:</span>
                    <span className="font-semibold text-sm">${providerCost.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                    {language === 'pt' ? 'Serviços Habilitados:' : language === 'es' ? 'Servicios Habilitados:' : 'Enabled Services:'}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {p.availableServices.slice(0, 4).map((svc) => (
                      <span
                        key={svc}
                        className="text-[10px] bg-slate-800/80 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/60"
                      >
                        {svc}
                      </span>
                    ))}
                    {p.availableServices.length > 4 && (
                      <span className="text-[10px] text-slate-400 px-1">
                        +{p.availableServices.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* "+ Adicionar Nuvem" Quick Card */}
          <button
            onClick={onOpenAddCloud}
            className={`border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all group cursor-pointer ${
              theme === 'light' ? 'bg-slate-50 hover:bg-indigo-50/50' : 'bg-slate-900/40 hover:bg-indigo-950/20'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-indigo-400 block">{t.btnAddCloud}</span>
            <span className="text-[10px] text-slate-400 mt-1 max-w-[180px]">
              {language === 'pt' ? 'Cadastre credenciais e selecione recursos' : 'Register credentials & select services'}
            </span>
          </button>
        </div>
      </div>

      {/* Quick AI Agent Actions Bar */}
      <div className={`border rounded-xl p-5 ${cardClass}`}>
        <div className="flex items-center space-x-2 mb-3">
          <Zap className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-semibold">{t.quickPrompts}</h3>
          <span className="text-xs text-slate-400 hidden sm:inline">— {t.quickPromptsSubtitle}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickShortcuts.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onTriggerAgentPrompt(item.prompt)}
              className="p-3 text-left rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wide">
                  {item.badge}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-300 transition-colors" />
              </div>
              <p className="text-xs font-medium text-slate-200 line-clamp-2">{item.title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity & Resources Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Inventory Preview */}
        <div className={`lg:col-span-2 border rounded-xl p-5 ${cardClass}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-base">{t.inventoryTitle}</h3>
              <p className="text-xs text-slate-400">{t.inventorySubtitle}</p>
            </div>
            <button
              onClick={onNavigateToResources}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center cursor-pointer"
            >
              {t.viewAll} ({resources.length}) <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`font-semibold border-b ${tableHeaderClass}`}>
                <tr>
                  <th className="py-2.5 px-3">{t.filterProvider}</th>
                  <th className="py-2.5 px-3">{language === 'pt' ? 'Recurso' : 'Resource'}</th>
                  <th className="py-2.5 px-3">{t.filterCategory}</th>
                  <th className="py-2.5 px-3">{language === 'pt' ? 'Região' : 'Region'}</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">{language === 'pt' ? 'Custo Est.' : 'Cost'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {resources.slice(0, 6).map((r) => (
                  <tr key={r.id} className={`transition-colors border-b ${tableRowClass}`}>
                    <td className="py-2.5 px-3 font-bold text-indigo-400">{r.provider}</td>
                    <td className="py-2.5 px-3 font-medium">
                      <div>{r.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.resourceType}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{r.region}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'RUNNING'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${r.status === 'RUNNING' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                        {r.status === 'RUNNING' ? t.statusRunning : t.statusStopped}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">
                      ${r.estimatedMonthlyCost.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Audit Log Stream */}
        <div className={`border rounded-xl p-5 ${cardClass}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-base">{t.auditTitle}</h3>
              <p className="text-xs text-slate-400">{t.auditSubtitle}</p>
            </div>
          </div>

          <div className="space-y-3">
            {auditLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-indigo-400">{log.provider}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-[11px] text-slate-200">{log.action}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    log.riskLevel === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : log.riskLevel === 'MEDIUM'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {log.riskLevel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-2">{log.details}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span>{log.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
