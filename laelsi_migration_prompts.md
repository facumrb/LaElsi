# LaElsi → Supabase (Auth + DB + Edge Functions) + Cloudflare (R2 + Edge Security) + Vercel — Prompts de auditoría y ejecución

Este documento acompaña al plan maestro de modernización de **LaElsi**. Contiene:
1. Prompts de auditoría previa del código actual (en inglés, para alimentar al LLM con acceso al repositorio).
2. Prompt para generar el plan ajustado basado en los hallazgos.
3. Prompt maestro para ejecutar el plan paso a paso, delegando en el desarrollador únicamente las tareas que requieren acceso a consolas externas (Google Cloud, Supabase, Cloudflare, Vercel).

---

## Antes de empezar: Matriz de responsabilidades ("Quién hace qué")

| Bloque / Fase | Tareas | Quién lo hace | Qué usar |
|---|---|---|---|
| **Auditoría previa** | — | LLM con acceso al repo (el desarrollador ejecuta scripts de recuento si aplica) | Prompts 1 a 5 |
| **Plan ajustado** | — | LLM | Prompt 6 |
| **Bloque 0 (Cuentas y Credenciales)** | 0.1–0.3 | **Vos** (crear proyectos en Supabase, Google Cloud OAuth, Cloudflare R2 + Turnstile, Vercel) | Instrucciones del Bloque 0 en `Tareas.md` |
| **Bloque 1 (Base de Datos, Triggers y RLS)** | 1.1–1.5 | LLM genera los scripts SQL finales (Schema, Trigger OAuth, RPCs de órdenes/unicidad y RLS); **vos** los ejecutás en el SQL Editor de Supabase | Prompt 7 |
| **Bloque 2 (Storage R2 y WebP)** | 2.1–2.5 | Mixto: **vos** creás buckets y corrés script de migración; LLM implementa Edge Functions (`get-upload-url`, `delete-r2-object`) y servicio de compresión WebP en Angular | Prompt 7 |
| **Bloque 3 (Edge Functions & Auth)** | 3.1–3.7 | LLM escribe las Edge Functions de negocio (Deno); **vos** las desplegás con `supabase functions deploy` (CLI) | Prompt 7 |
| **Bloque 4 (Frontend Angular)** | 4.1–4.6 | LLM (edición de código: `@supabase/supabase-js`, Google OAuth, flujo R2, Turnstile, servicios reactivos) | Prompt 7 |
| **Bloque 5 (Despliegue y Borde)** | 5.1–5.5 | Mixto: LLM genera `fe/vercel.json`, headers de seguridad y secrets; **vos** desplegás a Vercel y configurás las reglas de Cloudflare WAF | Prompt 7 |
| **Bloque 6 (Limpieza final)** | 6.1–6.4 | LLM limpia `package.json`, `.gitignore`, `.env.example` y actualiza `README.md`; **vos** realizás el commit/push final | Prompt 7 |

---

## Prompt 1 — System discovery: Architecture, API surface & edge requirements

**Cuándo usarlo:** Primero, antes de iniciar cambios de código. Da contexto integral al LLM sobre rutas, validaciones y particularidades del servidor Express.

```
I've attached the modernized migration plan (Tareas.md) to move "LaElsi" from its
current Express + MikroORM + MySQL backend to a Serverless architecture:
Supabase (PostgreSQL, Supabase Auth with Google OAuth, Edge Functions) +
Cloudflare (R2 Object Storage, Turnstile anti-bot, WAF & Edge Rate Limiting) +
Vercel (Angular 21 SPA hosting).

Audit the current repository and answer, with file/line references:

1. List every route currently exposed by Express (method, path, controller, middleware chain),
   grouped by feature (categories, products, bulk prices, photos, admins, clients, orders,
   and /api/validate-unique).
2. Inspect be/src/photo/imageOptimizer.middleware.ts and describe the exact Sharp
   transformation (WebP quality, dimensions, naming). This will be moved to client-side
   image compression before direct Cloudflare R2 uploads.
3. Identify how unique field validation is currently handled in
   be/src/shared/validation/validation.controller.ts and identify all forms in fe/
   that consume /api/validate-unique.
4. Flag any third-party integrations, cron jobs, email dependencies, or external consumers
   outside the Angular frontend in fe/.

Return items 1–3 as a structured markdown table: Feature | Route | Middleware chain | Covered by modern plan? (Y/N) | Notes.
```

---

## Prompt 2 — Data model, schema diff & storage volume audit

**Cuándo usarlo:** Antes de ejecutar el Bloque 1 (Schema SQL) y el Bloque 2 (Storage R2).

```
Compare the current MikroORM entity definitions in be/src (User, Admin, Client,
Category, Product, Price, PriceChangeBatch, Photo, Order, OrderLine, AuditLog)
against the proposed PostgreSQL schema in Block 1 of Tareas.md.

Produce a diff table:
Entity/Field | Current MikroORM definition | Proposed PostgreSQL schema | Discrepancy / Action required.

Specifically verify:
1. The integration of auth.users with public.user via supabase_uid UUID.
2. The nullable password column for Google OAuth users.
3. Enum values (user_role, category_state, product_state, order_state, delivery_method, etc.).
4. The "order" column in Category and Photo.

Then:
1. Provide a short Node.js script or MySQL query to obtain row counts for every table
   in the existing MySQL database.
2. Provide a shell command to measure the total size and file count of be/uploads/products/
   and be/uploads/users/.
3. Cross-reference file names in uploads/ against the photo table to flag any orphaned files
   or missing references prior to Cloudflare R2 migration.
```

