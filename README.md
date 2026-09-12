# Solana Local Explorer

[![CI](https://github.com/Anshumancanrock/Solana-local-indexer-explorer/actions/workflows/ci.yml/badge.svg)](https://github.com/Anshumancanrock/Solana-local-indexer-explorer/actions/workflows/ci.yml)

A self-hosted block explorer for a local Solana validator. It runs a test validator with the Yellowstone gRPC Geyser plugin, streams transactions into PostgreSQL, and serves them through a Next.js UI and a small REST API.

Public explorers only see public clusters, so transactions on a local or private validator are invisible to them. Writing your own indexer means handling the Geyser gRPC stream, a database schema, and a frontend. This repo packages all of that behind a single `docker compose` command.

What you get:

- Transactions streamed from a local test validator, or from any Yellowstone gRPC endpoint including devnet, testnet, and mainnet providers
- Transactions, accounts, and per-transaction balance history stored in PostgreSQL
- A dashboard, transaction list and detail pages, and account pages with balance filtering
- REST endpoints for querying the indexed data
- Everything in Docker, so no local Rust toolchain, Solana CLI, or Postgres install is required

[Watch the demo video](https://www.loom.com/share/67ac946f6bf04277842b41423a0b5730) for a walkthrough of the setup and the explorer features.

If this is your first time setting it up, [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) covers installing Docker, verifying each step, and troubleshooting.

## Screenshots

| Dashboard | Transactions |
|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Transactions](docs/screenshots/transactions.png) |

| Transaction detail | Account detail |
|---|---|
| ![Transaction detail](docs/screenshots/transaction-detail.png) | ![Account detail](docs/screenshots/account-detail.png) |

## Requirements

| Requirement | Notes |
|---|---|
| Docker Desktop | 24.x or newer, with Compose v2 (`docker compose`, not `docker-compose`) |
| Disk space | About 4 GB for the validator ledger, Postgres data, and built images |
| Free ports | `3000` (explorer), `8899` (Solana RPC), `10000` (Yellowstone gRPC), `5433` (Postgres) |
| OS | macOS, Linux, or Windows with WSL2 |

The validator image is pinned to `linux/amd64`, so on Apple Silicon it runs under emulation. The first build is slow; later runs are cached.

Working on the `explorer` or `indexer` packages outside Docker also needs Node.js 20 or newer and pnpm 10.x (the `packageManager` field pins `pnpm@10.27.0`).

## Quick start

```bash
docker compose up --build -d
```

All four services start in dependency order. The validator and PostgreSQL come up first, the indexer waits until both are healthy, and the explorer waits for the indexer. Then open http://localhost:3000.

To check that everything came up:

```bash
docker compose ps
```

All four rows should read `Up`, with the validator and postgres showing `Up (healthy)`.

## Services

| Service | Container | Ports | Description |
|---|---|---|---|
| Validator | `solana-validator` | `8899` RPC, `10000` gRPC | Solana test validator with the Yellowstone gRPC Geyser plugin |
| PostgreSQL | `explorer-postgres` | `5433:5432` | Stores transactions, accounts, account/transaction links, and per-transaction balances |
| Indexer | `solana-indexer` | none | Streams transactions over gRPC and writes them to PostgreSQL |
| Explorer | `solana-explorer` | `3000` | Next.js UI |

From the host:

- Explorer UI: http://localhost:3000
- Solana RPC: http://localhost:8899
- gRPC: `localhost:10000`
- Database: `postgresql://postgres:password@localhost:5433/explorer`

## The UI

The dashboard at `/` shows stat cards for total transactions, failures, success rate, and latest slot, along with an activity chart and a recent transactions table. It refreshes every 5 seconds.

`/transactions` is a paginated table of everything indexed so far. Clicking through to `/transactions/[signature]` gives the full record: accounts (each linking to its account page), instructions, fees, compute units, memos, and error logs for failed transactions.

`/accounts/[address]` shows the address, when it was first and last seen, its latest indexed balance, and a paginated balance history with the pre-balance, post-balance, and change for each transaction. The history can be filtered by an exact amount or a range, in either SOL or lamports.

The navbar search (Cmd+K) does a prefix match across transaction signatures and account addresses, and needs at least 8 characters.

## Account and balance indexing

For each successful transaction, the indexer reads `preBalances` and `postBalances` from the transaction metadata, the same fields Solana RPC returns from `getTransaction`, and writes one `AccountBalance` row per account key index, linked back to the transaction. Every address involved in a transaction also gets an `Account` row, so its account page becomes reachable as soon as it has been seen once.

Balance rows only exist for transactions indexed after balance tracking was added. Older transactions still appear on the transaction detail page, but an account page may report "Account not found" until a newer transaction involving that address is indexed.

## API routes

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/stats` | Dashboard stats and recent transactions |
| `GET` | `/api/transactions?page=&limit=` | Paginated transaction list |
| `GET` | `/api/transactions/[signature]` | A single transaction by signature, including failed ones |
| `GET` | `/api/accounts/[address]` | Account metadata, latest balance, and paginated balance rows with their transaction signatures |
| `GET` | `/api/search?q=` | Prefix search over signatures and addresses, minimum 8 characters |

`page` and `limit` work the same way everywhere: they default to page 1 and 20 rows, and the account endpoint caps `limit` at 100.

The account endpoint also takes amount filters:

- `field` picks what to filter on: `postBalance` (default), `preBalance`, or `balanceChange`
- `amount` matches exactly, or use `minAmount` and `maxAmount` for a range
- `unit` is `sol` (default) or `lamports`

## Common commands

```bash
# start
docker compose up -d

# logs, all services or just one
docker compose logs -f
docker compose logs -f indexer

# rebuild after changing code
docker compose up --build -d

# stop
docker compose down

# regenerate the Prisma client when working on the explorer locally
cd explorer && pnpm db:generate
```

To generate some traffic, create a keypair inside the validator container and send a transfer:

```bash
docker exec solana-validator solana-keygen new -o /root/.config/solana/id.json --no-bip39-passphrase --force
docker exec solana-validator solana airdrop 5 --url http://127.0.0.1:8899
docker exec solana-validator solana transfer --allow-unfunded-recipient 11111111111111111111111111111112 0.01 --url http://127.0.0.1:8899
```

## Tests

Both packages have unit tests under Vitest, covering data serialization in the explorer and gRPC payload parsing in the indexer:

```bash
cd explorer && pnpm install && pnpm test
cd indexer && pnpm install && pnpm test
```

## Pointing the indexer at another gRPC endpoint

The indexer talks to the local validator by default, but it will connect to any Yellowstone gRPC endpoint, including devnet, testnet, and mainnet providers. Set the address inline:

```bash
YELLOWSTONE_ADDR=your-grpc-host:10000 YELLOWSTONE_XTOKEN=your-token docker compose up -d
```

Or set it in `docker-compose.yml`:

```yaml
indexer:
  environment:
    DATABASE_URL: postgresql://postgres:password@postgres:5432/explorer
    YELLOWSTONE_ADDR: your-grpc-host:10000
    YELLOWSTONE_XTOKEN: your-auth-token  # only if the endpoint requires auth
```

`YELLOWSTONE_ADDR` accepts either `host:port` or a full URL such as `http://host:port` or `https://host:port`. The same variable works when running the indexer directly:

```bash
YELLOWSTONE_ADDR=your-grpc-host:10000 pnpm dev
```

## Using an existing ledger

To run against a `test-ledger` directory you already have, swap the named volume in `docker-compose.yml` for a bind mount:

```yaml
volumes:
  # - validator-ledger:/ledger
  - ./test-ledger:/ledger
```

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `docker compose up` fails on a port conflict | Something else is on `3000`, `8899`, `10000`, or `5433` | Stop it, or change the port mappings in `docker-compose.yml` |
| The indexer container keeps restarting | The validator or Postgres is not healthy yet, or `DATABASE_URL` is wrong | Check `docker compose ps` and `docker compose logs indexer` |
| No transactions in the explorer | Nothing has been indexed yet | Send a test transaction, then look for `Indexed transaction ...` in `docker compose logs indexer` |
| An account page says "Account not found" | That address has no balance rows yet | Send a transaction involving it, or query the `Account` table directly |
| The `solana` CLI on the host cannot connect | Wrong RPC URL | Confirm the validator is healthy, then `solana config set --url http://localhost:8899` |
| Prisma client errors after pulling new code | The schema changed but the client was not regenerated | `cd explorer && pnpm db:generate`, or rebuild the images |

## Tech stack

Solana test validator v1.18.26 with the Yellowstone gRPC Geyser plugin v1.15.3, a TypeScript indexer using the Yellowstone gRPC client and Prisma, PostgreSQL 15, and a Next.js 16 App Router frontend with Tailwind CSS v4 and Prisma 5. Tests run on Vitest.
