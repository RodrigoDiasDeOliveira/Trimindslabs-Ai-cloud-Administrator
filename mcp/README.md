# Model Context Protocol (MCP) Integration Guide

Este diretório contém a especificação e as integrações do **AI MultiCloud Agent** via **Model Context Protocol (MCP)**, permitindo que IDEs e assistentes de ponta (como **Claude Desktop**, **Cursor IDE** e **Continue.dev**) se conectem diretamente à plataforma de orquestração multi-cloud.

---

## 1. Claude Desktop Integration

Adicione a seguinte configuração ao seu arquivo `claude_desktop_config.json` (localizado em `~/Library/Application Support/Claude/claude_desktop_config.json` no macOS ou `%APPDATA%\Claude\claude_desktop_config.json` no Windows):

```json
{
  "mcpServers": {
    "ai-multicloud-agent": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "/caminho/para/ai-multicloud-agent/server.ts"
      ],
      "env": {
        "PORT": "3000",
        "GEMINI_API_KEY": "sua-chave-gemini-aqui"
      }
    }
  }
}
```

### Exemplos de prompts no Claude Desktop:
- *"Claude, liste todas as instâncias de computação ativas na AWS e GCP e verifique se alguma está sem criptografia KMS."*
- *"Execute um dry-run para desprovisionar o nó `prod-api-cluster-node-01` e mostre o cálculo do Blast Radius."*
- *"Dispare o backup multi-cloud do cluster Aurora para o GCP Cloud Storage e confirme o hash de integridade."*

---

## 2. Cursor IDE Integration

No **Cursor**, você pode configurar o MCP em **Settings > Features > MCP Servers** ou adicionar um arquivo `.cursor/rules` no seu projeto:

### Configuração em Settings:
- **Name:** `MultiCloud-Agent`
- **Type:** `command`
- **Command:** `node -e "require('http').get('http://localhost:3000/api/resources', res => res.pipe(process.stdout))"`

### Exemplo de `.cursorrules`:
```markdown
You are an expert multi-cloud engineer connected to the AI MultiCloud Agent API.
When working with cloud infrastructure:
1. Always suggest Dry-Run mode before proposing any destructive action (terminate_vm, delete_bucket).
2. Adhere strictly to OPA rules: No open SSH 0.0.0.0/0 on port 22, and mandatory KMS encryption.
3. Utilize the Unified Cloud Abstraction layer (AWS, Azure, GCP, OCI).
```

---

## 3. Continue.dev Integration

No arquivo `~/.continue/config.json`:

```json
{
  "tools": [
    {
      "name": "ai-multicloud-agent",
      "description": "Multi-cloud infrastructure inspector and orchestrator",
      "url": "http://localhost:3000/api/agent/chat"
    }
  ],
  "customCommands": [
    {
      "name": "cloud-audit",
      "prompt": "Consulte o endpoint /api/governance e relate quaisquer violações de conformidade OPA."
    }
  ]
}
```
