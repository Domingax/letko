---
name: Prefer Drizzle API over raw SQL
description: Use Drizzle's query builder API instead of raw SQL when interacting with the database
type: feedback
---

Use Drizzle's typed API (e.g., `db.insert(table).values(...).onConflictDoNothing()`) instead of raw `sql` template literals when the ORM provides an equivalent method.

**Why:** Raw SQL bypasses the type safety and abstractions that Drizzle provides. The user explicitly prefers the ORM's API.

**How to apply:** When writing database queries in this project, always check if Drizzle has a built-in method before falling back to `sql` template literals.
