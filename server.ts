});

// Execute a real, read-only provider connectivity probe.
app.get('/api/providers/:provider/probe', async (req: Request, res: Response) => {
  const provider = String(req.params.provider).toUpperCase();

  try {
    const probe = await UnifiedCloudService.performHealthProbe(provider);
    const providerIdx = providersList.findIndex(p => p.provider === provider);

    if (providerIdx >= 0) {
      providersList[providerIdx] = {
        ...providersList[providerIdx],
        status: probe.success ? 'CONNECTED' : 'DEGRADED',
        latencyMs: probe.latencyMs,
        credentialsValid: probe.success,
        circuitBreakerState: probe.circuitBreakerState,
        lastProbeCheck: {
          probeType: probe.probeType,
          targetEndpoint: probe.targetEndpoint,
          statusCode: probe.statusCode,
          success: probe.success,
          latencyMs: probe.latencyMs,
          checkedAt: probe.checkedAt
        }
      };
    }

    res.status(probe.success ? 200 : 503).json(probe);
  } catch (err: any) {
    res.status(500).json({
      provider,
      status: 'FAILED',
      message: err?.message || String(err)
    });
  }
});

// Add New Cloud Provider with Custom Resources & Services
app.post('/api/providers/add', (req: Request, res: Response) => {
  const { provider, defaultRegion, credentials, selectedServices, initialResources } = req.body;
  if (!provider) {
    res.status(400).json({ error: 'Provedor é obrigatório' });
    return;
  }

  const provUpper = String(provider).toUpperCase().trim();
  const existingIdx = providersList.findIndex(p => p.provider === provUpper);

  const services = Array.isArray(selectedServices) && selectedServices.length > 0
    ? selectedServices
    : ['Compute', 'Storage', 'Database', 'Networking', 'Security'];

  const newProviderObj = {
    provider: provUpper,
    status: 'NOT_CONFIGURED' as const,
    defaultRegion: defaultRegion || 'us-east-1',
    activeResourcesCount: 0,
    latencyMs: Math.floor(Math.random() * 25) + 35,
    credentialsValid: false,
    availableServices: services
  };

  if (existingIdx >= 0) {
    providersList[existingIdx] = { ...providersList[existingIdx], ...newProviderObj };
  } else {
    providersList.push(newProviderObj);
  }

  // Add customized initial resources selected via checkboxes
  let addedCount = 0;
  if (Array.isArray(initialResources) && initialResources.length > 0) {
    initialResources.forEach((resItem: any) => {
      resources.push({
        id: resItem.id || `res-${provUpper.toLowerCase()}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`,
        name: resItem.name || `${provUpper.toLowerCase()}-workload-01`,
        provider: provUpper as any,