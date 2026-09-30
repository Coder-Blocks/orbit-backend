# Multi-stage build so the final image only carries what's needed to run.
FROM node:20-slim AS build
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/package.json /app/package-lock.json* ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 3000

# This project currently has a Prisma schema but no migration history.
# db push creates/updates the schema safely for this starter deployment.
# The seed is idempotent, so restarts do not duplicate demo inventory.
CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && node dist/src/main.js"]
