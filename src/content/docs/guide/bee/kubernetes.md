---
title: Kubernetes demo
description: Deploy one Bee and one node-local OpenTelemetry Collector per Kubernetes node, then generate a trace.
sidebar:
  order: 4
---

The demo uses the `obstack` namespace and names the agent workload, ServiceAccount, labels, and container `bee`. It runs Bee and an OpenTelemetry Collector in one host-network DaemonSet pod per node. The collector listens only on node loopback, so every Bee exports locally without relying on cluster networking.

## 1. Check the nodes

Each scheduled node must meet the [kernel and storage requirements](../requirements/). The cluster must permit privileged pods with host PID and host networking.

If Pod Security Admission enforces the restricted profile, label the dedicated namespace after creating it:

```bash
kubectl create namespace obstack --dry-run=client -o yaml | kubectl apply -f -
kubectl label namespace obstack \
  pod-security.kubernetes.io/enforce=privileged \
  pod-security.kubernetes.io/audit=privileged \
  pod-security.kubernetes.io/warn=privileged \
  --overwrite
```

## 2. Create the license Secret

Ask for an evaluation license by submitting an information request on [www.obstack.it](https://www.obstack.it/pricing/#demo). Never put the signed file in the downloadable manifest. Create the Secret in the `obstack` namespace:

```bash
kubectl -n obstack create secret generic bee-license \
  --from-file=license.json=./license.json
```

## 3. Apply the demo

```bash
curl -fsSLo bee-kubernetes.yaml https://obstack.it/downloads/bee/kubernetes.yaml
kubectl apply -f bee-kubernetes.yaml
kubectl -n obstack rollout status daemonset/bee --timeout=5m
kubectl -n bee-demo rollout status deployment/bee-demo --timeout=2m
```

The manifest also creates a small `bee-demo` Deployment and Service. Bee requires no sidecar or SDK in that application pod; only `OTEL_SERVICE_NAME=bee-demo` is set for stable attribution.

Verify the inherited descriptor limit on one Bee pod:

```bash
demo_node=$(kubectl -n bee-demo get pod -l app=bee-demo -o jsonpath='{.items[0].spec.nodeName}')
pod=$(kubectl -n obstack get pod -l app=bee \
  --field-selector "spec.nodeName=${demo_node}" \
  -o jsonpath='{.items[0].metadata.name}')
kubectl -n obstack exec "$pod" -c bee -- sh -c 'grep "open files" /proc/1/limits'
```

Use a runtime/default limit of at least 131072 on nodes with many instrumented processes.

## 4. Generate a request

```bash
kubectl -n bee-demo run bee-curl \
  --rm -i --restart=Never \
  --image=curlimages/curl:8.16.0 \
  -- http://bee-demo/
```

Then inspect the node-local collector and Bee:

```bash
kubectl -n obstack logs "$pod" -c otel-collector --since=2m
kubectl -n obstack logs "$pod" -c bee --since=2m

kubectl -n obstack exec "$pod" -c bee -- \
  curl -fsS http://127.0.0.1:9400/readyz
kubectl -n obstack exec "$pod" -c bee -- \
  curl -fsS http://127.0.0.1:9400/metrics
```

## How the DaemonSet works

- `hostPID: true` exposes every node process through `/proc`.
- `hostNetwork: true` gives Bee the node's sockets and makes the local collector reachable at `127.0.0.1:4318`.
- The root cgroup mount scopes capture to all descendant workloads on the node.
- bpffs is writable so probe links survive process replacement and can be recovered.
- BTF and tracefs are read-only host mounts.
- `/var/lib/obstack-bee` is a per-node hostPath for bounded spill and assembly storage.
- The demo's Kubernetes probes use `/livez` so rollout can complete before the first request. Check `/readyz` yourself after traffic; production deployments can use it as their readiness probe once traffic is continuous.

The example deliberately grants `privileged: true`. If your policy requires individual capabilities, Bee needs BPF, NET_ADMIN, SYS_ADMIN, and SYS_PTRACE, plus an LSM/seccomp policy that permits `bpf()` and process inspection. Test that shape on your exact kernel before treating it as equivalent.

## Use a cluster collector instead

To export to an existing collector Service:

1. Change `export.endpoint` in `bee-config` to its OTLP/HTTP base URL, for example `http://otel-collector.observability.svc:4318`.
2. Remove the `otel-collector` container, its ConfigMap, and its `otel-config` volume references.
3. Reapply the manifest and restart the DaemonSet.

Bee resolves at most 64 collector addresses and excludes them from capture before dialing. Prefer a node-local collector for predictable latency and to avoid making telemetry transport another observed application flow.

## Remove the demo

```bash
kubectl delete -f bee-kubernetes.yaml
```

The manifest uses hostPath state at `/var/lib/obstack-bee`. Bee's spill files are ephemeral and unlinked while running, but the empty host directory remains after deletion and can be removed separately if desired.
