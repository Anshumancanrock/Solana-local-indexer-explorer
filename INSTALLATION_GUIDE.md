# Installation Guide

## Solana Local Explorer

This guide covers a clean install from zero — installing Docker, cloning the repo, starting the stack, and verifying every service came up correctly. If you just need the command-reference version, see the **Quick Start** section in [README.md](README.md); this document is the step-by-step walkthrough for a first-time setup.

---

## 1. System Requirements

| Requirement | Minimum | Notes |
|---|---|---|
| RAM | 4 GB free | Validator + Postgres + Node services running concurrently |
| Disk space | ~4 GB free | Docker images (~2 GB) + validator ledger + Postgres data volume |
| CPU | 2 cores | 4+ recommended for faster indexing under load |
| OS | macOS, Linux, or Windows 10/11 with WSL2 | Validator image is built for `linux/amd64` — on Apple Silicon (M1/M2/M3) it runs under Rosetta emulation, which is slower on first build but works correctly |
| Network | Outbound internet access during build | Required once, to pull base images and clone/build the Yellowstone gRPC plugin from source |

---

## 2. Install Docker

### macOS
1. Download **Docker Desktop for Mac** from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
2. Open the `.dmg`, drag Docker to Applications, launch it
3. Wait for the whale icon in the menu bar to show "Docker Desktop is running"
4. Verify:
   ```bash
   docker --version
   docker compose version
   ```
   Both commands must succeed. `docker compose` (space, not hyphen) is Compose V2 — this project's `docker-compose.yml` requires it.

### Linux (Ubuntu/Debian)
```bash
# Install Docker Engine
curl -fsSL https://get.docker.com | sh

# Add your user to the docker group (avoids needing sudo for every command)
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

### Windows
1. Enable WSL2: open PowerShell as Administrator and run `wsl --install`, then reboot
2. Download **Docker Desktop for Windows** from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
3. During install, ensure "Use WSL 2 instead of Hyper-V" is checked
4. Launch Docker Desktop, wait for it to report "running"
5. Verify in a WSL2 terminal (not PowerShell):
   ```bash
   docker --version
   docker compose version
   ```

---

## 3. Clone the Repository

```bash
git clone https://github.com/shubhiscoding/Solana-Local-Indexer-Explorer.git
cd Solana-Local-Indexer-Explorer
```

---

## 4. Check Required Ports Are Free

The stack binds these ports on your host machine. If anything else is already using one of them, the corresponding service will fail to start.

| Port | Used By | Check command (macOS/Linux) |
|---|---|---|
| `3000` | Explorer web UI | `lsof -i :3000` |
| `8899` | Solana RPC | `lsof -i :8899` |
| `10000` | Yellowstone gRPC | `lsof -i :10000` |
| `5433` | PostgreSQL (host-mapped) | `lsof -i :5433` |

If any command returns a process, stop it, or edit the corresponding port mapping in `docker-compose.yml` before continuing (e.g. change `"3000:3000"` to `"3001:3000"` and access the explorer on the new port instead).

On Windows (PowerShell): `Get-NetTCPConnection -LocalPort 3000` (repeat per port).

---

## 5. Build and Start the Stack

```bash
docker compose up --build -d
```

**What happens, in order:**
1. Docker builds the `validator` image — this compiles the Yellowstone gRPC Geyser plugin from source (Rust), which takes several minutes on first build. Subsequent builds are cached and much faster.
2. Docker builds the `indexer` and `explorer` images (Node.js/TypeScript — faster than the validator build).
3. `validator` and `postgres` start and must each report healthy via their health checks before `indexer` starts.
4. `indexer` starts, connects to the validator's gRPC endpoint, and begins streaming.
5. `explorer` starts once the indexer has started.

**First build time:** typically 5–15 minutes depending on connection speed and CPU (the validator's Rust build is the bottleneck). Subsequent `docker compose up -d` runs (without `--build`) start in seconds.

---

## 6. Verify the Installation

### 6.1 Check all services are healthy

```bash
docker compose ps
```

Expected output — all four rows `Up`, and `validator`/`postgres` specifically showing `(healthy)`:

```
NAME                STATUS
explorer-postgres   Up ... (healthy)
solana-explorer     Up ...
solana-indexer      Up ...
solana-validator    Up ... (healthy)
```

If a service isn't healthy after ~60 seconds, see the **Troubleshooting** section below.

### 6.2 Check the validator RPC responds

```bash
curl http://localhost:8899 -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getSlot"}'
```
Expected: a JSON response like `{"jsonrpc":"2.0","result":1234,"id":1}` — the exact slot number will differ.

### 6.3 Check the explorer UI is reachable

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
```
Expected: `200`

