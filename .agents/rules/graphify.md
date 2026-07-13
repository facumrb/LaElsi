---
trigger: always_on
description: Consult and maintain the graphify knowledge graph at graphify-out/ to maximize context quality while minimizing token usage.
---

## Graphify Protocol

This project has a graphify knowledge graph at `graphify-out/`.

---

### When to QUERY the graph (saves tokens vs. raw file reads)

Use graphify queries **instead of** reading raw source files or grepping when:

- Answering architecture or codebase questions: `graphify query "<question>"`
- Finding relationships between two symbols/files: `graphify path "<A>" "<B>"`
- Understanding a specific concept or node: `graphify explain "<concept>"`
- Navigating the wiki (if `graphify-out/wiki/index.md` exists) instead of reading raw files

> **Token rule**: Graphify returns a scoped subgraph — always prefer it over reading entire files or running broad greps. Only fall back to `GRAPH_REPORT.md` for broad architecture review when targeted queries return insufficient context.

---

### When NOT to query (avoid wasting tokens)

- If the answer is already in the current context window → skip the query
- For config files, markdown docs, `.env`, or non-source assets → graphify won't help
- For trivial one-liners or typo fixes where no structural change occurs

---

### When to UPDATE the graph (keep it fresh for future token savings)

Run `graphify update .` from the workspace root **after** modifying or creating files in:
- `fe/src/` (Angular components, services, routes)
- `be/src/` (Express controllers, services, entities)

**Do NOT update** after changes to:
- Markdown files, `AGENTS.md`, config files (`.json`, `.env`, `tsconfig`)
- `graphify-out/` itself
- Test fixtures or seed data

> **Update rule**: The graph must stay current so the *next* query saves tokens instead of returning stale context. Run `graphify update .` silently after source changes — **no need to ask the user for permission**.

---

### Post-change checklist

After every source code change session:
1. Run `graphify update .` (AST-only, no API cost, fast)
2. Confirm to the user: `Graphify graph updated.`