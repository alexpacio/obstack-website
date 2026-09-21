---
title: OpenTelemetry Collector
description: Receive Bee traces locally, print them for a demo, or forward them to an OTLP backend.
sidebar:
  order: 5
---

Bee sends OTLP/HTTP protobuf to a base endpoint such as `http://127.0.0.1:4318`. It does not require an OpenTelemetry SDK or Collector-specific protocol extension.

## Local debug receiver

The downloadable [collector configuration](/downloads/bee/otel-collector.yaml) defines an OTLP receiver and the Collector's `debug` exporter:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 127.0.0.1:4317
      http:
        endpoint: 127.0.0.1:4318

exporters:
  debug:
    verbosity: detailed

service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [debug]
```

The Docker and Kubernetes examples run the collector in the host network. Keeping the receiver on `127.0.0.1` prevents other machines from submitting or reading telemetry.

## Forward to an OTLP backend

Add an `otlphttp` exporter and replace `debug` in the trace pipeline:

```yaml
exporters:
  otlphttp/upstream:
    endpoint: ${env:UPSTREAM_OTLP_ENDPOINT}
    headers:
      Authorization: ${env:UPSTREAM_OTLP_AUTHORIZATION}
    sending_queue:
      enabled: true
      storage: file_storage
    retry_on_failure:
      enabled: true

extensions:
  file_storage:
    directory: /var/lib/otelcol

service:
  extensions: [file_storage]
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [otlphttp/upstream]
```

Mount `/var/lib/otelcol` on durable local storage and inject the two environment variables through Docker secrets or Kubernetes Secrets. Do not put bearer tokens in Bee's configuration; Bee only needs to trust and reach its local collector.

## Keep the collector out of Bee's traces

Bee resolves its configured collector hostname before export and puts those addresses into an eBPF exclusion map before connecting. Keep the endpoint stable and avoid putting a load balancer with more than 64 answers behind the collector name.

If the name does not resolve yet, Bee starts and retries. A malformed URL is a startup error because retrying cannot repair it.

## Collector readiness

Bee's `obstack_bee_collector_connected` gauge becomes `1` after a successful delivery. `/readyz` also accounts for collector state, so a quiet new demo may remain unready until you send the first application request.

Use `/livez` when you need to prove the agent runtime is alive before starting a workload, then use `/readyz` after traffic.
