FROM node:20-alpine
WORKDIR /usr/src/app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY . .
RUN pnpm i --frozen-lockfile
RUN pnpm build
ENV NODE_ENV=production
CMD ["pnpm", "start"]
