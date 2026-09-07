/**
 * AI MultiCloud Resilience Engine
 * Implements Circuit Breaker and Retry with Exponential Backoff + Jitter (Tenacity Pattern).
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number; // number of consecutive failures to open circuit
  recoveryTimeoutMs: number; // time in OPEN state before trying HALF_OPEN
  maxHalfOpenAttempts: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private config: CircuitBreakerConfig;

  constructor(
    public readonly name: string,
    config?: Partial<CircuitBreakerConfig>
  ) {
    this.config = {
      failureThreshold: config?.failureThreshold ?? 3,
      recoveryTimeoutMs: config?.recoveryTimeoutMs ?? 15000,
      maxHalfOpenAttempts: config?.maxHalfOpenAttempts ?? 2
    };
  }

  getState(): CircuitState {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.config.recoveryTimeoutMs) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      }
    }
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const currentState = this.getState();

    if (currentState === 'OPEN') {
      throw new Error(
        `[CircuitBreaker: ${this.name}] O circuito está ABERTO para evitar sobrecarga ou falhas em cascata. Tente novamente em alguns segundos.`
      );
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.config.maxHalfOpenAttempts) {
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.state === 'HALF_OPEN' || this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
  }
}

/**
 * Exponential Backoff with Jitter (Tenacity Pattern)
 */
export async function retryWithTenacity<T>(
  fn: () => Promise<T>,
  options?: {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
    maxDelayMs?: number;
  }
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 3;
  const initialDelayMs = options?.initialDelayMs ?? 100;
  const backoffFactor = options?.backoffFactor ?? 2;
  const maxDelayMs = options?.maxDelayMs ?? 3000;

  let attempt = 1;
  while (attempt <= maxAttempts) {
    try {
      return await fn();
    } catch (err: any) {
      if (attempt >= maxAttempts) {
        throw err;
      }
      // Calculate delay with full jitter: random * (initialDelay * (backoffFactor ^ attempt))
      const calculatedDelay = Math.min(maxDelayMs, initialDelayMs * Math.pow(backoffFactor, attempt - 1));
      const jitter = Math.random() * calculatedDelay;
      await new Promise(resolve => setTimeout(resolve, jitter));
      attempt++;
    }
  }
  throw new Error('Falha após atingir o número máximo de tentativas.');
}
