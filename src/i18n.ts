export type Language = 'pt' | 'en' | 'es';

export interface Translations {
  appTitle: string;
  appSubtitle: string;
  navDashboard: string;
  navAgent: string;
  navResources: string;
  navGovernance: string;
  navAudit: string;
  navSettings: string;
  btnAddCloud: string;
  themeDark: string;
  themeMidnight: string;
  themeLight: string;
  themeLabel: string;
  langLabel: string;
  userProfile: string;
  logout: string;
  login: string;
  switchUser: string;
  roleAdmin: string;
  roleDev: string;
  roleObserver: string;
  roleAdminDesc: string;
  roleDevDesc: string;
  roleObserverDesc: string;
  activeResources: string;
  monthlyEstimate: string;
  cisCompliance: string;
  avgLatency: string;
  quickPrompts: string;
  quickPromptsSubtitle: string;
  auditTitle: string;
  auditSubtitle: string;
  inventoryTitle: string;
  inventorySubtitle: string;
  viewAll: string;
  filterProvider: string;
  filterCategory: string;
  searchPlaceholder: string;
  statusRunning: string;
  statusStopped: string;
  actionStart: string;
  actionStop: string;
  actionRestart: string;
  actionInspect: string;
  blastRadiusTitle: string;
  blastRadiusDesc: string;
  btnApproveBlastRadius: string;
  btnCancelBlastRadius: string;
  addCloudTitle: string;
  addCloudSubtitle: string;
  selectProvider: string;
  defaultRegion: string;
  credentialsTitle: string;
  servicesTitle: string;
  servicesSubtitle: string;
  btnConnectCloud: string;
  btnCancel: string;
  observerRestriction: string;
  exportLedger: string;
  costDistribution: string;
}

