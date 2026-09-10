# Solana Local Explorer

A self-hosted Solana blockchain explorer with a test validator, gRPC indexer, PostgreSQL database, and Next.js web UI.

## The Problem

Running a Solana validator or gRPC endpoint? **You can't easily query transactions without building a custom explorer.** Public explorers don't show private validator data. Building your own requires expertise in gRPC, databases, and frontend frameworks — a multi-day engineering task.

**Solana Local Explorer** solves this: index and explore your validator's transactions with one Docker command. No infrastructure knowledge required.

## The Solution

- 🚀 **One Command:** `docker compose up --build -d`
- 🔗 **Works With:** Local Solana test validator or custom Yellowstone gRPC endpoints (devnet/testnet/mainnet)
- 📊 **Real-Time:** Stream and index transactions as they happen
- 💾 **Persistent:** PostgreSQL stores transactions, accounts, and balance history
- 🎨 **Interactive UI:** Dashboard, transaction details, account balances
- 🔌 **REST APIs:** Query data programmatically
- 📦 **Zero Dependencies:** Docker handles everything

## Demo

📹 **[Watch the demo video](https://www.loom.com/share/67ac946f6bf04277842b41423a0b5730)** — walkthrough of setup and every explorer feature.

## Screenshots

| Dashboard | Transactions |
|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Transactions](docs/screenshots/transactions.png) |

| Transaction Detail | Account Detail |
|---|---|
| ![Transaction Detail](docs/screenshots/transaction-detail.png) | ![Account Detail](docs/screenshots/account-detail.png) |

---

> For a full first-time setup walkthrough (installing Docker, verifying every step, troubleshooting), see [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md).

## Prerequisites

| Requirement | Version / Notes |
|---|---|
| Docker Desktop | 24.x or newer, with Docker Compose v2 (`docker compose`, not `docker-compose`) |
| Free disk space | ~4 GB (validator ledger + Postgres data + built images) |
| Free ports on host | `3000` (explorer), `8899` (Solana RPC), `10000` (Yellowstone gRPC), `5433` (Postgres) |
| OS | macOS, Linux, or Windows with WSL2 — tested on macOS (Apple Silicon, via `platform: linux/amd64` in the validator service) |

Optional, only needed for local (non-Docker) development on the `explorer` or `indexer` packages:
- Node.js 20+
- pnpm 10.x (`packageManager` field pins `pnpm@10.27.0`)

No local Solana CLI, Rust toolchain, or PostgreSQL install is required to just run the stack — Docker handles all of it.

---

## Quick Start

```bash
docker compose up --build -d
```

That's it. All four services start automatically with proper dependency ordering:

1. **Validator** + **PostgreSQL** start first
2. **Indexer** starts after both are healthy
3. **Explorer** starts after the indexer is running

Open **http://localhost:3000** to view the explorer.

To confirm everything came up correctly:

```bash
docker compose ps
```

All four rows should show `Up` (validator and postgres should show `Up (healthy)`).

## Services

| Service | Container | Ports | Description |
|---------|-----------|-------|-------------|
| Validator | `solana-validator` | `8899` (RPC), `10000` (gRPC) | Solana test-validator with Yellowstone gRPC Geyser plugin |
| PostgreSQL | `explorer-postgres` | `5433` (host) → `5432` | Stores transactions, accounts, account–tx links, and per-tx account balances |
| Indexer | `solana-indexer` | — | Streams transactions via gRPC and writes to PostgreSQL |
| Explorer | `solana-explorer` | `3000` | Next.js web UI — dashboard, transaction list, transaction detail, account detail |

## Explorer UI

- **Dashboard** (`/`) — stat cards (total txs, failed, success rate, latest slot) + a live transaction-activity chart + recent transactions table. Auto-refreshes every 5s.
- **Transaction List** (`/transactions`) — paginated table of all transactions with a refresh button.
- **Transaction Detail** (`/transactions/[signature]`) — full detail: accounts (clickable links to the account page), instructions, fees, compute units, memos, error logs.
- **Account Detail** (`/accounts/[address]`) — address, first/last seen, latest balance (from indexed metadata), and a paginated **balance history** table (pre/post balance and change per transaction) with amount filtering (exact/min/max, in SOL or lamports). Data appears for accounts that appear in transactions indexed after balance tracking was enabled.
- **Global Search** (navbar, ⌘K) — prefix search across transaction signatures and account addresses (minimum 8 characters).

## Account indexing & balances

The indexer reads `preBalances` and `postBalances` from each successful transaction's metadata (same fields Solana RPC exposes on `getTransaction`) and stores one row per account key index in the `AccountBalance` table, linked to the transaction. The `Account` table is still updated for every involved address so you can open an account page once that address has been seen.

**Note:** Only transactions indexed while this feature is deployed will have `AccountBalance` rows. Older rows in `Transaction` without corresponding balance records will still show on the transaction detail page, but the account page may show "Account not found" until a newer transaction involving that address is indexed.

## API routes

