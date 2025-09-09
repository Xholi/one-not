FROM node:20-alpine
WORKDIR /usr/src/app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY . .
RUN pnpm i --frozen-lockfile
RUN pnpm --filter server build
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
