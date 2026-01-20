FROM node:20-bookworm

WORKDIR /app

# Dependências do sistema (Prisma + Chromium)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    openssl \
    python3 \
    make \
    g++ \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# Dependências Node
COPY package*.json ./
RUN npm ci

# Garanta permissão de execução nos binários (resolve: tsc Permission denied)
RUN chmod -R a+x /app/node_modules/.bin || true \
 && chmod -R a+x /app/node_modules/typescript/bin || true

# Prisma
COPY prisma ./prisma
RUN npx prisma generate

# Código
COPY . .

# Build TypeScript (evita depender do executável "tsc" direto)
RUN node ./node_modules/typescript/bin/tsc

EXPOSE 3002
CMD ["node", "dist/server.js"]