| Method | Route | Description |
|--------|--------|-------------|
| `GET` | `/api/stats` | Dashboard stats and recent transactions |
| `GET` | `/api/transactions?page=&limit=` | Paginated transaction list |
| `GET` | `/api/transactions/[signature]` | Single transaction (or failed tx) by signature |
| `GET` | `/api/accounts/[address]?page=&limit=&field=&amount=&minAmount=&maxAmount=&unit=` | Account metadata, latest balance (from indexed history), paginated balance rows with linked transaction signatures, and optional amount filtering |
| `GET` | `/api/search?q=` | Prefix search across transaction signatures and account addresses (minimum 8 characters) |

Query parameters `page` and `limit` follow the same conventions as the transaction list (defaults: page 1, limit 20; max limit 100 for accounts).

Amount filter parameters on `/api/accounts/[address]`:
- `field` — `postBalance` (default), `preBalance`, or `balanceChange`
- `amount` — exact match; or `minAmount`/`maxAmount` for a range
- `unit` — `sol` (default) or `lamports`

## Common Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f              # all services
docker compose logs -f indexer      # specific service

# Rebuild after code changes
docker compose up --build -d

# Regenerate Prisma client for local explorer dev
cd explorer && pnpm db:generate

# Stop everything
docker compose down

# Send a test transaction (from inside the validator container)
docker exec solana-validator solana-keygen new -o /root/.config/solana/id.json --no-bip39-passphrase --force
docker exec solana-validator solana airdrop 5 --url http://127.0.0.1:8899
docker exec solana-validator solana transfer --allow-unfunded-recipient 11111111111111111111111111111112 0.01 --url http://127.0.0.1:8899
```

## Running Tests

Automated unit tests exist for both the `explorer` (data serialization) and `indexer` (gRPC payload parsing) packages:

```bash
# Explorer: serialization tests
cd explorer && pnpm install && pnpm test

# Indexer: gRPC transaction-parsing tests
cd indexer && pnpm install && pnpm test
```

For the full manual/functional test log and results (60 test cases run against a live stack), see [TEST_CASES_AND_VALIDATION.md](TEST_CASES_AND_VALIDATION.md).

## Access from Host

- **Explorer UI**: http://localhost:3000
- **Solana RPC**: http://localhost:8899
- **gRPC**: localhost:10000
- **Database**: `postgresql://postgres:password@localhost:5433/explorer`

## Using an Existing Ledger

To use your existing `test-ledger` directory instead of a fresh ledger, update `docker-compose.yml`:

```yaml
volumes:
  # Comment out the named volume and use bind mount:
  # - validator-ledger:/ledger
  - ./test-ledger:/ledger
```

## Connecting to a Custom gRPC

To connect the indexer to a custom Yellowstone gRPC endpoint instead of the local validator — this also works against **devnet, testnet, or mainnet** gRPC providers, not just local validators:

**Direct command (no file edits needed):**
```bash
YELLOWSTONE_ADDR=your-grpc-host:10000 YELLOWSTONE_XTOKEN=your-token docker compose up -d
```

**Or modify `docker-compose.yml`:**
```yaml
indexer:
  environment:
    DATABASE_URL: postgresql://postgres:password@postgres:5432/explorer
    YELLOWSTONE_ADDR: your-grpc-host:10000
    YELLOWSTONE_XTOKEN: your-auth-token  # optional, if gRPC requires auth
```

**Format:** `YELLOWSTONE_ADDR` accepts either `host:port` or full URLs (`http://host:port`, `https://host:port`).

**Local development:**
```bash
YELLOWSTONE_ADDR=your-grpc-host:10000 pnpm dev
```

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `docker compose up` fails with a port conflict | Another process is already using `3000`, `8899`, `10000`, or `5433` | Stop the conflicting process, or edit the port mappings in `docker-compose.yml` |
| `indexer` container keeps restarting | Validator or Postgres not yet healthy, or `DATABASE_URL` misconfigured | Run `docker compose logs indexer` and `docker compose ps` — confirm validator/postgres show `healthy` first |
| Explorer shows no transactions | Indexer hasn't received any traffic yet, or isn't connected | Send a test transaction (see Common Commands above), then check `docker compose logs indexer` for `"Indexed transaction ..."` lines |
| Account page shows "Account not found" | That address has no `AccountBalance` rows yet (only new transactions after balance-tracking was deployed are tracked) | Send a new transaction involving that address, or check the `Account` table directly |
| `solana` CLI on host can't connect | Validator not exposed, or wrong RPC URL configured | Confirm `docker compose ps` shows the validator `healthy`, then run `solana config set --url http://localhost:8899` |
| Prisma client errors after pulling new code | Prisma schema changed but client wasn't regenerated | `cd explorer && pnpm db:generate` (or rebuild the indexer/explorer images) |
| Apple Silicon (M1/M2/M3) build issues | Validator image is pinned to `linux/amd64` and runs under emulation | Expected — first build/run is slower under Rosetta; subsequent runs are cached |

## Tech Stack

- **Validator**: Solana test-validator v1.18.26 + Yellowstone gRPC Geyser plugin v1.15.3
- **Indexer**: TypeScript, Yellowstone gRPC client, Prisma ORM
- **Database**: PostgreSQL 15
- **Explorer**: Next.js 16 (App Router), Tailwind CSS v4, Prisma 5
- **Testing**: Vitest (unit tests for serialization and gRPC parsing logic)
