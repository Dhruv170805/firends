# server/Dockerfile
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root lockfile and server package.json
COPY package.json package-lock.json ./
COPY server/package.json ./server/

RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the NestJS server
RUN npm run build --workspace server

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nestjs
RUN adduser --system --uid 1001 nestjs

# Copy bundled dependencies and dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package.json ./server/package.json

USER nestjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server/dist/main.js"]
