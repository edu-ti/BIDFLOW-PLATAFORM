# BidFlow Platform

Enterprise-grade bidding and auction management monorepo built with Turborepo.

## 🏗️ Architecture

```
bidflow-platform/
├── apps/                    # Aplicações principais
│   ├── web/                 # Next.js Frontend (Port 3000)
│   ├── api/                 # NestJS Backend API (Port 3001)
│   └── analytics/          # Python FastAPI Analytics (Port 3002)
├── packages/                # Packages compartilhados
│   ├── types/               # TypeScript types compartilhados
│   ├── config/             # Configurações centralizadas
│   └── ui/                 # Componentes React compartilhados
└── turbo.json               # Turborepo configuration
```

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS, TypeScript
- **Backend API**: NestJS 10, Prisma, PostgreSQL
- **Analytics**: Python FastAPI, SQLAlchemy, Pandas
- **Infrastructure**: Docker, Docker Compose
- **Monorepo**: Turborepo, npm workspaces

## 📦 Packages

### Apps
| App | Technology | Port | Description |
|-----|------------|------|-------------|
| web | Next.js 14 | 3000 | Frontend principal |
| api | NestJS 10 | 3001 | REST API + Swagger |
| analytics | FastAPI | 3002 | Analytics service |

### Shared Packages
| Package | Description |
|---------|-------------|
| @bidflow/types | TypeScript types e interfaces |
| @bidflow/config | Configurações centralizadas |
| @bidflow/ui | Componentes React compartilhados |

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 16
- Python 3.11+

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Start Docker services
npm run docker:up

# Run development servers
npm run dev
```

### Available Scripts

```bash
# Build all apps
npm run build

# Run all apps in dev mode
npm run dev

# Lint all apps
npm run lint

# Test all apps
npm run test

# Clean all build outputs
npm run clean

# Database
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to DB
npm run db:migrate    # Run migrations

# Docker
npm run docker:build  # Build containers
npm run docker:up     # Start services
npm run docker:down   # Stop services
```

## 📚 API Documentation

- **API REST**: http://localhost:3001/api/docs (Swagger)
- **Frontend**: http://localhost:3000
- **Analytics**: http://localhost:3002

## 🐳 Docker Services

| Service | Image | Port |
|---------|-------|------|
| PostgreSQL | postgres:16-alpine | 5432 |
| Redis | redis:7-alpine | 6379 |
| API | bidflow-api | 3001 |
| Web | bidflow-web | 3000 |
| Analytics | bidflow-analytics | 3002 |

## 📁 Project Structure

### apps/web
```
apps/web/
├── src/app/           # Next.js App Router
├── public/            # Static assets
├── next.config.js     # Next.js config
├── tailwind.config.js # Tailwind config
├── Dockerfile         # Production build
└── package.json
```

### apps/api
```
apps/api/
├── src/
│   ├── prisma/        # Prisma service
│   ├── users/         # Users module
│   ├── auctions/      # Auctions module
│   └── bids/          # Bids module
├── prisma/
│   └── schema.prisma  # Database schema
├── nest-cli.json
├── Dockerfile
└── package.json
```

### apps/analytics
```
apps/analytics/
├── src/
│   └── app/
│       ├── database.py     # SQLAlchemy setup
│       ├── models.py       # DB models
│       ├── schemas.py     # Pydantic schemas
│       └── routers/       # API endpoints
├── requirements.txt
├── pyproject.toml
├── Dockerfile
└── package.json
```

### packages/types
```
packages/types/
├── src/
│   ├── index.ts      # Exports
│   ├── user.ts       # User types
│   ├── auction.ts   # Auction types
│   └── bid.ts       # Bid types
├── tsconfig.json
└── package.json
```

## 🔧 Environment Variables

```env
# Root
NODE_ENV=development

# API
DATABASE_URL=postgresql://bidflow:bidflow_secret@localhost:5432/bidflow_db
REDIS_HOST=localhost
REDIS_PORT=6379

# Web
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🏢 Enterprise Features

- **Centralized configs**: Zod-based validation
- **Shared types**: End-to-end TypeScript support
- **Shared UI**: Reusable React components
- **Scalable**: Turborepo caching and parallel builds
- **Containerized**: Full Docker support
- **API Documentation**: Swagger/OpenAPI

## 📄 License

MIT