# syntax=docker/dockerfile:1
# Build context is the GarticHands/ root (see docker-compose.yml).
#
# Pinned to a precise version tag. To harden further, pin by digest:
#   FROM node:22.14.0-alpine@sha256:<digest> AS deps
# Resolve the digest with: docker buildx imagetools inspect node:22.14.0-alpine

FROM node:22.14.0-alpine AS deps
WORKDIR /app
# Workspace manifests + shared lockfile = fully pinned, reproducible installs.
COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json
RUN npm ci --omit=dev

FROM node:22.14.0-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY server ./server
USER app
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "server/index.js"]
