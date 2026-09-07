import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CircuitBreaker, retryWithTenacity } from '../src/core/resilience';

describe('Circuit Breaker and Tenacity Retry Tests', () => {
  it('deve manter o circuito FECHADO (CLOSED) enquanto as requisições sucedem', async () => {
    const breaker = new CircuitBreaker('TEST_BREAKER', { failureThreshold: 3 });
    const result = await breaker.execute(async () => 'success_data');

    assert.equal(result, 'success_data');
    assert.equal(breaker.getState(), 'CLOSED');
  });

  it('deve ABRIR (OPEN) o circuito após atingir o limite de falhas consecutivas', async () => {
    const breaker = new CircuitBreaker('FAILING_BREAKER', { failureThreshold: 2, recoveryTimeoutMs: 5000 });

    try {
      await breaker.execute(async () => { throw new Error('API Error 1'); });
    } catch (e) {}

    try {
      await breaker.execute(async () => { throw new Error('API Error 2'); });
    } catch (e) {}

    assert.equal(breaker.getState(), 'OPEN');

    // A próxima chamada deve falhar instantaneamente sem chamar o backend
    await assert.rejects(
      async () => {
        await breaker.execute(async () => 'should_not_run');
      },
      /O circuito está ABERTO/
    );
  });

  it('deve realizar tentativas com retryWithTenacity em falhas transitórias', async () => {
    let callCount = 0;
    const result = await retryWithTenacity(async () => {
      callCount++;
      if (callCount < 2) {
        throw new Error('Transient Network Blip');
      }
      return 'recovered_payload';
    }, { maxAttempts: 3, initialDelayMs: 20 });

    assert.equal(result, 'recovered_payload');
    assert.equal(callCount, 2);
  });
});
