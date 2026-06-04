FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/api

RUN node ace.js build --ignore-ts-errors

WORKDIR /app/apps/api/build

RUN CI=true pnpm install --prod --ignore-scripts

EXPOSE 3333

CMD ["node", "bin/server.js"]