---
title: Verify and troubleshoot
description: Prove Bee is capturing and exporting, understand its health endpoints, and diagnose common demo failures.
sidebar:
  order: 8
---

Verify the path in layers: agent runtime, collector connection, kernel capture, then exported spans.

## Health and evidence

```bash
curl -fsS http://127.0.0.1:9400/livez
curl -fsS http://127.0.0.1:9400/readyz
curl -fsS http://127.0.0.1:9400/metrics > bee-metrics.txt
curl -fsS http://127.0.0.1:9400/graph | python3 -m json.tool
```

Useful metrics:

| Metric | Healthy demo |
| --- | --- |
| `obstack_bee_collector_connected` | `1` after a batch is accepted. |
| `obstack_bee_ebpf_packets_total` | Increasing while application traffic runs. |
| `obstack_bee_spans_exported_total` | Increasing after non-health requests. |
| `obstack_bee_export_errors_total` | Stable at `0`. |
| `obstack_bee_runtime_records_total` | Expected to remain `0` in the external-only demo. |

`/livez` proves the runtime is responsive. `/readyz` additionally requires discovery and collector progress. Send a request before judging readiness on a quiet new installation.

## Troubleshooting

### `/readyz` returns 503

Check that exactly one process is listening on 4318 and inspect the collector logs:

```bash
sudo ss -lntp | grep ':4318'
sudo docker compose logs --tail 100 vector otel-collector bee
```

Do not start both Compose collector profiles. If `/livez` is healthy and `collector_connected` is `0`, generate one request and check endpoint resolution and collector decoding errors.

### Packet count stays zero

Confirm cgroup v2 and host namespace settings:

```bash
test -f /sys/fs/cgroup/cgroup.controllers
docker inspect obstack-bee --format '{{.HostConfig.PidMode}} {{.HostConfig.NetworkMode}} {{.HostConfig.CgroupnsMode}}'
```

The expected output is `host host host`. Confirm `/sys/fs/cgroup` inside the container is the host hierarchy and generate traffic after Bee starts.

### Bee exits with `EPERM` or an eBPF load error

Confirm the container is privileged, seccomp and AppArmor are unconfined, kernel BTF exists, and the node has not blocked unprivileged or privileged BPF through an additional LSM policy. Kubernetes Pod Security must allow the DaemonSet.

### Bee exits with `EMFILE`

The soft descriptor limit is binding. In Docker, retain `nofile: 131072`. In Kubernetes, raise the container runtime or node service limit, then verify `/proc/1/limits` in the Bee container.

### Startup fails while reserving storage

The default aggregate disk budget is 4 GiB and Bee also keeps a free-space safety margin. Use a real disk-backed host directory at `/var/lib/obstack-bee`, check its free space, and do not place it in the container writable layer or a small tmpfs.

### Spans use generic service names

Set `OTEL_SERVICE_NAME` in the application container or pod. On Docker, also mount the socket read-only so Bee can read Swarm and container labels.

### No Node await or runtime-channel spans appear

The demo intentionally uses `external_only`. External HTTP, database, TLS, and process evidence should still appear. Follow [optional Node.js enrichment](../configuration/#optional-nodejs-enrichment) only after the external path is verified.

### A replacement cannot bind port 9400

The previous agent is still detaching probes. Wait for it to exit; on busy nodes this can take minutes. Keep the ten-minute stop timeout and do not force-remove the old container while teardown is in progress.

## Capture a diagnostic bundle

For a Docker demo, save these before restarting anything:

```bash
mkdir bee-diagnostics
curl -sS http://127.0.0.1:9400/livez > bee-diagnostics/livez.txt
curl -sS http://127.0.0.1:9400/readyz > bee-diagnostics/readyz.txt
curl -sS http://127.0.0.1:9400/metrics > bee-diagnostics/metrics.txt
curl -sS http://127.0.0.1:9400/graph > bee-diagnostics/graph.json
sudo docker inspect obstack-bee > bee-diagnostics/container.json
sudo docker logs obstack-bee > bee-diagnostics/agent.log 2>&1
```

The graph, traces, and logs may contain service names, routes, peers, and query text. Review them before sharing outside your organization.
