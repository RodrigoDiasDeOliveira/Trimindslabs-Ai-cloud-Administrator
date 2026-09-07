import { OtelTrace, OtelSpan } from '../types';

/**
 * OpenTelemetry Tracing Engine
 * Manages W3C trace context, spans, and latencies for AI multi-cloud operations.
 */
export class OpenTelemetryTracer {
  private static traces: OtelTrace[] = [];

  static startTrace(operationName: string): { traceId: string; rootSpanId: string; tracer: ActiveTrace } {
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const rootSpanId = `span-${Math.random().toString(36).substring(2, 9)}`;

    const activeTrace = new ActiveTrace(traceId, operationName, rootSpanId);
    return { traceId, rootSpanId, tracer: activeTrace };
  }

  static recordTrace(trace: OtelTrace) {
    this.traces.unshift(trace);
    if (this.traces.length > 50) {
      this.traces.pop();
    }
  }

  static getRecentTraces(): OtelTrace[] {
    return this.traces;
  }
}

export class ActiveTrace {
  private startTime: number;
  private spans: OtelSpan[] = [];
  private status: 'OK' | 'ERROR' = 'OK';

  constructor(
    public readonly traceId: string,
    public readonly operationName: string,
    public readonly rootSpanId: string
  ) {
    this.startTime = Date.now();
  }

  recordSpan(
    name: string,
    service: string,
    durationMs: number,
    attributes: Record<string, any> = {},
    status: 'OK' | 'ERROR' = 'OK'
  ): OtelSpan {
    const span: OtelSpan = {
      spanId: `span-${Math.random().toString(36).substring(2, 9)}`,
      parentSpanId: this.rootSpanId,
      name,
      service,
      status,
      durationMs,
      startTime: new Date().toISOString(),
      attributes
    };
    this.spans.push(span);
    if (status === 'ERROR') {
      this.status = 'ERROR';
    }
    return span;
  }

  finish(): OtelTrace {
    const totalDuration = Date.now() - this.startTime;
    const finishedTrace: OtelTrace = {
      traceId: this.traceId,
      rootOperation: this.operationName,
      timestamp: new Date().toISOString(),
      durationMs: totalDuration,
      spans: this.spans,
      status: this.status
    };
    OpenTelemetryTracer.recordTrace(finishedTrace);
    return finishedTrace;
  }
}
