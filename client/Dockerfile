ARG NODE_VERSION=24.19.0

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /src

ARG NPM_REGISTRY=https://npm.hallboard.ir
ARG PNPM_VERSION=11.8.0
ENV COREPACK_ENABLE_PROJECT_SPEC=0 \
    NPM_CONFIG_REGISTRY=$NPM_REGISTRY \
    PNPM_CONFIG_REGISTRY=$NPM_REGISTRY

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && corepack install --global pnpm@${PNPM_VERSION}
RUN pnpm install --frozen-lockfile

COPY angular.json tsconfig.json ./
COPY projects/ projects/
RUN pnpm build

FROM build AS test
RUN pnpm test

FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000
EXPOSE 4000

COPY --from=build --chown=node:node /src/dist/web ./

USER node
CMD ["node", "server/server.mjs"]
