FROM oven/bun:1

WORKDIR /app

COPY package.json ./
RUN bun install
RUN bun run build

COPY . .

CMD ["bun", "run", "start"]