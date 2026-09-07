# Multi-stage build so the final image only carries what's needed to run,
# not the full dev toolchain. Works as-is on Render, Railway, Fly.io, Cloud
# Run, or anywhere else that can build from a Dockerfile.

FROM node:20-slim AS build
WORKDIR /app

# OpenSSL is required by Prisma's query engine on Debian-based images.
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

# Runs pending migrations, then starts the API. Fine for a first deployment
# and for a small team; once you have real production traffic, most teams
# move "migrate deploy" into its own CI/CD step so it's not re-attempted on
# every container restart.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
