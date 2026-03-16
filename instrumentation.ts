/**
 * Next.js instrumentation hook
 *
 * Bootstraps the OpenTelemetry SDK once on server startup.
 * Exports traces and metrics to the configured OTLP endpoint
 * (defaults to http://localhost:4318 for local Grafana stack).
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/open-telemetry
 * @see docs/decisions/ for observability stack decisions
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { getNodeAutoInstrumentations } =
      await import("@opentelemetry/auto-instrumentations-node");
    const { OTLPTraceExporter } =
      await import("@opentelemetry/exporter-trace-otlp-http");
    const { OTLPMetricExporter } =
      await import("@opentelemetry/exporter-metrics-otlp-http");
    const { metrics: sdkMetrics } = await import("@opentelemetry/sdk-node");
    const { PeriodicExportingMetricReader } = sdkMetrics;
    const { defaultResource, resourceFromAttributes } =
      await import("@opentelemetry/resources");
    const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } =
      await import("@opentelemetry/semantic-conventions");
    const { getEnv } = await import("@/lib/env");

    const env = getEnv();
    const otlpEndpoint =
      env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318";

    const sdk = new NodeSDK({
      resource: defaultResource().merge(
        resourceFromAttributes({
          [ATTR_SERVICE_NAME]: env.OTEL_SERVICE_NAME,
          [ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? "0.0.0",
        })
      ),
      traceExporter: new OTLPTraceExporter({
        url: `${otlpEndpoint}/v1/traces`,
      }),
      metricReader: new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
          url: `${otlpEndpoint}/v1/metrics`,
        }),
        exportIntervalMillis: 10_000,
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          // File system instrumentation is very noisy; disable it
          "@opentelemetry/instrumentation-fs": { enabled: false },
        }),
      ],
    });

    try {
      await sdk.start();
    } catch (error) {
      // Do not crash the app on observability startup failure,
      // but log for visibility and debugging.
      console.error("Failed to start OpenTelemetry NodeSDK", error);
    }
  }
}
