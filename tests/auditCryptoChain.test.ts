import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AuditCryptoChain } from '../src/core/auditCrypto';
import { AuditLog } from '../src/types';

describe('Cryptographic Audit Ledger & Chain Integrity Tests', () => {
  it('deve encadear logs com SHA-256 e verificar integridade com sucesso', () => {
    const logs: AuditLog[] = [];

    const entry1 = AuditCryptoChain.createEntry(undefined, {
      user: 'admin@corp.io',
      role: 'ROLE_ADMIN',
      provider: 'AWS',
      action: 'CREATE_VM',
      resourceId: 'vm-01',
      riskLevel: 'LOW',
      status: 'SUCCESS',
      details: 'Instância criada com sucesso.'
    });
    logs.unshift(entry1);

    const entry2 = AuditCryptoChain.createEntry(entry1, {
      user: 'sec@corp.io',
      role: 'ROLE_SECURITY_AUDITOR',
      provider: 'GCP',
      action: 'AUDIT_INVENTORY',
      resourceId: 'ALL_GCP',
      riskLevel: 'LOW',
      status: 'SUCCESS',
      details: 'Auditoria periódica de segurança.'
    });
    logs.unshift(entry2);

    assert.equal(entry2.previousHash, entry1.signature);

    const check = AuditCryptoChain.verifyChainIntegrity(logs);
    assert.equal(check.isValid, true);
  });

  it('deve detectar adulteração de dados em qualquer ponto da cadeia', () => {
    const logs: AuditLog[] = [];

    const entry1 = AuditCryptoChain.createEntry(undefined, {
      user: 'admin@corp.io',
      role: 'ROLE_ADMIN',
      provider: 'AZURE',
      action: 'STOP_INSTANCE',
      resourceId: 'vm-az-01',
      riskLevel: 'CRITICAL',
      status: 'SUCCESS',
      details: 'Operação de parada autorizada.'
    });
    logs.unshift(entry1);

    const entry2 = AuditCryptoChain.createEntry(entry1, {
      user: 'dev@corp.io',
      role: 'ROLE_DEV',
      provider: 'OCI',
      action: 'DEPLOY_CONTAINER',
      resourceId: 'oci-c1',
      riskLevel: 'LOW',
      status: 'SUCCESS',
      details: 'Container deploy.'
    });
    logs.unshift(entry2);

    // Adultera o registro 1
    entry1.details = 'DETALHE ADULTERADO MALICIOSAMENTE';

    const check = AuditCryptoChain.verifyChainIntegrity(logs);
    assert.equal(check.isValid, false, 'Adulteração deve ser flagrada');
    assert.ok(check.message.includes('Violação de integridade'));
  });
});
