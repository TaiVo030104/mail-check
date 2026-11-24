# Base stage
FROM node:20-alpine AS base
# Pin pnpm 9 to match lockfileVersion 9.0 (newer pnpm skips native build scripts)
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

# Copy package files first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Build stage
FROM base AS build
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Final stage
FROM base AS final

ENV NODE_ENV=production

RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy built application
COPY --from=build /app/dist /app/dist

# Copy build-info.json for version information
COPY --from=build /app/build-info.json /app/build-info.json

# Railway injects PORT; 5000 is the local default
EXPOSE 5000

CMD [ "node", "dist/main.js" ]
