---
title: Requirements and security model
description: Host, kernel, license, storage, networking, and privilege requirements for an Obstack Bee demo.
sidebar:
  order: 2
---

Bee is one privileged agent per Linux node. Run it in the same kernel and cgroup hierarchy as the applications it observes.

## Host checklist

| Requirement | Demo value | Why Bee needs it |
| --- | --- | --- |
| Architecture | x86-64 | The published image is currently `linux/amd64`. |
| Kernel | Linux 7.0 or newer | This is the tested kernel floor for Bee's eBPF and probe behavior. |
| Cgroups | Unified cgroup v2 | Bee attaches ingress and egress programs at the configured cgroup root. |
| Kernel BTF | `/sys/kernel/btf/vmlinux` | The embedded eBPF object relocates against the running kernel. |
| Runtime | Docker 20.10+ or Kubernetes on Linux | Bee must share the node's PID, network, and cgroup views. |
| File descriptors | soft and hard `nofile` at least 131072 | Each attached uprobe owns a BPF-link descriptor. |
| Memory | 768 MiB limit, 640 MiB reservation/request | Leaves headroom above Bee's derived 512 MiB maximum working budget. |
| Disk | At least 4 GiB plus 2 GiB or 10% free | The default bounded spill and trace-assembly budget is reserved at startup. |

Docker Desktop on macOS or Windows cannot observe the host OS. Bee can only observe Linux workloads inside the Docker Desktop VM, and that environment is not the supported demo path. Use a Linux VM instead.

## License

The public image does not contain a license. Submit an information request on [www.obstack.it](https://www.obstack.it/pricing/#demo) to ask for an evaluation license. Save the signed file you receive as `license.json`; the examples mount it read-only at `/etc/obstack-bee/license.json`.

The license is portable and is not tied to a host identifier. Keep it out of source control and Kubernetes ConfigMaps. In Kubernetes, create a Secret from the file.

## Host access

The container examples use `privileged: true` and unconfined seccomp/AppArmor profiles. Bee loads eBPF, attaches to the root cgroup, opens perf events, reads process memory, and follows `/proc/<pid>/root` into workload filesystems. Treat access to the Bee container as root-equivalent access to the node.

The important mounts are:

| Host path | Mode | Purpose |
| --- | --- | --- |
| `/proc` | read/write | Host discovery and confined runtime-channel seeding. The demo stays external-only but uses the same deployment shape. |
| `/sys/fs/cgroup` | read-only | Root cgroup attachment. |
| `/sys/fs/bpf` | read/write | Pinned uprobe links and restart recovery. |
| `/sys/kernel/btf` | read-only | Kernel BTF. |
| `/sys/kernel/tracing` | read-only | Tracepoint IDs and scheduler field layouts. |
| `/var/lib/obstack-bee` | read/write | Fixed-size spill rings and assembly storage. |
| `/etc/machine-id` | read-only | Stable host identity across container replacement. |
| `/var/run/docker.sock` | optional, read-only | Docker and Swarm service-name enrichment. |

## Prepare a Docker host

Run once on the Linux host:

```bash
sudo test -f /sys/fs/cgroup/cgroup.controllers
sudo test -f /sys/kernel/btf/vmlinux

sudo mkdir -p /sys/fs/bpf /sys/kernel/tracing /var/lib/obstack-bee
mountpoint -q /sys/fs/bpf || sudo mount -t bpf -o rw,nosuid,nodev,noexec,mode=700 bpf /sys/fs/bpf
mountpoint -q /sys/kernel/tracing || sudo mount -t tracefs -o nosuid,nodev,noexec tracefs /sys/kernel/tracing
sudo chmod 0700 /var/lib/obstack-bee
```

Most systemd distributions mount bpffs and tracefs during early boot. If you mounted them manually, make them persistent using your distribution's supported mechanism before relying on automatic Docker restart.

## Ports

| Port | Bind | Purpose |
| --- | --- | --- |
| `9400/tcp` | loopback | Bee `/livez`, `/readyz`, `/metrics`, and `/graph`. |
| `4318/tcp` | loopback | OTLP/HTTP receiver used by Bee. |
| `4317/tcp` | loopback | Required in the sample Vector/collector schema, unused by Bee. |
| `9401/udp` | node address, optional | Agent gossip for cross-host trace continuation. |

Keep diagnostics and OTLP receivers on loopback for a single-node demo. Spans may include route names and full database query text.

## Name the demo service

Set `OTEL_SERVICE_NAME` on each workload. Bee reads it from the target process environment and uses it as `service.name`:

```yaml
environment:
  OTEL_SERVICE_NAME: checkout-api
```

In Kubernetes, set the same environment variable in each application container. Bee can derive a name from container metadata, but an explicit stable name produces better traces and dashboards.
