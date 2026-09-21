---
title: Docker demo
description: Run Bee, a sample service, and either Vector or the OpenTelemetry Collector with Docker Compose.
sidebar:
  order: 3
---

This demo runs Bee as a standalone host-level container. That is also the correct shape on a Docker Swarm node: Swarm services cannot request host PID mode, so run one independently managed Bee container on each node.

## 1. Download the definitions

```bash
mkdir bee-demo && cd bee-demo

curl -fsSLO https://obstack.it/downloads/bee/docker-compose.yaml
curl -fsSLO https://obstack.it/downloads/bee/bee.yaml
curl -fsSLO https://obstack.it/downloads/bee/vector.yaml
curl -fsSLO https://obstack.it/downloads/bee/otel-collector.yaml
```

First ask for an evaluation license through an information request on [www.obstack.it](https://www.obstack.it/pricing/#demo). Copy the signed file you receive into the directory:

```bash
install -m 0600 /path/to/your/license.json ./license.json
```

Prepare the host mounts described in [requirements](../requirements/#prepare-a-docker-host), then pull the immutable version used by the definitions:

```bash
docker pull obstackit/bee:0.3.0
```

## 2. Choose one collector

The Compose file uses profiles because Vector and the OpenTelemetry Collector both listen on the node's `127.0.0.1:4318`. Start exactly one.

### Vector

```bash
sudo docker compose --profile vector up -d
```

### OpenTelemetry Collector

```bash
sudo docker compose --profile otel up -d
```

Bee may start before the collector. That is safe: its exporter reconnects and its bounded disk ring retains eligible batches while the receiver is unavailable.

## 3. Generate traffic

The stack includes a Python HTTP service named `bee-demo`:

```bash
for request in 1 2 3; do
  curl -fsS "http://127.0.0.1:18080/?request=${request}" >/dev/null
done
```

Wait a few seconds for batching, then inspect the selected collector.

For Vector:

```bash
sudo docker compose logs --since 1m vector
sudo docker compose exec vector tail -n 5 /var/lib/vector/bee-traces.json
```

For the OpenTelemetry Collector:

```bash
sudo docker compose logs --since 1m otel-collector
```

The output should include an HTTP SERVER span and `service.name=bee-demo`.

## 4. Check Bee itself

```bash
curl -fsS http://127.0.0.1:9400/livez
curl -fsS http://127.0.0.1:9400/readyz
curl -fsS http://127.0.0.1:9400/metrics \
  | grep -E '^obstack_bee_(collector_connected|ebpf_packets_total|spans_exported_total) '
curl -fsS http://127.0.0.1:9400/graph | python3 -m json.tool
```

Expected values after traffic:

```text
obstack_bee_collector_connected 1
obstack_bee_ebpf_packets_total <non-zero>
obstack_bee_spans_exported_total <non-zero>
```

## What the Compose definition preserves

The downloadable definition includes the parts that tend to disappear from shortened examples:

- host PID, network, cgroup, and UTS namespaces;
- host `/proc`, cgroup v2, bpffs, tracefs, machine ID, and optional Docker socket;
- a disk-backed `/var/lib/obstack-bee` directory;
- `nofile=131072` and unlimited legacy memlock;
- one CPU and 768 MiB memory/swap ceilings;
- bounded Docker logs and a 10-minute graceful stop allowance;
- the ordinary `runc` runtime, so Bee is not injected into its own container.

Do not convert Bee into a Swarm service. Install the same Compose definition or an equivalent `docker run` command once on each Swarm node.

## Stop or replace Bee

Probe teardown can take minutes on a busy host. Stop gracefully and allow the configured ten minutes:

```bash
sudo docker compose stop -t 600 bee
sudo docker compose down
```

Avoid `docker rm -f` during upgrades. Start the replacement only after the old container has exited and port 9400 is free.
