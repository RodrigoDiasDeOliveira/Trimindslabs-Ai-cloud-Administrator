import React, { useState } from 'react';
import { 
  Cloud, 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Server, 
  Database, 
  Plus, 
  Moon, 
  Sun, 
  Sparkles, 
  User, 
  LogOut, 
  ChevronDown, 
  Globe,
  Lock,
  Layers,
  Code2
} from 'lucide-react';
import { ProviderStatus, AppTheme, AuthUser, UserRole } from '../types';
import { Language, translations } from '../i18n';

interface HeaderProps {
  providers?: ProviderStatus[];
  activeCloudCount?: number;
  currentTab: string;
  onSelectTab?: (tab: string) => void;
  onTabChange?: (tab: string) => void;
  backendMode: 'embedded' | 'springboot';
  onToggleBackendMode?: () => void;
  theme: AppTheme;
  onChangeTheme?: (theme: AppTheme) => void;
  onThemeChange?: (theme: AppTheme) => void;
  language: Language;
  onChangeLanguage?: (lang: Language) => void;
  onLanguageChange?: (lang: Language) => void;
  currentUser: AuthUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenAddCloud: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  providers = [],
  activeCloudCount,
  currentTab,
  onSelectTab,
  onTabChange,
  backendMode,
  onToggleBackendMode,
  theme,
  onChangeTheme,
  onThemeChange,
  language,
  onChangeLanguage,
  onLanguageChange,
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenAddCloud,
}) => {
  const t = translations[language];
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleTabChange = onSelectTab || onTabChange || (() => {});
  const handleThemeChange = onChangeTheme || onThemeChange || (() => {});
  const handleLanguageChange = onChangeLanguage || onLanguageChange || (() => {});

  const navTabs = [
    { id: 'dashboard', label: t.navDashboard, icon: Activity },
    { id: 'agent', label: t.navAgent, icon: Cpu },
    { id: 'resources', label: t.navResources, icon: Server },
    { id: 'iac', label: t.navIac, icon: Code2 },
    { id: 'governance', label: t.navGovernance, icon: ShieldCheck },
    { id: 'audit', label: t.navAudit, icon: Database },
    { id: 'settings', label: t.navSettings, icon: Cloud },
  ];

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return {
          label: 'ADMIN',
          className: 'bg-purple-900/60 text-purple-300 border-purple-700/60',
          title: t.roleAdminDesc
        };
      case 'ROLE_DEV':
        return {
          label: 'DEV',
          className: 'bg-blue-900/60 text-blue-300 border-blue-700/60',
          title: t.roleDevDesc
        };
      case 'ROLE_OBSERVER':
        return {
          label: 'OBSERVER (READ)',
          className: 'bg-amber-900/60 text-amber-300 border-amber-700/60',
          title: t.roleObserverDesc
        };
      default:
        return {
          label: 'USER',
          className: 'bg-slate-800 text-slate-700 border-slate-200',
          title: ''
        };
    }
  };

  const roleInfo = currentUser ? getRoleBadge(currentUser.role) : null;

  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 shadow-sm sticky top-0 z-50">
      {/* Top Bar with Brand, Live Cloud Status, Theme, Language & Auth */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between border-b border-inherit gap-3">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/30">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight">{t.appTitle}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                PROD v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500">{t.appSubtitle}</p>
          </div>
        </div>

        {/* Action Controls: Add Cloud Button, Cloud Pills, Theme Switcher, Language & Auth */}
        <div className="flex items-center space-x-2 flex-wrap text-xs">
          {/* Prominent + Adicionar Nuvem Button */}
          <button
            id="btn-add-cloud-header"
            onClick={onOpenAddCloud}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm transition-all hover:scale-102 cursor-pointer"
            title={t.addCloudSubtitle}
          >
            <Plus className="w-4 h-4" />
            <span>{t.btnAddCloud}</span>
          </button>

          {/* Connected Cloud Pills */}
          <div className="hidden lg:flex items-center space-x-1.5">
            {providers.slice(0, 4).map((p) => (
              <div
                key={p.provider}
                className="flex items-center space-x-1 px-2 py-1 rounded-md bg-white border border-slate-200/80 text-[11px] text-slate-700"
                title={`${p.provider} (${p.defaultRegion}) - Latência: ${p.latencyMs}ms`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-semibold text-slate-800">{p.provider}</span>
                <span className="text-[10px] text-slate-500 hidden xl:inline">({p.activeResourcesCount})</span>
              </div>
            ))}
          </div>

          {/* Theme Switcher Button (3 options: dark, midnight, light) */}
          <div className="relative">
            <button
              id="btn-theme-switcher"
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
              title={`${t.themeLabel}: ${theme === 'dark' ? t.themeDark : theme === 'midnight' ? t.themeMidnight : t.themeLight}`}
            >
              {theme === 'dark' ? (
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              ) : theme === 'midnight' ? (
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="font-medium text-[11px] capitalize hidden sm:inline">
                {theme === 'dark' ? 'Escuro' : theme === 'midnight' ? 'Midnight' : 'Claro'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-white border border-slate-200 shadow-xl p-1 z-50 text-xs">
                <button
                  onClick={() => {
                    handleThemeChange('dark');
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    theme === 'dark' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-300" />
                  <span>{t.themeDark}</span>
                </button>
                <button
                  onClick={() => {
                    handleThemeChange('midnight');
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    theme === 'midnight' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                  <span>{t.themeMidnight}</span>
                </button>
                <button
                  onClick={() => {
                    handleThemeChange('light');
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    theme === 'light' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span>{t.themeLight}</span>
                </button>
              </div>
            )}
          </div>

          {/* Language Selector (PT, EN, ES) */}
          <div className="relative">
            <button
              id="btn-lang-switcher"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors cursor-pointer uppercase font-bold text-[11px]"
              title={t.langLabel}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{language}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-32 rounded-xl bg-white border border-slate-200 shadow-xl p-1 z-50 text-xs">
                <button
                  onClick={() => {
                    handleLanguageChange('pt');
                    setShowLangMenu(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    language === 'pt' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>🇧🇷</span>
                  <span>Português</span>
                </button>
                <button
                  onClick={() => {
                    handleLanguageChange('en');
                    setShowLangMenu(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    language === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>🇺🇸</span>
                  <span>English</span>
                </button>
                <button
                  onClick={() => {
                    handleLanguageChange('es');
                    setShowLangMenu(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    language === 'es' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>🇪🇸</span>
                  <span>Español</span>
                </button>
              </div>
            )}
          </div>

          {/* User Profile & Spring Boot Security Role */}
          {currentUser ? (
            <div className="relative">
              <button
                id="btn-user-profile"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-50 border border-slate-200 text-xs transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-[11px] font-semibold text-slate-800 leading-tight">
                    {currentUser.username}
                  </div>
                </div>
                {roleInfo && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${roleInfo.className}`}>
                    {roleInfo.label}
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-white border border-slate-200 shadow-xl p-3 z-50 text-xs space-y-2.5">
                  <div className="border-b border-slate-800 pb-2">
                    <div className="font-bold text-slate-900">{currentUser.displayName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Role: {currentUser.role}</div>
                    {roleInfo && (
                      <div className="text-[10px] text-indigo-300 mt-1 bg-blue-50 p-1.5 rounded border border-blue-200">
                        {roleInfo.title}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenLogin();
                      }}
                      className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t.switchUser}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t.logout}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{t.login}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2 scrollbar-none">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-${tab.id}`}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : theme === 'light'
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
