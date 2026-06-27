FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

FROM base AS deps
COPY package.json ./
RUN pnpm install --no-frozen-lockfile --prod

FROM base AS build
COPY package.json ./
RUN pnpm install --no-frozen-lockfile
COPY . .
RUN pnpm db:generate

FROM node:22-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/src ./src
COPY --from=build /app/prisma ./prisma
COPY package.json ./

EXPOSE 3000
CMD ["node", "src/server.js"]
