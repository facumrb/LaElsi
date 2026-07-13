---
trigger: always_on
description: Coding standards, naming conventions, and architectural patterns for the LaElsi monorepo (Angular 21 + Express + MikroORM).
---

## Backend (Express + MikroORM)

- **Feature-Based Architecture**: Everything related to a feature lives in `be/src/<feature>/`.
- **Entities**: Use MikroORM decorators. Inherit from `CustomBaseEntity` (`be/src/shared/db/`).
  - Example: `<feature>/<feature>.entity.ts`.
- **Controllers**: Always use `asyncHandler` from `be/src/shared/errors/asyncHandler.ts`.
  - Return responses using `ApiResponse` utility class (`be/src/shared/utils/apiResponse.ts`).
- **Services**: Business logic goes here. Use static methods if state is not needed.
- **Error Handling**: Throw `AppError` for operational errors (4xx/5xx).
- **Input Cleaning**: Apply `trimMiddleware` to all routes handling body data.
- **Imports**: Always use `.js` extension in imports for ESM compatibility.
  - `import { X } from './file.js'` — `import { X } from './file'`

---

## Frontend (Angular 21)

- **Signal-First**: Prefer `signal`, `computed`, and `effect` for state.
  - Avoid `BehaviorSubject` unless strictly necessary for legacy interop.
- **Component Design**:
  - Use **Standalone Components** only.
  - Folder structure: `fe/src/app/pages/<module>/<page-name>/`.
  - Use `inject()` instead of constructor injection.
- **Services**:
  - API services in `fe/src/app/services/api-services/`.
  - Use `HttpClient` and return `Observable<T>`.
  - Map response data directly: `.pipe(map(res => res.data))`.
- **Styling**: Tailwind CSS 4. Use utility classes first. Avoid custom CSS files.
- **Routing**: Lazy load all feature routes in `app.routes.ts`.

---

## Naming Conventions

| Target | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `product-list.component.ts` |
| Classes / Components | `PascalCase` | `ProductListComponent` |
| Interfaces | Prefix `I` | `IProduct` |
| Variables / Functions | `camelCase` | `getProductById` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRIES` |

---

## Known Anti-Patterns (never repeat these)

- Do **not** use `BehaviorSubject` in new Angular code.
- Do **not** omit `.js` extension in BE imports — ESM will break at runtime.
- Do **not** create non-standalone Angular components.
- Do **not** write raw SQL — always use MikroORM's entity manager or repositories.