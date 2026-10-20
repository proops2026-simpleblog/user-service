# syntax=docker/dockerfile:1

# ---- builder stage: install dependencies only ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- runtime stage: slim, non-root, production-only ----
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Create a dedicated non-root user/group to run the service.
RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY knexfile.js ./
COPY migrations ./migrations
COPY src ./src

RUN chown -R app:app /app
USER app

EXPOSE 3002

# Run pending migrations, then start the server. Idempotent: knex tracks
# already-applied migrations, so this is safe on every container start.
CMD ["sh", "-c", "npm run migrate && npm start"]