---

## Prompt 3 — Auth migration (Google OAuth + Supabase Auth) & RLS Inventory

**Cuándo usarlo:** Antes de configurar Supabase Auth en el Bloque 1 y adaptar el frontend en el Bloque 4.

```
Audit the current authentication, role verification, and authorization checks
(auth.middleware.ts, verifyToken, verifyRole, client/admin route protections, and guards in fe/).

Answer:
1. Exactly what claims are currently used in the application (id, role, email) and how
   they map to Supabase Auth user metadata and the public.user table.
2. Review the proposed PostgreSQL trigger trg_on_auth_user_created. Ensure it properly handles:
   - Google OAuth logins (extracting full name, avatar, email, assigning role='Client').
   - Account linking when an existing email is used with Google OAuth.
   - Traditional email/password signups.
3. List every authorization rule in the codebase and map it to the corresponding
   PostgreSQL Row Level Security (RLS) policy using native auth.uid() checks and the
   is_admin() helper.

Return item 3 as a table: Rule / Action | Current Express check | Proposed PostgreSQL RLS Policy | Security Justification.
```

---

## Prompt 4 — Atomic operations & inventory of transactional boundaries

**Cuándo usarlo:** Antes de validar las funciones SQL `create_order`, `cancel_order` y la gestión de lotes de precios en el Bloque 1.

```
Inspect all operations in be/src that execute multi-table writes or require strict ACID guarantees:
1. Order creation: stock deduction, validation, total calculation, order line insertions (currently in order.service.ts).
2. Order cancellation: stock restoration and status update.
3. Bulk price changes: preview, applying new prices with price_change_batch creation,
   audit logging, and rollback operations (currently in bulkProduct.service.ts).

For each operation:
- Analyze how it currently manages transactions (e.g. em.flush(), try/catch rollbacks).
- Verify that the proposed PL/pgSQL functions (create_order, cancel_order) and Edge Functions
  faithfully reproduce the exact concurrency control (using FOR UPDATE to prevent race conditions).
- Flag any missing edge cases (e.g. handling deleted products, rounding rules, fiscal conditions).
```

---

## Prompt 5 — Edge Security, Turnstile & Platform Free-Tier Verification

**Cuándo usarlo:** Antes de iniciar el despliegue del Bloque 5.

```
Before cutover, review our edge security architecture and free-tier limits across
Supabase, Cloudflare, and Vercel:

1. Cloudflare Turnstile integration:
   - Provide the exact Angular implementation pattern to render the Turnstile widget
     in the checkout flow and validate the token on order submission.
2. Cloudflare Edge WAF & Rate Limiting:
   - Define the optimal rate-limiting rule (requests per IP per minute) to protect
     the Supabase Edge Functions gateway and checkout endpoints without affecting legitimate users.
3. Vercel Security Headers:
   - Verify the Content-Security-Policy, Strict-Transport-Security, X-Frame-Options,
     and X-Content-Type-Options headers in fe/vercel.json for compatibility with
     Google OAuth popups/redirects and Cloudflare R2 image domains.
4. Quota check:
   - Confirm expected monthly usage stays well within the free tiers of
     Supabase (500MB DB, 50k MAU, 500k Edge Function invocations),
     Cloudflare (R2 10GB storage, 0$ egress, unmetered DDoS, Turnstile free),
     and Vercel (100GB bandwidth).
```

---

## Prompt 6 — Generate the adjusted plan

**Cuándo usarlo:** Una vez completadas las auditorías de los Prompts 1 a 5.

```
Based on the audit findings from Prompts 1 through 5, generate an updated, exact execution diff
against Tareas.md:

- Keep the block and task numbering (0.1 to 6.4).
- Incorporate any discovered edge cases (such as /api/validate-unique RPC, client-side WebP compression,
  exact Turnstile integration, and RLS adjustments).
- Do not rewrite unchanged tasks; output only tasks with specific refinements or additions.
```

---

## Prompt 7 — Guided step-by-step execution

**Cuándo usarlo:** Prompt maestro para ejecutar el plan ordenadamente de principio a fin.

```
We are now executing the modernized LaElsi migration plan in the following strict order:
Block 0 (0.1 → 0.2 → 0.3) →
Block 1 (1.1 → 1.2 → 1.3 → 1.4 → 1.5) →
Block 2 (2.1 → 2.2 → 2.3 → 2.4 → 2.5) →
Block 3 (3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6 → 3.7) →
Block 4 (4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6) →
Block 5 (5.1 → 5.2 → 5.3 → 5.4 → 5.5) →
Block 6 (6.1 → 6.2 → 6.3 → 6.4).

For each task, one at a time:
1. Indicate clearly whether this task is:
   - REPO ACTION: You can perform it directly in this repository (write/edit TypeScript, Angular code, SQL scripts, configs).
   - EXTERNAL ACTION: I must execute it outside the editor (in Supabase Dashboard, Google Cloud Console, Cloudflare Dashboard, Vercel Dashboard, or via CLI requiring my credentials).
2. If it's a REPO ACTION: execute the change and display the diff or created file.
3. If it's an EXTERNAL ACTION: provide exact, numbered instructions, copy-pasteable SQL/commands, and state precisely what value, key, or confirmation you need back before advancing.
4. Never jump ahead to the next task until I explicitly confirm the current one is completed.

Begin with Task 0.1.
```
