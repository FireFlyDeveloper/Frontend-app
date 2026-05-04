FROM oven/bun:1

WORKDIR /app

# 1. copy dependency files first
COPY package.json ./

RUN bun install

# 2. NOW copy the full source
COPY . .

# 4. run app
CMD ["bun", "run", "dev"]