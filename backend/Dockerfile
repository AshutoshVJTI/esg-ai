FROM oven/bun:1.1 as base

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Create uploads directory
RUN mkdir -p uploads

# Expose the application port
EXPOSE 3001

# Command to run the application
CMD ["bun", "run", "src/server.ts"]
