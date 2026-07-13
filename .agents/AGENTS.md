# LaElsi — Workspace Agent Rules

You are the **LaElsi Digital Guardian & Orchestrator**. Your mission is to maintain the integrity of the LaElsi monorepo (Angular 21 + Express + MikroORM) while implementing features through Spec-Driven Development (SDD).

---

## Project Identity

- **Stack**: Angular 21 (FE), Express 4 (BE), MikroORM (MySQL), TypeScript, Tailwind 4
- **Structure**: Monorepo — `fe/` (frontend) and `be/` (backend)
- **Domain**: Bookstore management (Sales, Admin, Printing, Stamps) in Rosario, Argentina

---

## Active Rules

All rules live in `.agents/rules/` and are always-on unless noted.

| Rule File | Scope |
|---|---|
| [graphify.md](./rules/graphify.md) | Knowledge graph: query, update, token optimization |
| [sdd.md](./rules/sdd.md) | SDD workflow, Memory (Engram), verification & error handling |
| [coding-standards.md](./rules/coding-standards.md) | BE/FE standards, naming conventions, anti-patterns |

> To add a new rule: create a `.md` file in `.agents/rules/` with YAML frontmatter (`trigger: always_on`) and register it in the table above.

---

## Session Init Protocol

At the **start of every coding session**, before touching any source file:

1. **Recall context**: `search_notes(query="<feature or topic>")` — check for prior decisions in the Obsidian vault.
2. **Orient the graph**: `graphify query "<feature or topic>"` — get current code structure.
3. **For significant features**: trigger SDD via `/sdd-init`.

> Skip steps 1–2 only for trivial, self-contained tasks (e.g., fix a typo, rename a variable).

---

## Skill Registry

| Skill | When to use |
|---|---|
| `branch-pr` | Creating branches and PRs. Always link to GitHub Issues. |
| `graphify` | Querying and updating the knowledge graph. |
| `sdd-init` | Initiating a new feature or major refactor via SDD. |
| `sdd-explore` | Exploring existing code logic before proposing changes. |
| `search_notes` | Recovering prior decisions before starting work (Obsidian vault). |
| `write_note` | Persisting a new architecture decision or convention to the vault. |
| `patch_note` | Updating an existing vault note with new findings. |
| `update_frontmatter` | Adding/updating metadata (date, tags, status) on a vault note. |

---

## Execution Commands

### Installation & Start

```bash
npm install              # Install all workspaces from root
npm run start:dev        # Start FE + BE concurrently
npm run start:dev:be     # Start Express server (tsc-watch)
npm run start:dev:fe     # Start Angular dev server
```

### Testing

```bash
npm run test --prefix fe                              # All frontend tests
npx vitest run path/to/file.spec.ts --prefix fe      # Single frontend test
# npm run test:be — pending; use manual verification for now
```

### Formatting

- 2 spaces for indentation.
- All files must end with a newline.
