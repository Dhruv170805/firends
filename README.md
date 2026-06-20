# LegacyLoop

A next-generation, high-performance social networking platform designed with an Offline-First architecture.

## Architecture
The application uses a full-stack turborepo monorepo:
- **Mobile App**: React Native (Expo), Nativewind, WatermelonDB (Offline-First Sync)
- **Web App**: Next.js 15, React 19, TailwindCSS, Progressive Web App (PWA)
- **Backend**: NestJS, TypeORM, Supabase (PostgreSQL), Redis Caching
- **Testing**: Playwright for E2E, A11y, and Visual Regression

## Key Features
- **Offline-First Resilience**: Mobile app utilizes WatermelonDB for immediate UI reactivity and background synchronization with the backend.
- **Advanced Security**: Helmet, CSRF protection, CSP, and strict rate-limiting (NestJS Throttler).
- **Performance Optimized**: Radis caching, PWA offline caching, and optimized DB queries.
- **Enterprise Observability**: Fully integrated with Sentry and centralized logging.

## Setup
```bash
# Install dependencies
npm install

# Start development servers
npm run web:dev
npm run server:dev
npm run mobile:start

# Run E2E Tests
npx playwright test
```

## Testing
Playwright is configured for End-to-End testing. Test results, including photos, videos, and traces generated upon test failures, are automatically saved to `test-results/` and `playwright-report/` (which are ignored in git).
