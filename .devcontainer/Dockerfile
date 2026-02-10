FROM mcr.microsoft.com/devcontainers/javascript-node:20-bookworm

# Install additional OS packages
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    socat \
    lsof \
    procps \
    vim \
    iproute2 \
    net-tools \
    netcat-openbsd \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*




# Install pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set the working directory
WORKDIR /workspace

# Configure pnpm to use a home-based store and set proper permissions
RUN mkdir -p /home/node/.pnpm-store && \
    chown -R node:node /home/node && \
    chown -R node:node /workspace 2>/dev/null || true

# Create .pnpmrc to configure pnpm store location
RUN echo "store-dir=/home/node/.pnpm-store" > /home/node/.pnpmrc && \
    chown node:node /home/node/.pnpmrc

# Expose ports
EXPOSE 5173 3000