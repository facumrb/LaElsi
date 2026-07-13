---
trigger: always_on
description: Spec-Driven Development (SDD) workflow and Obsidian memory protocol for the LaElsi monorepo.
---

## SDD Workflow (Spec-Driven Development)

Before any **significant** coding (new feature, refactor, architectural change), follow this cycle:

1. **Init**: `/sdd-init` (if not done for the session).
2. **Explore**: `/sdd-explore <topic>` to understand existing logic. Use `graphify query` first.
3. **Propose/Spec/Design**: Generate the delta specs and technical design as an artifact.
4. **User Confirmation**: ALWAYS ask for confirmation before applying changes definitively.
5. **Apply**: Write code in batches, one component at a time.
6. **Verify/Archive**: Validate and sync. Run `graphify update .` after source changes.

> Skip SDD for trivial changes (typo fixes, minor style tweaks, single-line edits).

---

## Memory (Obsidian Vault)

All persistent memory lives in the **`obsidian-vault`** MCP server (vault: `inteligenciaComercial`).
Decisions for this project are stored under `LaElsi/` within the vault.

### Proactive Save

After architecture decisions, bug fixes, or new conventions — persist them with:

```
# New note (first time saving this topic)
write_note(path="LaElsi/<topic>.md", content="...")

# Update existing note
patch_note(path="LaElsi/<topic>.md", content="...")

# Add/update frontmatter metadata (date, tags, status)
update_frontmatter(path="LaElsi/<topic>.md", frontmatter={ ... })
```

Always include in the note:
- **What** was decided
- **Why** (the tradeoff or rationale)
- **Date** of decision

### Context Recovery

Before repeating work or starting `/sdd-explore`, search the vault first:

```
search_notes(query="<feature or topic>")
```

If results are ambiguous, use `list_directory(path="LaElsi/")` to see all saved topics.
Read a specific note with `read_note(path="LaElsi/<topic>.md")`.

---

## Verification Protocol

- **Frontend**: Verify UI with `npm run start:dev:fe`. Ensure no console errors.
- **Backend**: Manually verify endpoints. Use `syncSchema()` and `seedDatabase()` in `be/src/shared/db/orm.ts` to reset state if needed.
- **PRs**: Always link to GitHub Issues and use the `branch-pr` skill.

---

## Error Handling Strategy

- **Backend**: Centralized `errorHandler` middleware catches `AppError` and generic errors.
- **Frontend**: Use `ErrorInterceptor` to catch 401/403/500 errors and show alerts using `AlertService` (SweetAlert2).