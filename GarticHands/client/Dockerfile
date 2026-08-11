# syntax=docker/dockerfile:1
# Build context is the GarticHands/ root (see docker-compose.yml).
# Stage 1 builds the Vite SPA; stage 2 serves it via unprivileged nginx and
# reverse-proxies API + Socket.IO traffic to the server container.

FROM node:22.14.0-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json
RUN npm ci
COPY client ./client
# Empty default = relative (same-origin) API calls, resolved by the nginx proxy.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build -w @gartichands/client

# nginx-unprivileged runs as a non-root user and listens on 8080 by default.
FROM nginxinc/nginx-unprivileged:1.27.4-alpine AS runtime
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null 2>&1 || exit 1
