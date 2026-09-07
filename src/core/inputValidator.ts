/**
 * AI MultiCloud Agent - Input Validation & Sanitization Engine
 * Protects against Command Injections, Malformed IaC, Unsafe CIDRs, and Credential Leaks.
 */

export interface ValidationResult {
  valid: boolean;
  sanitizedValue?: string;
  errors: string[];
}

export class InputValidator {
  /**
   * Validates cloud resource name (RFC 1123 DNS-safe pattern, 3-63 chars, alphanumeric + hyphens)
   */
  static validateResourceName(name: string): ValidationResult {
    const errors: string[] = [];
    if (!name || typeof name !== 'string') {
      return { valid: false, errors: ['O nome do recurso não pode ser vazio.'] };
    }

    const trimmed = name.trim();

    // Check dangerous shell injection characters
    const dangerousPatterns = [';', '&', '|', '`', '$', '(', ')', '<', '>', '\\', '\'', '"', '\n', '\r'];
    for (const char of dangerousPatterns) {
      if (trimmed.includes(char)) {
        errors.push(`Caractere proibido detectado no nome do recurso: "${char}". Prevenção contra injeção.`);
      }
    }

    // RFC 1123 pattern
    const rfcRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/i;
    if (trimmed.length < 3 || trimmed.length > 63) {
      errors.push('O nome do recurso deve ter entre 3 e 63 caracteres.');
    } else if (!rfcRegex.test(trimmed)) {
      errors.push('O nome do recurso deve conter apenas letras, números e hifens, iniciando e terminando com caractere alfanumérico.');
    }

    return {
      valid: errors.length === 0,
      sanitizedValue: trimmed.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      errors
    };
  }

  /**
   * Validates CIDR notation (e.g. 10.0.0.0/16) and blocks dangerous open egress/ingress
   */
  static validateCidr(cidr: string): ValidationResult {
    const errors: string[] = [];
    const trimmed = (cidr || '').trim();

    const cidrRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}\/([0-9]|[1-2][0-9]|3[0-2])$/;
    if (!cidrRegex.test(trimmed)) {
      return { valid: false, errors: ['Formato de bloco CIDR inválido (Exemplo esperado: 10.0.0.0/16 ou 192.168.1.0/24).'] };
    }

    const [ip, maskStr] = trimmed.split('/');
    const mask = parseInt(maskStr, 10);
    const octets = ip.split('.').map(o => parseInt(o, 10));

    if (octets.some(o => o < 0 || o > 255)) {
      errors.push('Octeto IP fora do intervalo válido de 0 a 255.');
    }

    if (mask < 8 || mask > 30) {
      errors.push('Máscara de sub-rede fora do limite suportado para nuvem (/8 a /30).');
    }

    return {
      valid: errors.length === 0,
      sanitizedValue: trimmed,
      errors
    };
  }

  /**
   * Validates Infrastructure as Code (Terraform, JSON, YAML) scripts
   * Checks for leaked secrets (AWS_SECRET_ACCESS_KEY, private_key, password)
   */
  static validateIacContent(content: string, type: 'terraform' | 'json' | 'yaml'): ValidationResult {
    const errors: string[] = [];
    if (!content || !content.trim()) {
      return { valid: false, errors: ['O conteúdo da configuração IaC não pode estar vazio.'] };
    }

    // Leaked secret heuristics
    const secretPatterns = [
      /AKIA[0-9A-Z]{16}/, // AWS Access Key
      /aws_secret_access_key\s*=\s*["'][a-zA-Z0-9/+=]{20,}["']/i,
      /-----BEGIN RSA PRIVATE KEY-----/,
      /-----BEGIN PRIVATE KEY-----/,
      /client_secret\s*=\s*["'][^"']{8,}["']/i,
      /password\s*=\s*["'][^"']{6,}["']/i
    ];

    for (const pattern of secretPatterns) {
      if (pattern.test(content)) {
        errors.push('ALERTA DE SEGURANÇA: Chaves privadas ou credenciais estáticas foram detectadas no código IaC. Utilize variáveis de ambiente ou KMS/Vault!');
        break;
      }
    }

    // Basic syntax balance check
    if (type === 'json') {
      try {
        JSON.parse(content);
      } catch (e: any) {
        errors.push(`Erro de sintaxe JSON: ${e.message}`);
      }
    } else if (type === 'terraform') {
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        errors.push(`Desbalanceamento de chaves HCL: ${openBraces} '{' vs ${closeBraces} '}'.`);
      }
    }

    return {
      valid: errors.length === 0,
      sanitizedValue: content,
      errors
    };
  }
}
