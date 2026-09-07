import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  Download, 
  CheckCircle2, 
  AlertOctagon,
  Key
} from 'lucide-react';
import { AuditLog, AppTheme } from '../types';
import { Language, translations } from '../i18n';

interface AuditLedgerViewProps {
  auditLogs: AuditLog[];
  theme: AppTheme;
  language: Language;
}

export const AuditLedgerView: React.FC<AuditLedgerViewProps> = ({
  auditLogs,
  theme,
  language
}) => {
  const t = translations[language];
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('ALL');

  const uniqueProviders = Array.from(new Set(auditLogs.map(l => l.provider)));
  const providers = ['ALL', ...uniqueProviders];

  const filteredLogs = auditLogs.filter((log) => {
    const matchProvider = selectedProvider === 'ALL' || log.provider === selectedProvider;
    const matchSearch =
      !searchTerm ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchProvider && matchSearch;
  });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `multicloud-audit-ledger-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

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
      {/* Top Filter and Actions */}
      <div className={`border rounded-xl p-5 shadow-sm space-y-4 ${cardClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold flex items-center space-x-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <span>{language === 'pt' ? 'Trilha de Auditoria e Governança Imutável' : 'Immutable Audit & Governance Ledger'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'pt' ? 'Registros criptográficos assinados com SHA-256 (ADR-004 Conformidade SOC 2 / ISO 27001)' : 'Cryptographic SHA-256 signed records (ADR-004 SOC 2 / ISO 27001 Compliance)'}
            </p>
          </div>

          <button
            onClick={handleExportJson}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>{t.exportLedger}</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-inherit">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'pt' ? 'Buscar nos registros de auditoria...' : 'Search in audit logs...'}
              className={`w-full rounded-lg pl-10 pr-4 py-1.5 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 border ${
                theme === 'light'
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto text-xs">
            <span className="text-slate-400 mr-1">{t.filterProvider}:</span>
            {providers.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedProvider(p)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  selectedProvider === p
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className={`border rounded-xl overflow-hidden shadow-sm ${cardClass}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`font-semibold border-b ${tableHeaderClass}`}>
              <tr>
                <th className="py-3 px-4">{language === 'pt' ? 'Data / Hora' : 'Timestamp'}</th>
                <th className="py-3 px-4">{language === 'pt' ? 'Operador / Role' : 'Operator / Role'}</th>
                <th className="py-3 px-4">{t.filterProvider}</th>
                <th className="py-3 px-4">{language === 'pt' ? 'Ação Executada' : 'Action'}</th>
                <th className="py-3 px-4">{language === 'pt' ? 'Recurso Alvo' : 'Target Resource'}</th>
                <th className="py-3 px-4">{language === 'pt' ? 'Risco' : 'Risk'}</th>
                <th className="py-3 px-4">{language === 'pt' ? 'Detalhes da Operação' : 'Details'}</th>
                <th className="py-3 px-4">{language === 'pt' ? 'Assinatura SHA-256' : 'Signature'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit">
              {filteredLogs.map((log) => (
                <tr key={log.id} className={`transition-colors border-b ${tableRowClass}`}>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold">{log.user}</div>
                    <span className="text-[10px] text-indigo-400 font-mono">{log.role}</span>
                  </td>
                  <td className="py-3 px-4 font-bold text-indigo-400">{log.provider}</td>
                  <td className="py-3 px-4 font-mono font-medium">{log.action}</td>
                  <td className="py-3 px-4 font-mono text-slate-300">{log.resourceId}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.riskLevel === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : log.riskLevel === 'MEDIUM'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {log.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                    {log.signature.slice(0, 18)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
