import React, { useState } from 'react';
import { 
  Server, 
  Search, 
  Play, 
  Square, 
  RotateCw, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Tag, 
  ExternalLink,
  X,
  Layers,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { CloudResource, AppTheme, AuthUser } from '../types';
import { Language, translations } from '../i18n';

interface ResourceExplorerViewProps {
  resources: CloudResource[];
  onPerformAction: (resourceId: string, action: string) => Promise<void>;
  isActionLoading: boolean;
  theme: AppTheme;
  language: Language;
  currentUser: AuthUser | null;
}

export const ResourceExplorerView: React.FC<ResourceExplorerViewProps> = ({
  resources,
  onPerformAction,
  isActionLoading,
  theme,
  language,
  currentUser
}) => {
  const t = translations[language];
  const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingResource, setInspectingResource] = useState<CloudResource | null>(null);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);

  // Dynamic providers based on currently allocated resources
  const uniqueProviders = Array.from(new Set(resources.map((r) => r.provider)));
  const providers = ['ALL', ...uniqueProviders];
  const categories = ['ALL', 'COMPUTE', 'STORAGE', 'DATABASE', 'NETWORKING', 'SECURITY'];

  const filteredResources = resources.filter((r) => {
    const matchProvider = selectedProvider === 'ALL' || r.provider === selectedProvider;
    const matchCategory = selectedCategory === 'ALL' || r.category === selectedCategory;
    const matchSearch =
      !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.resourceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchProvider && matchCategory && matchSearch;
  });

  const handleActionClick = (resourceId: string, action: string) => {
    if (currentUser?.role === 'ROLE_OBSERVER') {
      setPermissionNotice(t.observerRestriction);
      setTimeout(() => setPermissionNotice(null), 4000);
      return;
    }
    onPerformAction(resourceId, action);
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
      {/* Permission Warning Notice for Observer */}
      {permissionNotice && (
        <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-600/70 text-xs text-amber-200 flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{permissionNotice}</span>
          </div>
          <button
            onClick={() => setPermissionNotice(null)}
            className="text-amber-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters Card */}
      <div className={`border rounded-xl p-5 space-y-4 shadow-sm ${cardClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full rounded-lg pl-10 pr-4 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 border ${
                theme === 'light'
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>
              {language === 'pt' ? 'Exibindo' : 'Showing'} <strong>{filteredResources.length}</strong> {language === 'pt' ? 'de' : 'of'} {resources.length} {language === 'pt' ? 'recursos' : 'resources'}
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-inherit text-xs">
          {/* Cloud Provider Filter */}
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className="text-slate-400 font-medium mr-1">{t.filterProvider}:</span>
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

          {/* Category Filter */}
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className="text-slate-400 font-medium mr-1">{t.filterCategory}:</span>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  selectedCategory === c
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className={`border rounded-xl overflow-hidden shadow-sm ${cardClass}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`font-semibold border-b ${tableHeaderClass}`}>
              <tr>
                <th className="py-3 px-4">{t.filterProvider}</th>
                <th className="py-3 px-4">{language === 'pt' ? 'Nome do Recurso' : 'Resource Name'}</th>
                <th className="py-3 px-4">{t.filterCategory}</th>
                <th className="py-3 px-4">{language === 'pt' ? 'Região' : 'Region'}</th>
                <th className="py-3 px-4">{language === 'pt' ? 'Postura de Segurança' : 'Security Posture'}</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">{language === 'pt' ? 'Custo Est. / Mês' : 'Est. Cost / Mo'}</th>
                <th className="py-3 px-4 text-right">{language === 'pt' ? 'Ações' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    {language === 'pt' ? 'Nenhum recurso localizado para os filtros selecionados.' : 'No resources found matching the selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredResources.map((r) => (
                  <tr key={r.id} className={`transition-colors border-b ${tableRowClass}`}>
                    <td className="py-3 px-4">
                      <span className="font-bold text-indigo-400 text-sm">{r.provider}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-sm">{r.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{r.resourceType}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{r.region}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center text-emerald-400 font-medium text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" /> {r.securityPosture}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        r.status === 'RUNNING'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {r.status === 'RUNNING' ? t.statusRunning : t.statusStopped}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      ${r.estimatedMonthlyCost.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {r.status === 'RUNNING' ? (
                          <button
                            disabled={isActionLoading}
                            onClick={() => handleActionClick(r.id, 'STOP')}
                            className="p-1.5 rounded bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
                            title={currentUser?.role === 'ROLE_OBSERVER' ? t.observerRestriction : `${t.actionStop} (${r.name})`}
                          >
                            <Square className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            disabled={isActionLoading}
                            onClick={() => handleActionClick(r.id, 'START')}
                            className="p-1.5 rounded bg-slate-800 hover:bg-emerald-900/50 hover:text-emerald-400 text-slate-400 transition-colors cursor-pointer"
                            title={currentUser?.role === 'ROLE_OBSERVER' ? t.observerRestriction : `${t.actionStart} (${r.name})`}
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          disabled={isActionLoading}
                          onClick={() => handleActionClick(r.id, 'RESTART')}
                          className="p-1.5 rounded bg-slate-800 hover:bg-indigo-900/50 hover:text-indigo-400 text-slate-400 transition-colors cursor-pointer"
                          title={currentUser?.role === 'ROLE_OBSERVER' ? t.observerRestriction : `${t.actionRestart} (${r.name})`}
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setInspectingResource(r)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          title={t.actionInspect}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Resource Modal */}
      {inspectingResource && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 relative ${cardClass}`}>
            <button
              onClick={() => setInspectingResource(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">{inspectingResource.name}</h3>
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <span className="font-bold text-indigo-400">{inspectingResource.provider}</span>
                  <span>•</span>
                  <span>{inspectingResource.resourceType}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/60">
                <div>
                  <span className="text-slate-400 block">{language === 'pt' ? 'ID do Recurso' : 'Resource ID'}:</span>
                  <span className="font-mono text-slate-200">{inspectingResource.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{language === 'pt' ? 'Região' : 'Region'}:</span>
                  <span className="font-mono text-slate-200">{inspectingResource.region}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{language === 'pt' ? 'Custo Mensal' : 'Monthly Cost'}:</span>
                  <span className="font-semibold text-emerald-400">${inspectingResource.estimatedMonthlyCost.toFixed(2)}/mo</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Status:</span>
                  <span className={`font-semibold ${inspectingResource.status === 'RUNNING' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {inspectingResource.status}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Native Cloud ARN / Resource URI:</span>
                <div className="p-2.5 rounded bg-slate-950 font-mono text-[11px] text-indigo-300 break-all border border-slate-800">
                  {inspectingResource.nativeArnOrId}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1.5">{language === 'pt' ? 'Tags e Metadados' : 'Tags & Metadata'}:</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(inspectingResource.tags).map(([k, v]) => (
                    <span
                      key={k}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px]"
                    >
                      {k}: <strong>{v}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectingResource(null)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {language === 'pt' ? 'Fechar' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