Then open **http://localhost:3000** in a browser — you should see the dashboard (see screenshots in [README.md](README.md#screenshots)).

### 6.4 Check the indexer is actually indexing

```bash
docker compose logs indexer --tail 20
```
You should see lines like `Connecting to Yellowstone gRPC: ...`, `Subscribed to slots and transactions`, and (once the validator produces transactions) `Indexed transaction ...`.

### 6.5 Generate a test transaction and confirm it appears

```bash
docker exec solana-validator solana-keygen new -o /root/.config/solana/id.json --no-bip39-passphrase --force
docker exec solana-validator solana airdrop 5 --url http://127.0.0.1:8899
docker exec solana-validator solana transfer --allow-unfunded-recipient 11111111111111111111111111111112 0.01 --url http://127.0.0.1:8899
```

Refresh **http://localhost:3000** — the transaction count should increase and the new transaction should appear in the recent-transactions table within a few seconds.

---

## 7. (Optional) Local Development Setup

Only needed if you want to run `explorer` or `indexer` outside Docker for faster iteration.

**Prerequisites:** Node.js 20+, pnpm 10.x

```bash
# Install pnpm if you don't have it
corepack enable
corepack prepare pnpm@10.27.0 --activate

cd explorer
pnpm install
pnpm db:generate    # regenerate Prisma client after any schema change
pnpm dev            # runs on http://localhost:3000, connects to the Dockerized Postgres on :5433
```

```bash
cd indexer
pnpm install
pnpm dev             # connects to YELLOWSTONE_ADDR (defaults to localhost:10000)
```

---

## 8. Running the Test Suite

```bash
cd explorer && pnpm install && pnpm test   # serialization unit tests
cd ../indexer && pnpm install && pnpm test # gRPC parsing unit tests
```

Both should report all tests passing. See [TEST_CASES_AND_VALIDATION.md](TEST_CASES_AND_VALIDATION.md) for the full test log, including the live functional tests run against the Docker stack.

---

## 9. Stopping / Resetting

```bash
# Stop all services (keeps data)
docker compose down

# Stop and delete all data (fresh ledger + empty database on next start)
docker compose down -v
```

---

## 10. Troubleshooting Installation Issues

| Symptom | Cause | Fix |
|---|---|---|
| `docker: command not found` | Docker not installed or not on PATH | Reinstall Docker Desktop / Docker Engine (Section 2), restart terminal |
| `docker compose` fails with "unknown command" | Old Docker Compose V1 (`docker-compose`, hyphenated) instead of V2 | Update Docker Desktop, or install the Compose V2 plugin separately on Linux |
| Port already in use / bind error on startup | Another process holds one of the required ports (Section 4) | Free the port or remap it in `docker-compose.yml` |
| Validator build hangs or fails on `cargo build` | Slow/unstable network during first build (compiling Yellowstone plugin from source), or insufficient RAM | Retry `docker compose up --build -d`; ensure Docker Desktop has ≥4 GB RAM allocated (Docker Desktop → Settings → Resources) |
| `indexer` container restarts in a loop | Validator/Postgres not yet healthy, or wrong `DATABASE_URL` | `docker compose logs indexer`; confirm `docker compose ps` shows validator/postgres `healthy` first |
| Explorer loads but shows zero transactions | No transactions have been sent yet | Run the test-transaction steps in Section 6.5 |
| Apple Silicon: build is very slow | `linux/amd64` image runs under Rosetta emulation | Expected on first build; subsequent builds are cached and faster |
| WSL2: Docker Desktop doesn't detect WSL | WSL2 not properly enabled or Docker Desktop's WSL integration is off | Docker Desktop → Settings → Resources → WSL Integration → enable for your distro |
