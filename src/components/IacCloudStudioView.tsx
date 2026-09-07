import React, { useState, useEffect } from 'react';
import { 
  Code2, 
  Play, 
  ShieldCheck, 
  CloudUpload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Plus, 
  Copy, 
  Download, 
  Sparkles,
  Database,
  Lock,
  Layers,
  Archive,
  Clock,
  ArrowRight,
  Eye,
  Sliders
} from 'lucide-react';
import { AppTheme, AuthUser, CloudProvider, IacFile, BackupTask, PolicyViolation } from '../types';
import { Language, translations } from '../i18n';

interface IacCloudStudioViewProps {
  theme: AppTheme;
  language: Language;
  currentUser: AuthUser | null;
  onRefreshData?: () => void;
}

export const IacCloudStudioView: React.FC<IacCloudStudioViewProps> = ({
  theme,
  language,
  currentUser,
  onRefreshData
}) => {
  const t = translations[language];

  // Studio Subtabs: 'iac' (Create/Adjust/Deploy) or 'dr' (Disaster Recovery & Backups)
  const [activeStudioTab, setActiveStudioTab] = useState<'iac' | 'dr'>('iac');

  // IaC Files State
  const [iacFiles, setIacFiles] = useState<IacFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('iac-aws-ec2');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileProvider, setFileProvider] = useState<CloudProvider>('AWS');
  const [fileType, setFileType] = useState<'terraform' | 'json' | 'yaml'>('terraform');

  // Quick Parameter adjustments for the template
  const [instanceType, setInstanceType] = useState<string>('t3.large');
  const [region, setRegion] = useState<string>('us-east-1');
  const [enableKms, setEnableKms] = useState<boolean>(true);
  const [allowOpenSsh, setAllowOpenSsh] = useState<boolean>(false);

  // Status & Actions
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<{
    allowed: boolean;
    violations: PolicyViolation[];
    complianceScore: number;
  } | null>(null);
  const [dryRunResult, setDryRunResult] = useState<{
    diff: string;
    estimatedCost: number;
    riskLevel: string;
  } | null>(null);
  const [deployResult, setDeployResult] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  // Backup & DR State
  const [backups, setBackups] = useState<BackupTask[]>([]);
  const [backupMetrics, setBackupMetrics] = useState<any>(null);
  const [isOperatingBackup, setIsOperatingBackup] = useState<boolean>(false);

  // Executive Report Modal
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportContent, setReportContent] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  // Load initial IaC files and Backups
  const loadStudioData = async () => {
    try {
      const headers: Record<string, string> = {};
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }

      const [iacRes, drRes] = await Promise.all([
        fetch('/api/iac/templates', { headers }),
        fetch('/api/backups', { headers })
      ]);

      if (iacRes.ok) {
        const files: IacFile[] = await iacRes.json();
        setIacFiles(files);
        if (files.length > 0) {
          const current = files.find(f => f.id === selectedFileId) || files[0];
          setSelectedFileId(current.id);
          setFileContent(current.content);
          setFileName(current.name);
          setFileProvider(current.provider);
          setFileType(current.type);
        }
      }

      if (drRes.ok) {
        const drData = await drRes.json();
        setBackups(drData.tasks || []);
        setBackupMetrics(drData.slaMetrics || null);
      }
    } catch (err) {
      console.error('Failed to load IaC Studio data:', err);
    }
  };

  useEffect(() => {
    loadStudioData();
  }, [currentUser]);

  // Handle template selection
  const handleSelectTemplate = (file: IacFile) => {
    setSelectedFileId(file.id);
    setFileContent(file.content);
    setFileName(file.name);
    setFileProvider(file.provider);
    setFileType(file.type);
    setValidationResult(null);
    setDryRunResult(null);
    setDeployResult(null);
  };

  // Quick adjust parameters updates code
  const handleApplyParameterAdjustment = (type: string, reg: string, kms: boolean, openSsh: boolean) => {
    setInstanceType(type);
    setRegion(reg);
    setEnableKms(kms);
    setAllowOpenSsh(openSsh);

    let updated = fileContent;
    // Replace instance type
    updated = updated.replace(/instance_type\s*=\s*"[^"]+"/g, `instance_type = "${type}"`);
    updated = updated.replace(/vmSize":\s*"[^"]+"/g, `vmSize": "${type}"`);
    // Replace region
    updated = updated.replace(/region\s*=\s*"[^"]+"/g, `region = "${reg}"`);
    updated = updated.replace(/location":\s*"[^"]+"/g, `location": "${reg}"`);
    
    // Adjust KMS
    if (kms) {
      if (!updated.includes('kms_key_id') && updated.includes('aws_s3_bucket')) {
        updated = updated.replace('resource "aws_s3_bucket" "data_lake" {', 'resource "aws_s3_bucket" "data_lake" {\n  server_side_encryption_configuration {\n    rule {\n      apply_server_side_encryption_by_default {\n        kms_master_key_id = "arn:aws:kms:us-east-1:850635235673:key/mrk-99128"\n        sse_algorithm     = "aws:kms"\n      }\n    }\n  }');
      }
    } else {
      updated = updated.replace(/server_side_encryption_configuration\s*\{[\s\S]*?\}\s*\}/g, '');
    }

    // Adjust SSH Open 0.0.0.0/0
    if (openSsh) {
      if (!updated.includes('cidr_blocks = ["0.0.0.0/0"]')) {
        updated += `\n\n# Security Group com porta 22 aberta para teste de políticas OPA\nresource "aws_security_group" "allow_ssh_insecure" {\n  name        = "allow_all_ssh"\n  ingress {\n    from_port   = 22\n    to_port     = 22\n    protocol    = "tcp"\n    cidr_blocks = ["0.0.0.0/0"]\n  }\n}`;
      }
    } else {
      updated = updated.replace(/# Security Group com porta 22[\s\S]*?cidr_blocks = \["0.0.0.0\/0"\]\s*\}\s*\}/g, '');
    }

    setFileContent(updated);
  };

  // Run OPA Policy Validation
  const handleValidateOpa = async () => {
    setIsValidating(true);
    setValidationResult(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }

      const res = await fetch('/api/iac/validate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          provider: fileProvider,
          content: fileContent,
          fileName
        })
      });

      const data = await res.json();
      setValidationResult(data);
      if (data.allowed) {
        setStatusMessage({ type: 'success', text: 'Código aprovado pelo motor OPA (Zero violações críticas).' });
      } else {
        setStatusMessage({ type: 'error', text: `Bloqueado por ${data.violations.length} regra(s) do Open Policy Agent (OPA).` });
      }
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Validation failed:', err);
    } finally {
      setIsValidating(false);
    }
  };

  // Run Dry-Run Simulation
  const handleDryRun = async () => {
    setIsSimulating(true);
    setDryRunResult(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }

      const res = await fetch('/api/iac/dry-run', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          provider: fileProvider,
          content: fileContent,
          fileName
        })
      });

      const data = await res.json();
      setDryRunResult({
        diff: data.dryRunDiff,
        estimatedCost: data.estimatedCostImpact,
        riskLevel: data.riskLevel
      });
      setStatusMessage({ type: 'success', text: 'Simulação de impacto (Dry-Run Plan) calculada com sucesso.' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Dry-run failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Deploy / Subir para Nuvem
  const handleDeployToCloud = async () => {
    if (currentUser?.role === 'ROLE_OBSERVER') {
      setStatusMessage({ type: 'warning', text: 'Usuários com perfil Observer não possuem permissão para implantar na nuvem.' });
      setTimeout(() => setStatusMessage(null), 4000);
      return;
    }

    setIsDeploying(true);
    setDeployResult(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }

      const res = await fetch('/api/iac/deploy', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          provider: fileProvider,
          content: fileContent,
          fileName,
          userRole: currentUser?.role || 'ROLE_ADMIN'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDeployResult(`🚀 Sucesso! Infraestrutura provisionada na nuvem ${fileProvider}. Recurso: ${data.deployedResource?.name} (${data.deployedResource?.resourceType}). Trilha de Auditoria: ${data.auditSignature?.substring(0, 16)}...`);
        setStatusMessage({ type: 'success', text: 'Configuração subida para a nuvem e adicionada ao inventário!' });
        if (onRefreshData) onRefreshData();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Falha ao subir para a nuvem.' });
      }
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      console.error('Deploy failed:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Erro de conexão no deploy.' });
    } finally {
      setIsDeploying(false);
    }
  };

  // Run Immediate Backup Task
  const handleRunImmediateBackup = async (taskId: string) => {
    setIsOperatingBackup(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }

      const res = await fetch(`/api/backups/${taskId}/run-now`, {
        method: 'POST',
        headers
      });

      if (res.ok) {
        await loadStudioData();
        setStatusMessage({ type: 'success', text: 'Backup imediato concluído com replicação multi-cloud e hash SHA-256 verificado!' });
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err) {
      console.error('Backup run failed:', err);
    } finally {
      setIsOperatingBackup(false);
    }
  };

  // Run DR Restore Drill
  const handleRunDrill = async (taskId: string) => {
    setIsOperatingBackup(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }

      const res = await fetch(`/api/backups/${taskId}/drill-test`, {
        method: 'POST',
        headers
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ 
          type: 'success', 
          text: `Teste de Restauração (Drill DR) concluído com sucesso! RTO atingido: ${data.rtoAchievedMinutes}min (SLA: ${data.slaRtoMinutes}min).` 
        });
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (err) {
      console.error('DR drill failed:', err);
    } finally {
      setIsOperatingBackup(false);
    }
  };

  // Generate Executive Report
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const headers: Record<string, string> = {};
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }

      const res = await fetch('/api/reports/executive', { headers });
      const data = await res.json();
      if (res.ok) {
        setReportContent(data.markdownReport);
        setShowReportModal(true);
      }
    } catch (err) {
      console.error('Failed to generate executive report:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Styles
  const cardBg = theme === 'light'
    ? 'bg-white border-slate-200 shadow-sm'
    : theme === 'midnight'
    ? 'bg-slate-900/90 border-indigo-950/70'
    : 'bg-slate-900 border-slate-800';

  const subCardBg = theme === 'light'
    ? 'bg-slate-50 border-slate-200'
    : theme === 'midnight'
    ? 'bg-slate-950/70 border-indigo-950/50'
    : 'bg-slate-950 border-slate-800';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner: Studio Switcher & Action Bar */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${cardBg}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight flex items-center space-x-2">
              <span>IaC & Nuvem Studio</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                OPA Gatekeeper Ativo
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Crie, ajuste e suba para a nuvem (Terraform, YAML, JSON) com proteção contra blast radius e políticas de conformidade.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 flex-wrap text-xs">
          {/* Studio Tab Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <button
              onClick={() => setActiveStudioTab('iac')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeStudioTab === 'iac'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Configuração & Deploy Nuvem
            </button>
            <button
              onClick={() => setActiveStudioTab('dr')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeStudioTab === 'dr'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Backup & Disaster Recovery (DR)
            </button>
          </div>

          {/* Executive Report Button */}
          <button
            id="btn-generate-report"
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
            title="Gerar e baixar relatório executivo consolidado"
          >
            {isGeneratingReport ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>{t.btnExecutiveReport}</span>
          </button>
        </div>
      </div>

      {/* Global Status Toast */}
      {statusMessage && (
        <div className={`p-3 rounded-xl border flex items-center space-x-2 text-xs font-semibold ${
          statusMessage.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
            : statusMessage.type === 'warning'
            ? 'bg-amber-950/80 border-amber-600 text-amber-200'
            : 'bg-rose-950/80 border-rose-600 text-rose-200'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* VIEW 1: IAC & CLOUD DEPLOY STUDIO */}
      {activeStudioTab === 'iac' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Template Selection & Live Parameter Sliders (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Templates Card */}
            <div className={`p-4 rounded-2xl border ${cardBg}`}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                <span>Modelos de Infraestrutura</span>
                <span className="text-[11px] text-indigo-400">{iacFiles.length} disponíveis</span>
              </h3>

              <div className="space-y-2">
                {iacFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => handleSelectTemplate(file)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                      selectedFileId === file.id
                        ? 'bg-indigo-600/20 border-indigo-500/60 shadow-sm'
                        : `${subCardBg} hover:border-slate-600`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-200">{file.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {file.provider}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span className="capitalize">{file.type}</span>
                      <span className={`font-semibold ${file.status === 'DEPLOYED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {file.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Parameter Adjuster Card */}
            <div className={`p-4 rounded-2xl border ${cardBg} space-y-3`}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ajustar Configurações Rápidas</span>
              </h3>

              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">Tipo de Instância (Compute)</label>
                <select
                  value={instanceType}
                  onChange={(e) => handleApplyParameterAdjustment(e.target.value, region, enableKms, allowOpenSsh)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="t3.large">AWS: t3.large (2 vCPU, 8 GB RAM)</option>
                  <option value="m5.xlarge">AWS: m5.xlarge (4 vCPU, 16 GB RAM)</option>
                  <option value="Standard_D2s_v5">Azure: Standard_D2s_v5</option>
                  <option value="e2-standard-4">GCP: e2-standard-4</option>
                  <option value="VM.Standard.A1.Flex">OCI: VM.Standard.A1.Flex (ARM64)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">Região de Implantação</label>
                <select
                  value={region}
                  onChange={(e) => handleApplyParameterAdjustment(instanceType, e.target.value, enableKms, allowOpenSsh)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="us-east-1">us-east-1 (N. Virginia)</option>
                  <option value="sa-east-1">sa-east-1 (São Paulo)</option>
                  <option value="eastus">eastus (Azure)</option>
                  <option value="us-central1">us-central1 (GCP)</option>
                  <option value="sa-saopaulo-1">sa-saopaulo-1 (OCI)</option>
                </select>
              </div>

              {/* Security & OPA switches */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Criptografia KMS Mandatória</span>
                  <input
                    type="checkbox"
                    checked={enableKms}
                    onChange={(e) => handleApplyParameterAdjustment(instanceType, region, e.target.checked, allowOpenSsh)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span className="text-rose-300">Permitir SSH Inseguro (0.0.0.0/0)</span>
                  <input
                    type="checkbox"
                    checked={allowOpenSsh}
                    onChange={(e) => handleApplyParameterAdjustment(instanceType, region, enableKms, e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                </label>
                <p className="text-[10px] text-slate-500">
                  Marcar SSH 0.0.0.0/0 provocará bloqueio imediato pela política OPA-SEC-001.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Code Editor & Execution Actions (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className={`p-4 rounded-2xl border ${cardBg} flex flex-col space-y-3`}>
              {/* Editor Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-slate-200">{fileName}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/60">
                    {fileProvider}
                  </span>
                </div>

                {/* Studio Buttons */}
                <div className="flex items-center space-x-2">
                  {/* 1. Validar OPA */}
                  <button
                    onClick={handleValidateOpa}
                    disabled={isValidating}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <ShieldCheck className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
                    <span>Validar OPA</span>
                  </button>

                  {/* 2. Dry-Run Plan */}
                  <button
                    onClick={handleDryRun}
                    disabled={isSimulating}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                    <span>Simulação Dry-Run</span>
                  </button>

                  {/* 3. Subir para Nuvem (Deploy) */}
                  <button
                    id="btn-deploy-cloud"
                    onClick={handleDeployToCloud}
                    disabled={isDeploying || (validationResult && !validationResult.allowed)}
                    className="flex items-center space-x-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CloudUpload className={`w-3.5 h-3.5 ${isDeploying ? 'animate-bounce' : ''}`} />
                    <span>Subir para Nuvem</span>
                  </button>
                </div>
              </div>

              {/* Code Area */}
              <div className="relative">
                <textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  rows={14}
                  className="w-full bg-slate-950 text-slate-100 font-mono text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
                  spellCheck={false}
                />
              </div>

              {/* Validation or Dry-run Feedback Panels */}
              {validationResult && (
                <div className={`p-3 rounded-xl border text-xs ${
                  validationResult.allowed
                    ? 'bg-emerald-950/40 border-emerald-600 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-600 text-rose-200'
                }`}>
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center space-x-1.5">
                      {validationResult.allowed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <span>Avaliação de Políticas OPA: Score {validationResult.complianceScore}%</span>
                    </span>
                    <span>{validationResult.allowed ? 'APROVADO' : 'BLOQUEADO'}</span>
                  </div>

                  {validationResult.violations.length > 0 ? (
                    <div className="space-y-1 mt-2">
                      {validationResult.violations.map((v, i) => (
                        <div key={i} className="p-2 rounded bg-slate-950/60 border border-rose-900/60 flex items-start space-x-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-900 text-rose-200">
                            {v.policyId}
                          </span>
                          <div>
                            <p className="font-semibold text-rose-300">{v.policyName}</p>
                            <p className="text-slate-400 text-[11px]">{v.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-emerald-300 text-[11px]">
                      Todas as políticas de conformidade (KMS, restrição de portas SSH/RDP e privilégios) foram satisfeitas.
                    </p>
                  )}
                </div>
              )}

              {/* Dry-run diff output */}
              {dryRunResult && (
                <div className="p-3 rounded-xl border border-blue-600 bg-blue-950/30 text-xs text-blue-200 space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span>Resultado da Simulação Dry-Run (Terraform Plan)</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-blue-900 text-blue-200">
                      Risco: {dryRunResult.riskLevel} • Custo: +${dryRunResult.estimatedCost}/mês
                    </span>
                  </div>
                  <pre className="font-mono text-[11px] bg-slate-950 p-2.5 rounded-lg text-slate-300 overflow-x-auto whitespace-pre-wrap">
                    {dryRunResult.diff}
                  </pre>
                </div>
              )}

              {/* Deployment Success Output */}
              {deployResult && (
                <div className="p-3 rounded-xl border border-emerald-600 bg-emerald-950/40 text-xs text-emerald-200">
                  <p className="font-semibold">{deployResult}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MULTI-CLOUD BACKUP & DISASTER RECOVERY (DR) */}
      {activeStudioTab === 'dr' && (
        <div className="space-y-6">
          {/* SLA Metric Cards */}
          {backupMetrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-4 rounded-2xl border ${cardBg}`}>
                <p className="text-xs text-slate-400 font-medium">Tarefas Ativas de Backup</p>
                <p className="text-xl font-bold mt-1 text-indigo-400">{backupMetrics.totalJobs}</p>
                <p className="text-[10px] text-slate-500 mt-1">Cross-Cloud: AWS ⇄ Azure ⇄ GCP ⇄ OCI</p>
              </div>

              <div className={`p-4 rounded-2xl border ${cardBg}`}>
                <p className="text-xs text-slate-400 font-medium">RPO Médio (Recuperação de Dados)</p>
                <p className="text-xl font-bold mt-1 text-emerald-400">{backupMetrics.averageRpoHours} horas</p>
                <p className="text-[10px] text-slate-500 mt-1">Limite SLA corporativo: 4 horas</p>
              </div>

              <div className={`p-4 rounded-2xl border ${cardBg}`}>
                <p className="text-xs text-slate-400 font-medium">RTO Médio (Tempo de Retorno)</p>
                <p className="text-xl font-bold mt-1 text-blue-400">{backupMetrics.averageRtoMinutes} minutos</p>
                <p className="text-[10px] text-slate-500 mt-1">Objetivo de restauração operacional</p>
              </div>

              <div className={`p-4 rounded-2xl border ${cardBg}`}>
                <p className="text-xs text-slate-400 font-medium">Conformidade SLA & Integridade</p>
                <p className="text-xl font-bold mt-1 text-emerald-400">{backupMetrics.slaCompliancePercent}%</p>
                <p className="text-[10px] text-slate-500 mt-1">Hashes SHA-256 validados em 100%</p>
              </div>
            </div>
          )}

          {/* Backup Jobs Table */}
          <div className={`p-5 rounded-2xl border ${cardBg} space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span>Matriz de Backup e Replicação Cruzada Multi-Cloud</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Snapshots e volumes replicados automaticamente entre provedores distintos para resiliência contra indisponibilidade de zona.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="py-2.5 px-3">Tarefa / Recurso</th>
                    <th className="py-2.5 px-3">Origem ➔ Destino</th>
                    <th className="py-2.5 px-3">Tamanho</th>
                    <th className="py-2.5 px-3">RPO / RTO</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Ações DR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {backups.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-200">{b.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{b.resourceName}</p>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1.5 font-semibold text-slate-300">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">{b.sourceProvider}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60">
                            {b.targetProvider}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-300 font-mono">
                        {b.sizeGb} GB
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-slate-200">{b.rpoHours}h RPO</span> • <span className="text-indigo-400">{b.rtoMinutes}m RTO</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                          {b.status}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleRunImmediateBackup(b.id)}
                            disabled={isOperatingBackup}
                            className="px-2.5 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Disparar cópia e replicação imediata"
                          >
                            Backup Agora
                          </button>
                          <button
                            onClick={() => handleRunDrill(b.id)}
                            disabled={isOperatingBackup}
                            className="px-2.5 py-1 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Executar drill de restauração sem parar o workload"
                          >
                            Drill DR
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EXECUTIVE REPORT PREVIEW MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`max-w-3xl w-full rounded-2xl border p-6 max-h-[85vh] flex flex-col space-y-4 shadow-2xl ${cardBg}`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-slate-100">Relatório Executivo Multi-Cloud</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {reportContent}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  const blob = new Blob([reportContent], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `relatorio-executivo-multicloud-${new Date().toISOString().slice(0, 10)}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Markdown (.md)</span>
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
