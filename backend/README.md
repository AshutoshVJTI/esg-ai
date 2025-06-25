# Carbon Emissions Compliance AI - Backend

This is the backend service for the Carbon Emissions Compliance AI application. It provides APIs for managing ESG standards and analyzing sustainability reports for compliance.

## Technologies

- [Bun](https://bun.sh/) - JavaScript runtime & package manager
- [Elysia](https://elysiajs.com/) - Fast and type-safe web framework
- [Prisma](https://www.prisma.io/) - Type-safe database ORM
- TypeScript - Programming language

## Prerequisites

- [Bun](https://bun.sh/) (v1.0.0 or higher)

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your configuration.

3. Set up the database:
   ```bash
   bun run db:generate
   bun run db:push
   ```

## Development

Start the development server:
```bash
bun run dev
```

The server will start at `http://localhost:3000` with hot reloading enabled.

## API Documentation

Once the server is running, you can access the Swagger documentation at:
```
http://localhost:3000/swagger
```

## Available Scripts

- `bun run dev` - Start development server with hot reloading
- `bun run start` - Start production server
- `bun run build` - Build for production
- `bun run typecheck` - Run TypeScript type checking
- `bun run format` - Format code with Prettier
- `bun run lint` - Lint and fix code with ESLint
- `bun run test` - Run tests
- `bun run db:generate` - Generate Prisma client
- `bun run db:push` - Push database schema changes
- `bun run db:studio` - Open Prisma Studio

## Project Structure

```
src/
├── routes/          # API route handlers
├── models/          # Database models and types
├── services/        # Business logic
├── utils/           # Utility functions
└── server.ts        # Main application entry
```

## API Routes

### Standards

- `GET /api/standards` - Get all standards
- `GET /api/standards/:id` - Get a specific standard
- `POST /api/standards` - Create a new standard
- `PUT /api/standards/:id` - Update a standard
- `DELETE /api/standards/:id` - Delete a standard

### Reports

- `GET /api/reports` - Get all reports
- `GET /api/reports/:id` - Get a specific report
- `POST /api/reports` - Upload and analyze a new report
- `PUT /api/reports/:id` - Update a report
- `DELETE /api/reports/:id` - Delete a report

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
