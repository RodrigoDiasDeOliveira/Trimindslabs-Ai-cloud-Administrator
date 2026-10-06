import React, { useState } from 'react';
import { 
  Cloud, 
  Server, 
  Database, 
  HardDrive, 
  Cpu, 
  Shield, 
  Network, 
  Plus, 
  Check, 
  X, 
  AlertCircle,
  Key,
  Globe,
  Sliders
} from 'lucide-react';
import { AppTheme, CloudResource } from '../types';
import { Language, translations } from '../i18n';

interface AddCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloudAdded: (provider?: any, addedResources?: number) => void;
  language?: Language;
  currentLanguage?: Language;
  theme?: AppTheme;
}

export const AddCloudModal: React.FC<AddCloudModalProps> = ({
  isOpen,
  onClose,
  onCloudAdded,
  language,
  currentLanguage,
  theme = 'dark'
}) => {
  const activeLang = language || currentLanguage || 'pt';
  const t = translations[activeLang];

  const [selectedProvider, setSelectedProvider] = useState<string>('AWS');
  const [defaultRegion, setDefaultRegion] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('Corporate-Primary');

  // AWS Fields
  const [awsAccessKey, setAwsAccessKey] = useState('AKIA' + Math.random().toString(36).substring(2, 12).toUpperCase());
  const [awsSecretKey, setAwsSecretKey] = useState('wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
  const [awsAccountId, setAwsAccountId] = useState('850635235673');
  const [awsRoleArn, setAwsRoleArn] = useState('arn:aws:iam::850635235673:role/AI-MultiCloud-Agent');

  // Azure Fields
  const [azureTenantId, setAzureTenantId] = useState('72f988bf-86f1-41af-91ab-2d7cd011db47');
  const [azureClientId, setAzureClientId] = useState('3b45a234-5678-90ab-cdef-1234567890ab');
  const [azureSecret, setAzureSecret] = useState('sec~xyz9876543210azureSecretKey');
  const [azureSubId, setAzureSubId] = useState('c0a80101-1234-5678-90ab-cdef12345678');
  const [azureResourceGroup, setAzureResourceGroup] = useState('rg-enterprise-cloud-prod');

  // GCP Fields
  const [gcpProjectId, setGcpProjectId] = useState('gcp-multicloud-prod-2026');
  const [gcpServiceAccount, setGcpServiceAccount] = useState('agent-service@gcp-multicloud-prod-2026.iam.gserviceaccount.com');
  const [gcpZone, setGcpZone] = useState('');

  // OCI Fields
  const [ociTenancyOcid, setOciTenancyOcid] = useState('ocid1.tenancy.oc1..aaaaaaaaxampletenancy');
  const [ociUserOcid, setOciUserOcid] = useState('ocid1.user.oc1..aaaaaaaaxampleuser');
  const [ociFingerprint, setOciFingerprint] = useState('20:3b:97:13:55:1c:11:0d:d1:67:f0:19:e2:c1:05:db');
  const [ociCompartment, setOciCompartment] = useState('ocid1.compartment.oc1..aaaaaaaacompartment');

  // Custom / Alibaba Fields
  const [customEndpoint, setCustomEndpoint] = useState('https://api.cloud.custom-datacenter.net');

  // Resource Selection Checkboxes
  const [enableCompute, setEnableCompute] = useState(true);
  const [computeInstanceType, setComputeInstanceType] = useState('t3.large');
  const [computeInstanceName, setComputeInstanceName] = useState('');

  const [enableStorage, setEnableStorage] = useState(true);
  const [storageBucketName, setStorageBucketName] = useState('');

  const [enableDatabase, setEnableDatabase] = useState(true);
  const [databaseEngine, setDatabaseEngine] = useState('PostgreSQL 16');

  const [enableServerless, setEnableServerless] = useState(false);
  const [enableNetworking, setEnableNetworking] = useState(true);
  const [enableSecurity, setEnableSecurity] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const providersOptions = [
    { id: 'AWS', name: 'Amazon Web Services', badge: 'AWS' },
    { id: 'AZURE', name: 'Microsoft Azure', badge: 'Azure' },
    { id: 'GCP', name: 'Google Cloud Platform', badge: 'GCP' },
    { id: 'OCI', name: 'Oracle Cloud Infrastructure', badge: 'OCI' },
    { id: 'ALIBABA', name: 'Alibaba Cloud / Custom', badge: 'Alibaba' },
  ];

  const handleSelectProvider = (provId: string) => {
    setSelectedProvider(provId);
    if (provId) {
      setDefaultRegion('');
      if (provId === 'AWS') setComputeInstanceType('t3.large');
      if (provId === 'AZURE') setComputeInstanceType('Standard_D2s_v5');
      if (provId === 'GCP') setComputeInstanceType('e2-standard-4');
      if (provId === 'OCI') setComputeInstanceType('VM.Standard.A1.Flex');
      if (provId === 'ALIBABA') setComputeInstanceType('ecs.g6.large');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (!defaultRegion.trim()) {
        throw new Error('Informe a região/zona principal da nuvem antes de continuar.');
      }
      if (selectedProvider === 'GCP' && !gcpZone.trim()) {
        throw new Error('Informe a zona do GCP antes de continuar.');
      }

      // Build selected services list
      const selectedServices: string[] = [];
      if (enableCompute) selectedServices.push('Compute & VMs');
      if (enableStorage) selectedServices.push('Object Storage');
      if (enableDatabase) selectedServices.push('Managed Databases');
      if (enableServerless) selectedServices.push('Serverless Functions');
      if (enableNetworking) selectedServices.push('Networking (VPC/VNet)');
      if (enableSecurity) selectedServices.push('Security & KMS');

      if (selectedServices.length === 0) {
        throw new Error('Selecione pelo menos um recurso/serviço via checkbox para monitorar.');
      }

      // Build initial sample resources according to checkboxes
      const initialResources: any[] = [];
      const prefix = selectedProvider.toLowerCase();

      if (enableCompute) {
        initialResources.push({
          id: `res-${prefix}-vm-${Date.now().toString().slice(-4)}`,
          name: computeInstanceName.trim() || `${prefix}-app-workload-node`,
          provider: selectedProvider,
          category: 'COMPUTE',
          resourceType: computeInstanceType,
          status: 'RUNNING',
          region: defaultRegion,
          estimatedMonthlyCost: 58.40,
          tags: { Environment: 'Production', Owner: accountName, Workload: 'CoreServices' },
          securityPosture: 'SECURE',
          nativeArnOrId: `arn:${prefix}:compute:${defaultRegion}:inst-${Date.now().toString().slice(-6)}`
        });
      }

      if (enableStorage) {
        initialResources.push({
          id: `res-${prefix}-stg-${Date.now().toString().slice(-4)}`,
          name: storageBucketName.trim() || `${prefix}-data-lake-${accountName.toLowerCase().replace(/\s+/g, '-')}`,
          provider: selectedProvider,
          category: 'STORAGE',
          resourceType: selectedProvider === 'AWS' ? 'S3 Standard' : selectedProvider === 'AZURE' ? 'Blob Storage Hot' : 'Cloud Storage Multi-Regional',
          status: 'RUNNING',
          region: defaultRegion,
          estimatedMonthlyCost: 19.50,
          tags: { DataClassification: 'Confidential', Encrypted: 'True', Owner: accountName },
          securityPosture: 'SECURE',
          nativeArnOrId: `urn:${prefix}:storage:${defaultRegion}:${storageBucketName || 'bucket-01'}`
        });
      }

      if (enableDatabase) {
        initialResources.push({
          id: `res-${prefix}-db-${Date.now().toString().slice(-4)}`,
          name: `${prefix}-cluster-${databaseEngine.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          provider: selectedProvider,
          category: 'DATABASE',
          resourceType: databaseEngine,
          status: 'RUNNING',
          region: defaultRegion,
          estimatedMonthlyCost: 110.00,
          tags: { HighAvailability: 'Multi-AZ', AutomatedBackups: 'Enabled' },
          securityPosture: 'SECURE',
          nativeArnOrId: `urn:${prefix}:db:${defaultRegion}:${databaseEngine}`
        });
      }

      // Credentials object
      const credentials: Record<string, any> = {};
      if (selectedProvider === 'AWS') {
        credentials.accessKeyId = awsAccessKey;
        credentials.accountId = awsAccountId;
        credentials.roleArn = awsRoleArn;
      } else if (selectedProvider === 'AZURE') {
        credentials.tenantId = azureTenantId;
        credentials.clientId = azureClientId;
        credentials.subscriptionId = azureSubId;
        credentials.resourceGroup = azureResourceGroup;
      } else if (selectedProvider === 'GCP') {
        credentials.projectId = gcpProjectId;
        credentials.serviceAccount = gcpServiceAccount;
        credentials.zone = gcpZone;
      } else if (selectedProvider === 'OCI') {
        credentials.tenancyOcid = ociTenancyOcid;
        credentials.userOcid = ociUserOcid;
        credentials.fingerprint = ociFingerprint;
        credentials.compartmentOcid = ociCompartment;
      } else {
        credentials.customEndpoint = customEndpoint;
      }

      const res = await fetch('/api/providers/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          defaultRegion,
          credentials,
          selectedServices,
          initialResources
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao cadastrar provedor de nuvem.');
      }

      onCloudAdded(data.provider, data.addedResourcesCount);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar conexão da nuvem.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className={`w-full max-w-3xl rounded-2xl border shadow-2xl p-6 relative my-8 transition-all ${
        theme === 'light'
          ? 'bg-white border-slate-200 text-slate-900'
          : theme === 'midnight'
          ? 'bg-slate-900 border-indigo-950/80 text-white shadow-indigo-950/50'
          : 'bg-slate-950 border-slate-800 text-white'
      }`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-inner">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {t.addCloudTitle}
            </h2>
            <p className="text-xs text-slate-400">
              {t.addCloudSubtitle}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Cloud Provider */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              1. {t.selectProvider}:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {providersOptions.map((p) => {
                const isSelected = selectedProvider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProvider(p.id)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md scale-102'
                        : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">{p.badge}</div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">Selecionar</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Cloud Configuration Fields */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
              <span className="text-xs font-semibold text-indigo-300 flex items-center">
                <Sliders className="w-4 h-4 mr-1.5" /> 2. Configurações Pertinentes ({selectedProvider}):
              </span>
              <span className="text-[11px] text-slate-400">Credenciais Criptografadas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Nome da Conta / Ambiente:</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Ex: Produção-Principal"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Região / zona principal:</label>
                <input
                  type="text"
                  value={defaultRegion}
                  onChange={(e) => setDefaultRegion(e.target.value)}
                  placeholder={selectedProvider === 'GCP' ? 'Ex: europe-west1' : 'Ex: região/zona da sua infraestrutura'}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>

              {/* AWS Specific Fields */}
              {selectedProvider === 'AWS' && (
                <>
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">AWS Access Key ID:</label>
                    <input
                      type="text"
                      value={awsAccessKey}
                      onChange={(e) => setAwsAccessKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">AWS Secret Access Key:</label>
                    <input
                      type="password"
                      value={awsSecretKey}
                      onChange={(e) => setAwsSecretKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">AWS Account ID (12 dígitos):</label>
                    <input
                      type="text"
                      value={awsAccountId}
                      onChange={(e) => setAwsAccountId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">IAM Role ARN (AssumeRole):</label>
                    <input
                      type="text"
                      value={awsRoleArn}
                      onChange={(e) => setAwsRoleArn(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-[11px]"
                    />
                  </div>
                </>
              )}

              {/* Azure Specific Fields */}
              {selectedProvider === 'AZURE' && (
                <>
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">Azure Tenant ID:</label>
                    <input
                      type="text"
                      value={azureTenantId}
                      onChange={(e) => setAzureTenantId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">Client / Application ID:</label>
                    <input
                      type="text"
                      value={azureClientId}
                      onChange={(e) => setAzureClientId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">Subscription ID:</label>
                    <input
                      type="text"
                      value={azureSubId}
                      onChange={(e) => setAzureSubId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">Resource Group Padrão:</label>
                    <input
                      type="text"
                      value={azureResourceGroup}
                      onChange={(e) => setAzureResourceGroup(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                    />
                  </div>
                </>
              )}

              {/* GCP Specific Fields */}
              {selectedProvider === 'GCP' && (
                <>
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">Google Cloud Project ID:</label>
                    <input
                      type="text"
                      value={gcpProjectId}
                      onChange={(e) => setGcpProjectId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">Service Account Email:</label>
                    <input
                      type="text"
                      value={gcpServiceAccount}
                      onChange={(e) => setGcpServiceAccount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">GCP Zone:</label>
                    <input
                      type="text"
                      value={gcpZone}
                      onChange={(e) => setGcpZone(e.target.value)}
                      placeholder="Ex: europe-west1-b"
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                    />
                  </div>
                </>
              )}

              {/* OCI Specific Fields */}
              {selectedProvider === 'OCI' && (
                <>
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">Tenancy OCID:</label>
                    <input
                      type="text"
                      value={ociTenancyOcid}
                      onChange={(e) => setOciTenancyOcid(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">User OCID:</label>
                    <input
                      type="text"
                      value={ociUserOcid}
                      onChange={(e) => setOciUserOcid(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-[11px]"
                    />
                  </div>
                </>
              )}

              {/* Custom Cloud */}
              {selectedProvider === 'ALIBABA' && (
                <div className="sm:col-span-2">
                  <label className="text-slate-300 block mb-1 font-medium">Endpoint API da Nuvem:</label>
                  <input
                    type="text"
                    value={customEndpoint}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Select Cloud Resources via Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  3. {t.servicesTitle}:
                </label>
                <p className="text-[11px] text-slate-500">
                  {t.servicesSubtitle}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Checkbox 1: Compute */}
              <div className={`p-3 rounded-xl border transition-all ${
                enableCompute ? 'bg-indigo-950/30 border-indigo-500/80 text-white' : 'bg-slate-800/30 border-slate-700/60 text-slate-400'
              }`}>
                <label className="flex items-center space-x-2.5 font-bold cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={enableCompute}
                    onChange={(e) => setEnableCompute(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>Computação & Instâncias Virtuais (VMs)</span>
                </label>
                {enableCompute && (
                  <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                    <label className="text-[11px] text-slate-300 block">Tipo/Família de Instância:</label>
                    <input
                      type="text"
                      value={computeInstanceType}
                      onChange={(e) => setComputeInstanceType(e.target.value)}
                      placeholder="Ex: t3.large, e2-standard-4"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white font-mono text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Checkbox 2: Storage */}
              <div className={`p-3 rounded-xl border transition-all ${
                enableStorage ? 'bg-indigo-950/30 border-indigo-500/80 text-white' : 'bg-slate-800/30 border-slate-700/60 text-slate-400'
              }`}>
                <label className="flex items-center space-x-2.5 font-bold cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={enableStorage}
                    onChange={(e) => setEnableStorage(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <span>Armazenamento de Objetos (Buckets / Blobs)</span>
                </label>
                {enableStorage && (
                  <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                    <label className="text-[11px] text-slate-300 block">Nome do Bucket Inicial:</label>
                    <input
                      type="text"
                      value={storageBucketName}
                      onChange={(e) => setStorageBucketName(e.target.value)}
                      placeholder={`Ex: corp-${selectedProvider.toLowerCase()}-data-lake`}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white font-mono text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Checkbox 3: Databases */}
              <div className={`p-3 rounded-xl border transition-all ${
                enableDatabase ? 'bg-indigo-950/30 border-indigo-500/80 text-white' : 'bg-slate-800/30 border-slate-700/60 text-slate-400'
              }`}>
                <label className="flex items-center space-x-2.5 font-bold cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={enableDatabase}
                    onChange={(e) => setEnableDatabase(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <Database className="w-4 h-4 text-blue-400" />
                  <span>Bancos de Dados Gerenciados (RDS / SQL)</span>
                </label>
                {enableDatabase && (
                  <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                    <label className="text-[11px] text-slate-300 block">Mecanismo do Banco:</label>
                    <select
                      value={databaseEngine}
                      onChange={(e) => setDatabaseEngine(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-xs"
                    >
                      <option value="PostgreSQL 16">PostgreSQL 16 Enterprise</option>
                      <option value="MySQL 8.4">MySQL 8.4 Multi-Region</option>
                      <option value="Oracle Autonomous">Oracle Autonomous Transaction</option>
                      <option value="Redis Cluster">Redis Cache Cluster</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Checkbox 4: Networking & VPC */}
              <div className={`p-3 rounded-xl border transition-all ${
                enableNetworking ? 'bg-indigo-950/30 border-indigo-500/80 text-white' : 'bg-slate-800/30 border-slate-700/60 text-slate-400'
              }`}>
                <label className="flex items-center space-x-2.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableNetworking}
                    onChange={(e) => setEnableNetworking(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <Network className="w-4 h-4 text-purple-400" />
                  <span>Redes Virtuais & VPC (Roteamento / Peering)</span>
                </label>
                <p className="text-[10px] text-slate-500 mt-1 pl-6.5">
                  Monitoramento contínuo de regras de firewall, CIDRs e security groups.
                </p>
              </div>

              {/* Checkbox 5: Security & KMS */}
              <div className={`p-3 rounded-xl border transition-all ${
                enableSecurity ? 'bg-indigo-950/30 border-indigo-500/80 text-white' : 'bg-slate-800/30 border-slate-700/60 text-slate-400'
              }`}>
                <label className="flex items-center space-x-2.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableSecurity}
                    onChange={(e) => setEnableSecurity(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Segurança, Chaves KMS & Gestão de Identidade</span>
                </label>
                <p className="text-[10px] text-slate-500 mt-1 pl-6.5">
                  Conformidade com CIS Benchmark, criptografia e políticas de acesso mínimo.
                </p>
              </div>

              {/* Checkbox 6: Serverless Functions */}
              <div className={`p-3 rounded-xl border transition-all ${
                enableServerless ? 'bg-indigo-950/30 border-indigo-500/80 text-white' : 'bg-slate-800/30 border-slate-700/60 text-slate-400'
              }`}>
                <label className="flex items-center space-x-2.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableServerless}
                    onChange={(e) => setEnableServerless(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  <span>Funções Serverless (Lambda / Cloud Functions)</span>
                </label>
                <p className="text-[10px] text-slate-500 mt-1 pl-6.5">
                  Métricas de invocação e tempo de resposta de microserviços.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {t.btnCancel}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-colors flex items-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{t.btnConnectCloud}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