export const translations: Record<Language, Translations> = {
  pt: {
    appTitle: 'AI-MultiCloud-Agent',
    appSubtitle: 'Orquestração Segura: AWS • Azure • GCP • OCI',
    navDashboard: 'Dashboard',
    navAgent: 'AI Agent Console',
    navResources: 'Recursos Multi-Cloud',
    navGovernance: 'Governança & FinOps',
    navAudit: 'Trilha de Auditoria',
    navSettings: 'Conexões & Nuvem',
    btnAddCloud: '+ Adicionar Nuvem',
    themeDark: 'Escuro Profundo',
    themeMidnight: 'Midnight Navy',
    themeLight: 'Claro Executivo',
    themeLabel: 'Fundo',
    langLabel: 'Idioma',
    userProfile: 'Perfil Ativo',
    logout: 'Sair',
    login: 'Entrar no Sistema',
    switchUser: 'Trocar Usuário',
    roleAdmin: 'Administrador (Total)',
    roleDev: 'DevOps / Dev (Padrão)',
    roleObserver: 'Observer (Apenas Leitura)',
    roleAdminDesc: 'Acesso irrestrito, aprovação de Blast Radius e gerenciamento de infraestrutura.',
    roleDevDesc: 'Consultas ativas e operações não críticas. Operações destrutivas requerem aprovação.',
    roleObserverDesc: 'Permissão estrita de leitura e auditoria. Bloqueado para modificações.',
    activeResources: 'Recursos Ativos',
    monthlyEstimate: 'Previsão Mensal',
    cisCompliance: 'Conformidade CIS',
    avgLatency: 'Latência Média',
    quickPrompts: 'Comandos Rápidos do Agente de IA',
    quickPromptsSubtitle: 'Dispare orquestrações com um clique',
    auditTitle: 'Últimas Ações & Auditoria',
    auditSubtitle: 'Registros imutáveis com assinatura SHA-256',
    inventoryTitle: 'Inventário Consolidado Multi-Cloud',
    inventorySubtitle: 'Amostra em tempo real de instâncias e serviços gerenciados',
    viewAll: 'Ver todos',
    filterProvider: 'Provedor',
    filterCategory: 'Categoria',
    searchPlaceholder: 'Buscar por nome, tipo, região ou ARN/OCID...',
    statusRunning: 'EM EXECUÇÃO',
    statusStopped: 'PARADO',
    actionStart: 'Iniciar',
    actionStop: 'Parar',
    actionRestart: 'Reiniciar',
    actionInspect: 'Inspecionar',
    blastRadiusTitle: 'Ação Crítica Requer Aprovação Manual (ADR-003)',
    blastRadiusDesc: 'Tentativa de operação interceptada pelo guardrail de segurança.',
    btnApproveBlastRadius: 'Confirmar & Executar (Aprovação RBAC)',
    btnCancelBlastRadius: 'Cancelar Operação',
    addCloudTitle: 'Conectar Nova Nuvem',
    addCloudSubtitle: 'Cadastre credenciais, selecione os serviços monitorados e provisione recursos.',
    selectProvider: 'Provedor de Nuvem',
    defaultRegion: 'Região Padrão',
    credentialsTitle: 'Credenciais de Acesso',
    servicesTitle: 'Serviços & Recursos da Nuvem',
    servicesSubtitle: 'Marque quais recursos desta nuvem devem ser administrados pelo agente',
    btnConnectCloud: 'Validar & Conectar Nuvem',
    btnCancel: 'Cancelar',
    observerRestriction: 'Operação bloqueada: Usuários com perfil Observer possuem permissão apenas de leitura.',
    exportLedger: 'Exportar Ledger JSON',
    costDistribution: 'Distribuição por Nuvem',
  },
  en: {
    appTitle: 'AI-MultiCloud-Agent',
    appSubtitle: 'Secure Orchestration: AWS • Azure • GCP • OCI',
    navDashboard: 'Dashboard',
    navAgent: 'AI Agent Console',
    navResources: 'Multi-Cloud Resources',
    navGovernance: 'Governance & FinOps',
    navAudit: 'Audit Trail',
    navSettings: 'Cloud Connections',
    btnAddCloud: '+ Add Cloud',
    themeDark: 'Deep Dark',
    themeMidnight: 'Midnight Navy',
    themeLight: 'Executive Light',
    themeLabel: 'Theme',
    langLabel: 'Language',
    userProfile: 'Active Profile',
    logout: 'Logout',
    login: 'Sign In',
    switchUser: 'Switch User',
    roleAdmin: 'Administrator (Full)',
    roleDev: 'DevOps / Dev (Standard)',
    roleObserver: 'Observer (Read-Only)',
    roleAdminDesc: 'Unrestricted access, Blast Radius approval, and full infrastructure management.',
    roleDevDesc: 'Active queries and standard operations. Critical destructive operations require approval.',
    roleObserverDesc: 'Strict read-only and audit view permissions. Prevented from modifications.',
    activeResources: 'Active Resources',
    monthlyEstimate: 'Monthly Forecast',
    cisCompliance: 'CIS Compliance',
    avgLatency: 'Average Latency',
    quickPrompts: 'AI Agent Quick Commands',
    quickPromptsSubtitle: 'Trigger orchestrations with a single click',
    auditTitle: 'Recent Actions & Audit',
    auditSubtitle: 'Immutable logs with SHA-256 signatures',
    inventoryTitle: 'Consolidated Multi-Cloud Inventory',
    inventorySubtitle: 'Real-time telemetry of instances and managed services',
    viewAll: 'View all',
    filterProvider: 'Provider',
    filterCategory: 'Category',
    searchPlaceholder: 'Search by name, type, region, or ARN/OCID...',
    statusRunning: 'RUNNING',
    statusStopped: 'STOPPED',
    actionStart: 'Start',
    actionStop: 'Stop',
    actionRestart: 'Restart',
    actionInspect: 'Inspect',
    blastRadiusTitle: 'Critical Action Requires Manual Approval (ADR-003)',
    blastRadiusDesc: 'Destructive operation intercepted by security guardrail.',
    btnApproveBlastRadius: 'Confirm & Execute (RBAC Approved)',
    btnCancelBlastRadius: 'Cancel Operation',
    addCloudTitle: 'Connect New Cloud',
    addCloudSubtitle: 'Register credentials, select monitored services, and provision initial resources.',
    selectProvider: 'Cloud Provider',
    defaultRegion: 'Default Region',
    credentialsTitle: 'Access Credentials',
    servicesTitle: 'Cloud Services & Resources',
    servicesSubtitle: 'Select which resources from this cloud should be managed by the AI agent',
    btnConnectCloud: 'Validate & Connect Cloud',
    btnCancel: 'Cancel',
    observerRestriction: 'Action blocked: Observer profile has read-only permissions.',
    exportLedger: 'Export Ledger JSON',
    costDistribution: 'Cloud Cost Breakdown',
  },
  es: {
    appTitle: 'AI-MultiCloud-Agent',
    appSubtitle: 'Orquestación Segura: AWS • Azure • GCP • OCI',
    navDashboard: 'Panel',
    navAgent: 'Consola Agente IA',
    navResources: 'Recursos Multi-Nube',
    navGovernance: 'Gobernanza & FinOps',
    navAudit: 'Pista de Auditoría',
    navSettings: 'Conexiones & Nube',
    btnAddCloud: '+ Añadir Nube',
    themeDark: 'Oscuro Profundo',
    themeMidnight: 'Midnight Navy',
    themeLight: 'Claro Ejecutivo',
    themeLabel: 'Fondo',
    langLabel: 'Idioma',
    userProfile: 'Perfil Activo',
    logout: 'Cerrar Sesión',
    login: 'Iniciar Sesión',
    switchUser: 'Cambiar Usuario',
    roleAdmin: 'Administrador (Total)',
    roleDev: 'DevOps / Dev (Estándar)',
    roleObserver: 'Observador (Solo Lectura)',
    roleAdminDesc: 'Acceso sin restricciones, aprobación de Blast Radius y gestión de infraestructura.',
    roleDevDesc: 'Consultas y operaciones estándar. Operaciones destructivas requieren aprobación.',
    roleObserverDesc: 'Permisos estrictos de solo lectura y auditoría. Bloqueado para modificaciones.',
    activeResources: 'Recursos Activos',
    monthlyEstimate: 'Estimación Mensual',
    cisCompliance: 'Cumplimiento CIS',
    avgLatency: 'Latencia Media',
    quickPrompts: 'Comandos Rápidos del Agente IA',
    quickPromptsSubtitle: 'Dispare orquestaciones con un solo clic',
    auditTitle: 'Últimas Acciones & Auditoría',
    auditSubtitle: 'Registros inmutables con firma SHA-256',
    inventoryTitle: 'Inventario Consolidado Multi-Nube',
    inventorySubtitle: 'Telemetría en tiempo real de instancias y servicios gestionados',
    viewAll: 'Ver todos',
    filterProvider: 'Proveedor',
    filterCategory: 'Categoría',
    searchPlaceholder: 'Buscar por nombre, tipo, región o ARN/OCID...',
    statusRunning: 'EN EJECUCIÓN',
    statusStopped: 'DETENIDO',
    actionStart: 'Iniciar',
    actionStop: 'Detener',
    actionRestart: 'Reiniciar',
    actionInspect: 'Inspeccionar',
    blastRadiusTitle: 'Acción Crítica Requiere Aprobación Manual (ADR-003)',
    blastRadiusDesc: 'Operación destructiva interceptada por el guardrail de seguridad.',
    btnApproveBlastRadius: 'Confirmar & Ejecutar (RBAC Aprobado)',
    btnCancelBlastRadius: 'Cancelar Operación',
    addCloudTitle: 'Conectar Nueva Nube',
    addCloudSubtitle: 'Registre credenciales, seleccione servicios monitoreados y aprovisione recursos.',
    selectProvider: 'Proveedor de Nube',
    defaultRegion: 'Región Predeterminada',
    credentialsTitle: 'Credenciales de Acceso',
    servicesTitle: 'Servicios & Recursos de la Nube',
    servicesSubtitle: 'Marque qué recursos de esta nube serán administrados por el agente',
    btnConnectCloud: 'Validar & Conectar Nube',
    btnCancel: 'Cancelar',
    observerRestriction: 'Operación bloqueada: El perfil Observador solo tiene permisos de lectura.',
    exportLedger: 'Exportar Ledger JSON',
    costDistribution: 'Distribución por Nube',
  }
};
