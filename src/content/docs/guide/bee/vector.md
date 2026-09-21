---
title: Vector
description: Receive Bee's OTLP traces with Vector and inspect them as JSON or route them to a backend.
sidebar:
  order: 6
---

Vector is the reference node-local receiver for Bee. The sample accepts OTLP/HTTP protobuf, decodes trace events, prints them, and writes newline-delimited JSON.

## Minimal configuration

The downloadable [Vector configuration](/downloads/bee/vector.yaml) uses Vector 0.57:

```yaml
sources:
  bee:
    type: opentelemetry
    grpc:
      address: 127.0.0.1:4317
    http:
      address: 127.0.0.1:4318
    acknowledgements: false
    use_otlp_decoding:
      logs: false
      metrics: false
      traces: true

sinks:
  console:
    type: console
    inputs: [bee.traces]
    encoding:
      codec: json

  file:
    type: file
    inputs: [bee.traces]
    path: /var/lib/vector/bee-traces.json
    encoding:
      codec: json
```

Vector 0.57 requires both the `grpc` and `http` protocol blocks even though Bee uses only HTTP. Bind gRPC to loopback too.

## Run it with the Docker demo

```bash
sudo docker compose --profile vector up -d
sudo docker compose logs -f vector
```

The JSON file persists in the `vector-data` named volume:

```bash
sudo docker compose exec vector tail -n 10 /var/lib/vector/bee-traces.json
```

The `bee.traces` stream contains decoded span events. Query text and request metadata may be present, so protect the file like application telemetry.

## Route to a real backend

Replace or supplement the demo sinks with the sink supported by your destination. Keep these constraints:

- use `bee.traces` as the input;
- place a bounded disk buffer on the outgoing sink;
- keep acknowledgement and retry semantics compatible with your duplication tolerance;
- keep the local Bee receiver on loopback;
- monitor Vector's buffer and component error metrics.

If your destination accepts OTLP and you want a generic OTLP-to-OTLP relay, the OpenTelemetry Collector example is the simpler starting point. Vector is a good fit when you also need host metrics, Docker logs, transforms, or a backend-specific sink.

## Collect Bee's Prometheus metrics

Bee does not send its own operational metrics through the trace exporter. Add a Prometheus scrape source when you want Vector to carry them:

```yaml
sources:
  bee_metrics:
    type: prometheus_scrape
    endpoints:
      - http://127.0.0.1:9400/metrics
    scrape_interval_secs: 15
```

Route `bee_metrics` to your metrics backend separately from `bee.traces`.
