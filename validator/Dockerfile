FROM --platform=linux/amd64 rust:1.76 AS builder

WORKDIR /build

# Install dependencies for Solana & plugin build
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    clang \
    cmake \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

# Clone Yellowstone plugin (correct repo is rpcpool/yellowstone-grpc)
# Use a version compatible with Solana v1.18.26
RUN git clone https://github.com/rpcpool/yellowstone-grpc.git && \
    cd yellowstone-grpc && \
    git checkout v1.15.3+solana.1.18.26 || git checkout v1.15.3+solana.1.18.25

# Build plugin (specifically the geyser plugin)
WORKDIR /build/yellowstone-grpc
RUN cargo build --release --package yellowstone-grpc-geyser

# -----------------------------
# FINAL RUNTIME IMAGE
# -----------------------------
FROM --platform=linux/amd64 debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    bzip2 \
    && rm -rf /var/lib/apt/lists/*

# Install Solana CLI
RUN sh -c "$(curl -sSfL https://release.anza.xyz/v1.18.26/install)" && \
    ln -s /root/.local/share/solana/install/active_release/bin/solana-test-validator /usr/local/bin/solana-test-validator

# Create necessary directories
RUN mkdir -p /plugins /config

# Copy plugin .so file from correct build location
COPY --from=builder /build/yellowstone-grpc/target/release/libyellowstone_grpc_geyser.so /plugins/libyellowstone_grpc_geyser.so

# Copy plugin config (make sure this file exists in your build context)
COPY plugin-config.json /config/plugin-config.json

# Set PATH for Solana binaries
ENV PATH="/root/.local/share/solana/install/active_release/bin:${PATH}"
ENV SOLANA_KEYPAIR="/root/.config/solana/id.json"

# Expose ports:
# 8899 = RPC
# 10000 = Yellowstone gRPC
EXPOSE 8899 10000

# Use the correct config path and ledger location
CMD ["solana-test-validator", "--ledger", "/ledger", "--geyser-plugin-config", "/config/plugin-config.json"]