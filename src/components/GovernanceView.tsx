import React from 'react';
import { 
  ShieldCheck, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  TrendingDown,
  FileCheck
} from 'lucide-react';
import { GovernanceData, CloudResource, AppTheme } from '../types';
import { Language, translations } from '../i18n';

interface GovernanceViewProps {
  governance: GovernanceData;
  resources: CloudResource[];
  theme: AppTheme;
  language: Language;
}

export const GovernanceView: React.FC<GovernanceViewProps> = ({
  governance,
  resources,
  theme,
  language
}) => {
  const t = translations[language];

  const uniqueProviders = Array.from(new Set(resources.map(r => r.provider)));
  const providerCostBreakdown = uniqueProviders.map(p => ({
    provider: p,
    cost: resources.filter(r => r.provider === p).reduce((a, b) => a + b.estimatedMonthlyCost, 0)
  }));

  const totalCost = providerCostBreakdown.reduce((a, b) => a + b.cost, 0);

  const cardClass = theme === 'light'
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : theme === 'midnight'
    ? 'bg-slate-900 border-indigo-950/70 text-white shadow-indigo-950/40'
    : 'bg-slate-900 border-slate-800 text-white';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`border rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm ${cardClass}`}>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {language === 'pt' ? 'Central de Governança & FinOps Multi-Cloud' : language === 'es' ? 'Central de Gobernanza & FinOps Multi-Nube' : 'Multi-Cloud Governance & FinOps Center'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'pt' ? 'Políticas contínuas CIS Benchmark, proteção de dados e otimização financeira' : 'Continuous CIS Benchmark policies, data protection and financial optimization'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6 bg-slate-800/80 px-6 py-3 rounded-xl border border-slate-700">
          <div className="text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              {language === 'pt' ? 'Score de Segurança' : 'Security Score'}
            </span>
            <span className="text-2xl font-bold text-emerald-400">{governance.complianceScore}%</span>
          </div>
          <div className="w-px h-8 bg-slate-700"></div>
          <div className="text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              {language === 'pt' ? 'Total Mensal' : 'Monthly Total'}
            </span>
            <span className="text-2xl font-bold text-white">${totalCost.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* FinOps Cost Allocation Breakdown */}
      <div className={`border rounded-xl p-5 shadow-sm ${cardClass}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-base flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>{t.costDistribution}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'pt' ? 'Rateio de custos em tempo real por provedor de nuvem conectado' : 'Real-time cost allocation per connected cloud provider'}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-800">
            Total: ${totalCost.toFixed(2)} / {language === 'pt' ? 'mês' : 'mo'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {providerCostBreakdown.map((item) => {
            const pct = totalCost > 0 ? ((item.cost / totalCost) * 100).toFixed(1) : '0';
            return (
              <div key={item.provider} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-indigo-400">{item.provider}</span>
                  <span className="text-xs font-mono font-bold text-slate-200">{pct}%</span>
                </div>
                <div className="mt-2 text-xl font-bold text-white">${item.cost.toFixed(2)}</div>
                <div className="mt-3 w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-1.5 rounded-full"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Compliance Policies & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Policies */}
        <div className={`border rounded-xl p-5 shadow-sm ${cardClass}`}>
          <div className="flex items-center space-x-2 mb-4">
            <FileCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-base">
              {language === 'pt' ? 'Políticas CIS Benchmark Multi-Cloud' : 'Multi-Cloud CIS Benchmark Policies'}
            </h3>
          </div>

          <div className="space-y-3">
            {governance.policies.map((policy) => (
              <div
                key={policy.id}
                className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  {policy.status === 'COMPLIANT' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-semibold text-xs text-slate-200 block">{policy.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{policy.id}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    policy.status === 'COMPLIANT'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {policy.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FinOps AI Cost Recommendations */}
        <div className={`border rounded-xl p-5 shadow-sm ${cardClass}`}>
          <div className="flex items-center space-x-2 mb-4">
            <TrendingDown className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-base">
              {language === 'pt' ? 'Recomendações FinOps (Economia Estimada)' : 'FinOps AI Recommendations'}
            </h3>
          </div>

          <div className="space-y-3">
            {governance.costOptimizationRecommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-slate-800/40 border border-slate-700/60 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-xs text-indigo-400">{rec.provider}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-xs text-slate-300">{rec.resource}</span>
                  </div>
                  <p className="text-xs text-slate-300">{rec.recommendation}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-semibold text-emerald-400 block font-mono">
                    -${rec.potentialSavings}/mo
                  </span>
                  <span className="text-[10px] text-slate-400">Economia</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
