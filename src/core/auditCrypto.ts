import { createHash } from 'crypto';
import { AuditLog } from '../types';

/**
 * Cryptographic Audit Ledger Engine
 * Implements tamper-evident audit chaining (Merkle/Blockchain-style SHA-256 linking).
 */
export class AuditCryptoChain {
  private static GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

  /**
   * Calculates the SHA-256 hash for an audit log entry based on its contents and the previous hash
   */
  static calculateHash(
    previousHash: string,
    timestamp: string,
    user: string,
    role: string,
    provider: string,
    action: string,
    resourceId: string,
    riskLevel: string,
    status: string,
    details: string
  ): string {
    const raw = `${previousHash}|${timestamp}|${user}|${role}|${provider}|${action}|${resourceId}|${riskLevel}|${status}|${details}`;
    return createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Creates a new cryptographically chained audit log
   */
  static createEntry(
    latestLog: AuditLog | undefined,
    params: {
      user: string;
      role: string;
      provider: string;
      action: string;
      resourceId: string;
      riskLevel: 'LOW' | 'MEDIUM' | 'CRITICAL';
      status: 'SUCCESS' | 'FAILED' | 'BLOCKED_BY_GUARDRAIL';
      details: string;
    }
  ): AuditLog {
    const previousHash = latestLog ? (latestLog.signature || latestLog.previousHash || this.GENESIS_HASH) : this.GENESIS_HASH;
    const timestamp = new Date().toISOString();
    const id = `aud-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const signature = this.calculateHash(
      previousHash,
      timestamp,
      params.user,
      params.role,
      params.provider,
      params.action,
      params.resourceId,
      params.riskLevel,
      params.status,
      params.details
    );

    return {
      id,
      timestamp,
      user: params.user,
      role: params.role,
      provider: params.provider,
      action: params.action,
      resourceId: params.resourceId,
      riskLevel: params.riskLevel,
      status: params.status,
      details: params.details,
      previousHash,
      signature
    };
  }

  /**
   * Verifies the cryptographic integrity of the entire audit chain
   */
  static verifyChainIntegrity(logs: AuditLog[]): { isValid: boolean; corruptedIndex?: number; message: string } {
    if (!logs || logs.length === 0) {
      return { isValid: true, message: 'Trilha de auditoria vazia (íntegra).' };
    }

    // Check from oldest (end of array) to newest (start of array)
    const chronological = [...logs].reverse();

    for (let i = 0; i < chronological.length; i++) {
      const current = chronological[i];
      const expectedPrevHash = i === 0 ? this.GENESIS_HASH : chronological[i - 1].signature;

      if (current.previousHash && current.previousHash !== expectedPrevHash) {
        return {
          isValid: false,
          corruptedIndex: i,
          message: `Violação de encadeamento detectada no registro ID ${current.id}. Hash anterior esperado: ${expectedPrevHash}, encontrado: ${current.previousHash}.`
        };
      }

      const recomputedHash = this.calculateHash(
        current.previousHash || expectedPrevHash,
        current.timestamp,
        current.user,
        current.role,
        current.provider,
        current.action,
        current.resourceId,
        current.riskLevel,
        current.status,
        current.details
      );

      if (current.signature && current.signature !== recomputedHash) {
        return {
          isValid: false,
          corruptedIndex: i,
          message: `Violação de integridade criptográfica no registro ID ${current.id}. Assinatura alterada!`
        };
      }
    }

    return { isValid: true, message: `Trilha de auditoria 100% íntegra (${logs.length} registros verificados).` };
  }
}
