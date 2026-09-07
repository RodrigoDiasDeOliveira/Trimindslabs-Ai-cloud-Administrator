import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OpaPolicyEngine } from '../src/core/opaEngine';
import { IacFile } from '../src/types';

describe('Open Policy Agent (OPA) Enforcement Tests', () => {
  it('deve bloquear código Terraform com SSH aberto 0.0.0.0/0 (OPA-SEC-001)', () => {
    const maliciousIac: IacFile = {
      id: 'iac-test-01',
      name: 'security-group.tf',
      type: 'terraform',
      provider: 'AWS',
      content: `
        resource "aws_security_group" "allow_ssh" {
          name = "allow_all_ssh"
          ingress {
            from_port   = 22
            to_port     = 22
            protocol    = "tcp"
            cidr_blocks = ["0.0.0.0/0"]
          }
        }
      `,
      status: 'DRAFT'
    };

    const evaluation = OpaPolicyEngine.evaluateIacCode(maliciousIac);
    assert.equal(evaluation.allowed, false, 'Código com 0.0.0.0/0 na porta 22 deve ser bloqueado');
    const sshViolation = evaluation.violations.find(v => v.policyId === 'OPA-SEC-001');
    assert.ok(sshViolation, 'Deve conter violação OPA-SEC-001');
    assert.equal(sshViolation?.severity, 'CRITICAL');
  });

  it('deve aprovar código Terraform seguro com KMS e sem portas abertas', () => {
    const compliantIac: IacFile = {
      id: 'iac-test-02',
      name: 'secure-bucket.tf',
      type: 'terraform',
      provider: 'AWS',
      content: `
        resource "aws_s3_bucket" "audit_bucket" {
          bucket = "corp-audited-data-2026"
          server_side_encryption_configuration {
            rule {
              apply_server_side_encryption_by_default {
                kms_master_key_id = "arn:aws:kms:us-east-1:12345:key/xyz"
                sse_algorithm     = "aws:kms"
              }
            }
          }
          tags = {
            "Environment" = "Production"
            "Owner"       = "SecOps"
          }
        }
      `,
      status: 'DRAFT'
    };

    const evaluation = OpaPolicyEngine.evaluateIacCode(compliantIac);
    assert.equal(evaluation.allowed, true, 'Configuração segura deve ser autorizada');
    assert.equal(evaluation.violations.length, 0);
    assert.equal(evaluation.complianceScore, 100);
  });
});
