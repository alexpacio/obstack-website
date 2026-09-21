---
title: Run Obstack Bee
description: A practical demo guide for running Bee with Docker or Kubernetes and receiving its OTLP traces with Vector or the OpenTelemetry Collector.
sidebar:
  label: Overview
  order: 1
---

Obstack Bee is a host-level Linux observability agent. It discovers application processes from the host's `/proc`, captures TCP traffic with eBPF, parses application protocols, correlates calls where it has evidence, and exports traces as OTLP/HTTP protobuf.

This guide gets a demo from zero to a visible trace using the published `obstackit/bee:0.3.0` image. It includes complete Docker Compose and Kubernetes definitions and two collector choices:

- **OpenTelemetry Collector** prints traces and can forward them to any OTLP backend.
- **Vector** prints traces and writes newline-delimited JSON for direct inspection.

```text
application containers or pods
            │ TCP observed at the host cgroup
            ▼
   one Bee agent per Linux node
            │ OTLP/HTTP protobuf :4318
            ▼
 Vector or OpenTelemetry Collector
            │
            ├── terminal / JSON file for this demo
            └── your tracing backend
```

## Pick a deployment

| Environment | Start here | Collector supplied by the example |
| --- | --- | --- |
| One Linux host, Docker, or Docker Swarm | [Docker demo](./docker/) | Choose Vector or OpenTelemetry Collector |
| Kubernetes, k3s, or kind on Linux nodes | [Kubernetes demo](./kubernetes/) | Node-local OpenTelemetry Collector sidecar |

Read [requirements](./requirements/) before starting. Bee needs host visibility and kernel privileges that ordinary application containers do not need.

:::note[Safe demo mode]
The downloadable examples set `operation_mode: external_only`. Bee observes traffic and produces protocol spans, metrics, and a service graph without installing its optional Node.js runtime channel into workloads. Enable cooperative enrichment later, after you understand the host mutation boundary.
:::

## What success looks like

After sending a request to the included `bee-demo` service:

1. `http://127.0.0.1:9400/livez` returns `ok`.
2. `http://127.0.0.1:9400/readyz` returns `ready` after the collector accepts telemetry.
3. `obstack_bee_ebpf_packets_total` and `obstack_bee_spans_exported_total` increase.
4. The collector prints or stores a SERVER span for service `bee-demo`.

Bee exports **traces** over OTLP. Its own health and pressure metrics use Prometheus exposition at `/metrics`; its current service graph is JSON at `/graph`.

## Files you can download

- [Docker Compose stack](/downloads/bee/docker-compose.yaml)
- [Bee demo configuration](/downloads/bee/bee.yaml)
- [Vector configuration](/downloads/bee/vector.yaml)
- [OpenTelemetry Collector configuration](/downloads/bee/otel-collector.yaml)
- [Kubernetes demo manifest](/downloads/bee/kubernetes.yaml)

The public image contains the production binary and requires a signed evaluation or subscription license. Ask for one by submitting an information request on [www.obstack.it](https://www.obstack.it/pricing/#demo) before starting the agent.
