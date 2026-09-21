---
title: Configure Bee
description: Choose the collector, discovery scope, service identity, runtime enrichment, and cross-host correlation settings.
sidebar:
  order: 7
---

Bee derives queue, ring, map, parser, and worker limits from the container's memory ceiling. A demo configuration should contain operator decisions, not copies of every derived bound.

## Minimal safe demo

```yaml
operation_mode: external_only

discovery:
  interval: 2s
  require_container: true

export:
  endpoint: http://127.0.0.1:4318

server:
  listen: 127.0.0.1:9400
```

`external_only` disables workload injection. Protocol capture, durations, status, peer resolution, process metrics, and the service graph remain external and continue to work.

## Collector endpoint

`export.endpoint` is the OTLP/HTTP base URL. Common values are:

```yaml
export:
  endpoint: http://127.0.0.1:4318
```

for a node-local collector, or:

```yaml
export:
  endpoint: http://otel-collector.observability.svc:4318
```

for a Kubernetes Service. HTTPS endpoints use the CA certificates shipped in the image. Put authorization at the local collector when possible.

## Discovery scope

For a container-only demo:

```yaml
discovery:
  require_container: true
```

To include host processes, remove that setting or set it to `false`. To restrict a busy host, set stable service names on workloads and allowlist them:

```yaml
discovery:
  service_name_allowlist: [checkout-api, inventory-api]
```

Bee excludes common reverse proxies and service-mesh processes by executable name. It does not rename a proxy span to a backend service.

## Detail thresholds

Request roots remain visible at any duration. Dependency and async detail use inclusive duration floors:

```yaml
pipeline:
  minimum_event_duration: 1s
  minimum_protocol_event_duration: 250ms
```

Lowering them increases detail and state pressure. For a quiet demo you may choose smaller values, but do not treat that as a production sizing recommendation.

## Optional Node.js enrichment

The full cooperative mode adds correlation evidence from an injected Node module. It never supplies payload, duration, or status, and Bee verifies claims against kernel observations.

Remove `operation_mode: external_only` to use the default cooperative mode. Initial enrichment requires a workload to start after the injector has prepared its filesystem/runtime. A plain agent container cannot retroactively modify an already-running Node process. For an evaluation, prove external capture first and coordinate the pre-exec Docker or Kubernetes injector setup with Obstack before enabling it fleet-wide.

The runtime channel writes preload configuration into workload filesystems. Treat this as a host mutation and test it on a disposable node first.

## Multiple Bee nodes

Cross-host trace continuation uses authenticated agent gossip. Give every node the same secret and node-specific reachable address:

```yaml
gossip:
  shared_secret: "replace-with-at-least-32-random-bytes"
  announce: 10.0.0.12:9401
  seeds:
    - 10.0.0.11:9401
    - 10.0.0.13:9401
```

Generate the shared secret outside the configuration repository:

```bash
openssl rand -base64 32
```

Distribute it with a secret manager, open UDP 9401 between Bee nodes, and never use `0.0.0.0` as `announce`. Without gossip, each host still exports valid local traces; cross-host calls remain separate trace fragments with join attributes.

## Validate before starting

```bash
docker run --rm --runtime runc --network none \
  -e RUST_LOG=error \
  -v "$PWD/bee.yaml:/etc/obstack-bee/config.yaml:ro" \
  obstackit/bee:0.3.0 \
  validate --config /etc/obstack-bee/config.yaml --print-effective-json
```

This checks schema, derived resource bounds, addresses, and removed fields without loading eBPF programs.
