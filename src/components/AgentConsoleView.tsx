import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Cpu, 
  Terminal, 
  Trash2, 
  ShieldAlert, 
  Check, 
  X,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { ChatMessage, ToolCall, AppTheme, AuthUser } from '../types';
import { Language, translations } from '../i18n';

interface AgentConsoleViewProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string, autoApprove: boolean) => Promise<void>;
  onApproveAction: (messageId: string, blastRadius: any) => Promise<void>;
  onRejectAction: (messageId: string) => void;
  onClearHistory: () => void;
  isLoading: boolean;
  theme: AppTheme;
  language: Language;
  currentUser: AuthUser | null;
}

export const AgentConsoleView: React.FC<AgentConsoleViewProps> = ({
  messages,
  onSendMessage,
  onApproveAction,
  onRejectAction,
  onClearHistory,
  isLoading,
  theme,
  language,
  currentUser
}) => {
  const t = translations[language];
  const [inputPrompt, setInputPrompt] = useState('');
  const [autoApproveSafe, setAutoApproveSafe] = useState(false);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;
    const prompt = inputPrompt;
    setInputPrompt('');
    onSendMessage(prompt, autoApproveSafe);
  };

  const handleApprove = (messageId: string, blastRadius: any) => {
    if (currentUser?.role === 'ROLE_OBSERVER') {
      setPermissionNotice(t.observerRestriction);
      setTimeout(() => setPermissionNotice(null), 4000);
      return;
    }
    onApproveAction(messageId, blastRadius);
  };

  const examplePrompts = [
    language === 'pt' ? 'Liste todos os buckets S3 e políticas em AWS' : 'List all S3 buckets and policies in AWS',
    language === 'pt' ? 'Mostre as máquinas virtuais em AWS, Azure, GCP e OCI' : 'Display VMs across AWS, Azure, GCP and OCI',
    language === 'pt' ? 'Qual a previsão de custos mensais consolidada das 4 clouds?' : 'What is the consolidated monthly cost forecast across clouds?',
    language === 'pt' ? 'Pare a instância prod-api-cluster-node-01 na AWS (Testar Blast Radius)' : 'Stop instance prod-api-cluster-node-01 on AWS (Test Blast Radius)',
  ];

  const cardClass = theme === 'light'
    ? 'bg-white border-slate-200 text-slate-900'
    : theme === 'midnight'
    ? 'bg-slate-900 border-indigo-950/70 text-white'
    : 'bg-slate-900 border-slate-800 text-white';

  const userBubbleClass = 'bg-indigo-600 text-white shadow-md';
  const agentBubbleClass = theme === 'light'
    ? 'bg-slate-100 text-slate-900 border border-slate-200 shadow-sm'
    : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 shadow-sm';

  return (
    <div className={`border rounded-xl overflow-hidden flex flex-col h-[calc(100vh-12rem)] shadow-lg ${cardClass}`}>
      {/* Console Top Header */}
      <div className={`px-5 py-3.5 border-b flex items-center justify-between border-inherit ${
        theme === 'light' ? 'bg-slate-50' : 'bg-slate-900/90'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold">AI MultiCloud Agent Console</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                Gemini 3.8 Flash Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {language === 'pt' ? 'Orquestração em linguagem natural com guardrails ADR-003' : 'Natural language cloud orchestration with ADR-003 guardrails'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoApproveSafe}
              onChange={(e) => setAutoApproveSafe(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <span className="hidden sm:inline">
              {language === 'pt' ? 'Auto-aprovar leituras seguras' : 'Auto-approve safe queries'}
            </span>
          </label>

          <button
            onClick={onClearHistory}
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Limpar histórico"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Permission Toast Notice */}
      {permissionNotice && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-950/60 border border-amber-600 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>{permissionNotice}</span>
          </div>
          <button onClick={() => setPermissionNotice(null)} className="text-amber-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Sender Label & Timestamp */}
            <div className="flex items-center space-x-2 mb-1 text-[11px] text-slate-400 px-1">
              <span className="font-semibold">
                {msg.sender === 'user' ? (currentUser ? currentUser.displayName : 'Operador') : 'AI MultiCloud Agent'}
              </span>
              <span>•</span>
              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-3xl rounded-xl p-4 text-sm leading-relaxed ${
                msg.sender === 'user' ? userBubbleClass : agentBubbleClass
              }`}
            >
              <div className="prose prose-sm max-w-none space-y-2 whitespace-pre-wrap">
                {msg.text}
              </div>

              {/* Tool Execution Badges */}
              {msg.invokedTools && msg.invokedTools.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-700/60 space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs text-indigo-400 font-semibold">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Ferramenta(s) Invocada(s):</span>
                  </div>
                  <div className="space-y-1.5">
                    {msg.invokedTools.map((tool: ToolCall, idx: number) => (
                      <div
                        key={idx}
                        className="flex flex-wrap items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-700/80 text-xs gap-2"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-emerald-400 font-semibold">{tool.toolName}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium border border-slate-700">
                            {tool.provider}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
                          {tool.latencyMs && <span>{tool.latencyMs}ms</span>}
                          <span className="flex items-center text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Sucesso
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BLAST RADIUS & HUMAN-IN-THE-LOOP APPROVAL CARD */}
              {msg.status === 'AWAITING_APPROVAL' && msg.blastRadius && (
                <div className="mt-4 p-4 rounded-lg bg-rose-950/40 border border-rose-600/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 text-rose-400">
                      <ShieldAlert className="w-5 h-5 flex-shrink-0 animate-bounce" />
                      <span className="font-bold text-sm">{t.blastRadiusTitle}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-rose-900 text-rose-200 text-[11px] font-bold border border-rose-500">
                      RISCO: {msg.blastRadius.riskLevel}
                    </span>
                  </div>

                  <p className="text-xs text-rose-200/90 leading-relaxed">
                    {msg.blastRadius.description}
                  </p>

                  <div className="bg-slate-950/90 p-2.5 rounded border border-rose-900/60 text-xs">
                    <span className="text-slate-400 block font-medium mb-1">Recurso(s) Afetado(s):</span>
                    {msg.blastRadius.affectedResources.map((res: string, i: number) => (
                      <div key={i} className="font-mono text-amber-300 text-[11px] break-all">
                        • {res}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      onClick={() => handleApprove(msg.id, msg.blastRadius)}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-white text-xs font-semibold shadow-md transition-colors cursor-pointer ${
                        currentUser?.role === 'ROLE_OBSERVER'
                          ? 'bg-slate-700 opacity-60 cursor-not-allowed'
                          : 'bg-rose-600 hover:bg-rose-500'
                      }`}
                      title={currentUser?.role === 'ROLE_OBSERVER' ? t.observerRestriction : t.btnApproveBlastRadius}
                    >
                      {currentUser?.role === 'ROLE_OBSERVER' ? <Lock className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                      <span>{t.btnApproveBlastRadius}</span>
                    </button>
                    <button
                      onClick={() => onRejectAction(msg.id)}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{t.btnCancelBlastRadius}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Spinner Indicator */}
        {isLoading && (
          <div className="flex flex-col items-start space-y-1">
            <span className="text-[11px] text-slate-400 px-1">AI MultiCloud Agent</span>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center space-x-3">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></div>
              <span className="text-xs text-slate-300 font-medium">
                {language === 'pt' ? 'Analisando infraestrutura multi-cloud e calculando políticas...' : 'Analyzing multi-cloud infrastructure and policies...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Example Prompt Pills */}
      <div className={`px-4 py-2 border-t border-inherit overflow-x-auto ${
        theme === 'light' ? 'bg-slate-50' : 'bg-slate-900/60'
      }`}>
        <div className="flex items-center space-x-2 whitespace-nowrap">
          <span className="text-[11px] font-semibold text-slate-400">Sugestões:</span>
          {examplePrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => setInputPrompt(p)}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className={`p-4 border-t border-inherit ${
        theme === 'light' ? 'bg-white' : 'bg-slate-900'
      }`}>
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            placeholder={
              language === 'pt'
                ? 'Solicite uma ação ou auditoria (ex: "Liste todos os buckets S3", "Pare a VM node-01")...'
                : 'Prompt the agent for actions or audits (e.g. "List all S3 buckets", "Stop VM node-01")...'
            }
            className={`flex-1 rounded-xl px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 border ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-300 text-slate-900'
                : 'bg-slate-800 border-slate-700 text-white'
            }`}
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold shadow-md transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <span>{language === 'pt' ? 'Enviar' : 'Send'}</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
