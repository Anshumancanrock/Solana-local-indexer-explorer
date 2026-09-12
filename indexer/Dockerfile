FROM node:22-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-indexer,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir /pnpm/store

COPY . .

RUN pnpm prisma generate

# Run node directly so it is PID 1 and receives SIGTERM. Going through pnpm
# leaves the shutdown handlers in src/main.ts unreachable.
CMD ["node", "-r", "tsx/cjs", "src/main.ts"]
