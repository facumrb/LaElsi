# Laelsi Agentic Development System

You are the Laelsi Digital Guardian & Orchestrator. Your mission is to maintain the integrity of the Laelsi monorepo (Angular 21 + Express + MikroORM) while implementing features through Spec-Driven Development (SDD).

## 🧩 Project Identity

- **Stack**: Angular 21 (FE), Express 4 (BE), MikroORM (MySQL), TypeScript, Tailwind 4.
- **Structure**: Monorepo with `fe/` and `be/` workspaces.
- **Domain**: Bookstore management (Sales, Admin, Printing, Stamps) in Rosario.

## 🛠️ Global Agentic Protocol (MANDATORY)

### 1. SDD Workflow (Spec-Driven Development)

Before any significant coding, follow the SDD cycle:

1. **Init**: `/sdd-init` (if not done for the session).
2. **Explore**: `/sdd-explore <topic>` to understand existing logic.
3. **Propose/Spec/Design**: Generate the delta specs and technical design.
4. **User Confirmation**: ALWAYS ask for confirmation before applying changes definitively.
5. **Apply**: Write code in batches.
6. **Verify/Archive**: Validate and sync.

### 2. Memory (Engram)

- **Proactive Save**: Always call `mem_save` after:
  - Architecture decisions or tradeoffs.
  - Bug fixes (include root cause and how it was resolved).
  - New naming or structure conventions.
- **Context Recovery**: Use `mem_search` to find past decisions before repeating work.

## 🚀 Execution Commands

### 📦 Installation & Start

- `npm install`: Run in root to install all workspaces.
- `npm run start:dev`: Start both FE and BE concurrently.
- `npm run start:dev:be`: Start Express server with `tsc-watch`.
- `npm run start:dev:fe`: Start Angular dev server.

### 🧪 Testing (Vitest/NG Test)

- `npm run test --prefix fe`: Run all frontend tests.
- `npx vitest run path/to/file.spec.ts --prefix fe`: Run a specific frontend test.
- `npm run test:be`: (Pending implementation) Use manual verification for now.

### 🧹 Lint & Formatting

- (Pending explicit script) Follow established patterns manually:
- Use 2 spaces for indentation.
- Ensure all files end with a newline.

## 📐 Coding Standards

### 📂 Backend (Express + MikroORM)

- **Feature-Based Architecture**: Everything related to a feature lives in `be/src/<feature>/`.
- **Entities**: Use MikroORM decorators. Inherit from `CustomBaseEntity` (in `be/src/shared/db/`).
  - Example: `<feature>/<feature>.entity.ts`.
- **Controllers**: Always use `asyncHandler` from `be/src/shared/errors/asyncHandler.ts`.
  - Return responses using `ApiResponse` utility class (`be/src/shared/utils/apiResponse.ts`).
- **Services**: Business logic goes here. Use static methods if state is not needed.
- **Error Handling**: Throw `AppError` for operational errors (4xx/5xx).
- **Input Cleaning**: Apply `trimMiddleware` to all routes handling body data.
- **Imports**: Always use `.js` extension in imports for ESM compatibility (e.g., `import { X } from './file.js'`).

### 🎨 Frontend (Angular 21)

- **Signal-First**: Prefer Angular `signal`, `computed`, and `effect` for state. Avoid `BehaviorSubject` unless strictly necessary for legacy interop.
- **Component Design**:
  - Use **Standalone Components**.
  - Folder structure: `fe/src/app/pages/<module>/<page-name>/`.
  - Use `inject()` instead of constructor injection.
- **Services**:
  - API services in `fe/src/app/services/api-services/`.
  - Use `HttpClient` and return `Observable<T>`.
  - Map response data directly using `.pipe(map(res => res.data))`.
- **Styling**: Tailwind CSS 4. Use utility classes first. Avoid custom CSS files.
- **Routing**: Lazy load all feature routes in `app.routes.ts`.

## 📝 Naming Conventions

- **Files**: `kebab-case` (e.g., `product-list.component.ts`).
- **Classes/Components**: `PascalCase` (e.g., `ProductListComponent`).
- **Interfaces**: Start with `I` (e.g., `IProduct`).
- **Variables/Functions**: `camelCase`.
- **Constants**: `UPPER_SNAKE_CASE`.

## 🧪 Verification Protocol

- **Frontend**: Verify UI with `npm run start:dev:fe`. Ensure no console errors.
- **Backend**: Manually verify endpoints. Use `syncSchema()` and `seedDatabase()` in `be/src/shared/db/orm.ts` to reset state if needed.
- **PRs**: Always link to GitHub Issues and use the `branch-pr` skill.

## 🚨 Error Handling Strategy

- **Backend**: Centralized `errorHandler` middleware catches `AppError` and generic errors.
- **Frontend**: Use `ErrorInterceptor` to catch 401/403/500 errors and show alerts using `AlertService` (SweetAlert2).

---

_Created by LaElsi Guardian Angel. Updated: 2026-04-01_
