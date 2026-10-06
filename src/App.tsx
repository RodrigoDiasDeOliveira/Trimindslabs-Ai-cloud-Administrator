import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { AgentConsoleView } from './components/AgentConsoleView';
import { ResourceExplorerView } from './components/ResourceExplorerView';
import { GovernanceView } from './components/GovernanceView';
import { AuditLedgerView } from './components/AuditLedgerView';
import { CloudSettingsView } from './components/CloudSettingsView';
import { IacCloudStudioView } from './components/IacCloudStudioView';
import { LoginModal } from './components/LoginModal';
import { AddCloudModal } from './components/AddCloudModal';
import { 
  CloudResource, 
  ProviderStatus, 
  AuditLog, 
  GovernanceData, 
  ChatMessage,
  AppTheme,
  AuthUser
} from './types';
import { Language, translations } from './i18n';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [backendMode, setBackendMode] = useState<'embedded' | 'springboot'>('embedded');

  // Theme: dark | midnight | light
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('multicloud_theme') as AppTheme) || 'light';
  });

  // Language: pt | en | es
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('multicloud_lang') as Language) || 'pt';
  });

  // Current User / RBAC
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('multicloud_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  // Modal States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isAddCloudModalOpen, setIsAddCloudModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'warning' | 'info'; text: string } | null>(null);

  // App Data State
  const [resources, setResources] = useState<CloudResource[]>([]);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [governance, setGovernance] = useState<GovernanceData>({
    complianceScore: 0,
    totalMonthlyEstimate: '0.00',
    activeCloudCount: 0,
    totalResources: 0,
    policies: [],
    costOptimizationRecommendations: []
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'agent',
      text: `👋 Olá! Sou o **AI MultiCloud Agent (Enterprise Ready)**.\n\nPosso analisar inventário, governança e operações de nuvem. A execução real depende dos adapters e credenciais configurados; provedores sem adapter permanecem como **NOT_CONFIGURED**.\n\nVocê pode me pedir para auditar recursos, estimar custos, checar políticas ou operar instâncias em linguagem natural. Experimente um dos atalhos rápidos ou digite seu comando abaixo.`,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS'
    }
  ]);

  const [isAgentLoading, setIsAgentLoading] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Save theme to localStorage
  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    localStorage.setItem('multicloud_theme', newTheme);
  };

  // Save language to localStorage
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem('multicloud_lang', newLang);
  };

  // User Login Success
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    localStorage.setItem('multicloud_user', JSON.stringify(user));
    const t = translations[language];
    setNotification({
      type: 'success',
      text: `${t.loginSuccess}: ${user.displayName} (${user.role.replace('ROLE_', '')})`
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // User Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('multicloud_user');
    setNotification({
      type: 'info',
      text: language === 'pt' ? 'Sessão encerrada com sucesso.' : 'Logged out successfully.'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (!currentUser?.token) return;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${currentUser.token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error('Session expired');
        const verified = await res.json();
        setCurrentUser((prev) => prev ? { ...prev, ...verified } : prev);
      })
      .catch(() => {
        setCurrentUser(null);
        localStorage.removeItem('multicloud_user');
      });
  }, []);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const headers: Record<string, string> = {};
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }

      const [provRes, resRes, auditRes, govRes] = await Promise.all([
        fetch('/api/providers/status', { headers }),
        fetch('/api/resources', { headers }),
        fetch('/api/audit', { headers }),
        fetch('/api/governance', { headers })
      ]);

      if (provRes.ok) setProviders(await provRes.json());
      if (resRes.ok) setResources(await resRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
      if (govRes.ok) setGovernance(await govRes.json());
    } catch (err) {
      console.error('Failed to fetch multi-cloud data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Handle Cloud Added successfully
  const handleCloudAdded = async () => {
    await fetchData();
    const t = translations[language];
    setNotification({
      type: 'success',
      text: t.cloudAddedSuccess
    });
    setTimeout(() => setNotification(null), 5000);
  };

  // Send message to Agent
  const handleSendMessage = async (prompt: string, autoApprove: boolean) => {
    const userMsgId = `user-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsAgentLoading(true);

    try {
      const endpoint = backendMode === 'embedded' 
        ? '/api/agent/chat' 
        : 'http://localhost:8080/api/v1/agent/chat';

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          prompt, 
          autoApproveSafeActions: autoApprove,
          userRole: currentUser?.role || 'ROLE_OBSERVER'
        })
      });

      const data = await response.json();

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: data.reply,
        timestamp: new Date().toISOString(),
        status: data.status,
        invokedTools: data.invokedTools,
        blastRadius: data.blastRadius
      };

      setMessages((prev) => [...prev, agentMsg]);
      fetchData();
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: `❌ Falha na comunicação com o backend (${backendMode}): ${err.message || 'Verifique se o serviço está ativo.'}`,
        timestamp: new Date().toISOString(),
        status: 'FAILED'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAgentLoading(false);
    }
  };

  // Approve Blast Radius Action
  const handleApproveAction = async (messageId: string, blastRadius: any) => {
    if (currentUser?.role === 'ROLE_OBSERVER') {
      const t = translations[language];
      setNotification({
        type: 'warning',
        text: t.observerRestriction
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    setIsAgentLoading(true);
    try {
      const endpoint = backendMode === 'embedded'
        ? '/api/agent/execute'
        : 'http://localhost:8080/api/v1/agent/execute';

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          toolName: 'execute_approved_action',
          provider: 'AWS',
          resourceId: blastRadius.targetResourceId,
          action: blastRadius.suggestedAction || 'STOP',
          parameters: { confirmationToken: blastRadius.confirmationToken },
          userRole: currentUser?.role || 'ROLE_ADMIN'
        })
      });

      const data = await response.json();
      const succeeded = response.ok && data.executionPerformed === true && data.status === 'SUCCESS';

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, status: succeeded ? 'SUCCESS' : 'FAILED' } : m
        )
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `agent-exec-${Date.now()}`,
          sender: 'agent',
          text: data.reply || data.message || 'Operação não executada.',
          timestamp: new Date().toISOString(),
          status: succeeded ? 'SUCCESS' : 'FAILED',
          invokedTools: data.invokedTools
        }
      ]);

      if (succeeded) fetchData();
    } catch (err: any) {
      console.error('Error executing approved action:', err);
    } finally {
      setIsAgentLoading(false);
    }
  };

  // Reject Action
  const handleRejectAction = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              status: 'FAILED',
              text: m.text + (language === 'pt' ? '\n\n*(Operação cancelada pelo operador)*' : '\n\n*(Operation cancelled by operator)*')
            }
          : m
      )
    );
  };

  // Perform Direct Resource Action
  const handlePerformResourceAction = async (resourceId: string, action: string) => {
    if (currentUser?.role === 'ROLE_OBSERVER') {
      const t = translations[language];
      setNotification({
        type: 'warning',
        text: t.observerRestriction
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    setIsActionLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }

      const res = await fetch(`/api/resources/${resourceId}/action`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action, userRole: currentUser?.role })
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to perform resource action:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Theme container classes
  const themeContainerClass = 'bg-slate-50 text-slate-950';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${themeContainerClass}`}>
      {/* Global Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in shadow-xl">
          <div className="p-3 rounded-lg border flex items-center justify-between space-x-3 bg-white border-slate-200 text-slate-900">
            <div className="flex items-center space-x-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              )}
              <span className="text-xs font-semibold">{notification.text}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
              {/* Top Application Header */}
      <Header
        providers={providers}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        activeCloudCount={providers.filter((p) => p.status === 'CONNECTED').length}
        backendMode={backendMode}
        theme={theme}
        onThemeChange={handleThemeChange}
        language={language}
        onLanguageChange={handleLanguageChange}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenAddCloud={() => setIsAddCloudModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            resources={resources}
            providers={providers}
            auditLogs={auditLogs}
            onTriggerAgentPrompt={(prompt) => {
              setCurrentTab('agent');
              handleSendMessage(prompt, false);
            }}
            onNavigateToResources={() => setCurrentTab('resources')}
            onOpenAddCloud={() => setIsAddCloudModalOpen(true)}
            theme={theme}
            language={language}
          />
        )}

        {currentTab === 'agent' && (
          <AgentConsoleView
            messages={messages}
            onSendMessage={handleSendMessage}
            onApproveAction={handleApproveAction}
            onRejectAction={handleRejectAction}
            onClearHistory={() => setMessages([])}
            isLoading={isAgentLoading}
            theme={theme}
            language={language}
            currentUser={currentUser}
          />
        )}

        {currentTab === 'resources' && (
          <ResourceExplorerView
            resources={resources}
            onPerformAction={handlePerformResourceAction}
            isActionLoading={isActionLoading}
            theme={theme}
            language={language}
            currentUser={currentUser}
          />
        )}

        {currentTab === 'iac' && (
          <IacCloudStudioView
            theme={theme}
            language={language}
            currentUser={currentUser}
            onRefreshData={fetchData}
          />
        )}

        {currentTab === 'governance' && (
          <GovernanceView
            governance={governance}
            resources={resources}
            theme={theme}
            language={language}
          />
        )}

        {currentTab === 'audit' && (
          <AuditLedgerView
            auditLogs={auditLogs}
            theme={theme}
            language={language}
          />
        )}

        {currentTab === 'settings' && (
          <CloudSettingsView
            providers={providers}
            backendMode={backendMode}
            onToggleBackendMode={() =>
              setBackendMode((prev) => (prev === 'embedded' ? 'springboot' : 'embedded'))
            }
            theme={theme}
            language={language}
            currentUser={currentUser}
            onOpenAddCloud={() => setIsAddCloudModalOpen(true)}
          />
        )}
      </main>

      {/* Login / Switch User Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentLanguage={language}
        theme={theme}
      />

      {/* Add Cloud Provider Modal */}
      <AddCloudModal
        isOpen={isAddCloudModalOpen}
        onClose={() => setIsAddCloudModalOpen(false)}
        onCloudAdded={handleCloudAdded}
        language={language}
      />
    </div>
  );
}
