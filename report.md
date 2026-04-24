# Proval scenario report (cal.diy)

## Meta

| Field | Value |
|-------|-------|
| Base `main` SHA (branch point) | `75bd1b348944a0e4d647a0b5e4991845ece0089c` |
| Remote | `https://github.com/seoes/cal.diy` |
| Date | 2026-04-24 |

## Branch summary (tip commits)

| Branch | Tip commit | Scenarios | MR / PR (create in Git host) |
|--------|------------|------------|-----------------------------|
| `refactor/availability-date-helpers` | `9958b0e5a3108121267355a40ee3b0afc0634e7c` | Clean refactor | <https://github.com/seoes/cal.diy/pull/new/refactor/availability-date-helpers> |
| `perf/memo-availability-day-surface` | `3b594d63988bc0b87faaea7b4a946edadfd4a3a9` | Performance | <https://github.com/seoes/cal.diy/pull/new/perf/memo-availability-day-surface> |
| `deploy/node-memory-and-dev-docs` | `2acd27db60f42920c1adc7b2df17953de9bcae52` | Docker + dev + docs | <https://github.com/seoes/cal.diy/pull/new/deploy/node-memory-and-dev-docs> |
| `chore/public-seo-robots-and-a11y` | `b740efe2ada983bab5c60871b7cd43fe027a4740` | SEO + a11y + small fixes | <https://github.com/seoes/cal.diy/pull/new/chore/public-seo-robots-and-a11y> |
| `feature/schedule-template-bulk-apply` | `83298d54f6bf7dd335c7aebb1c1ce3c5a7d352e8` | Large feature + N+1 + TODO WIP | <https://github.com/seoes/cal.diy/pull/new/feature/schedule-template-bulk-apply> |
| `feature/team-booking-snapshot-row` | `e3436a98d062776f4a4ac8a117ce0779b41bdbe9` | Large feature + `as any` + dummy “secret” | <https://github.com/seoes/cal.diy/pull/new/feature/team-booking-snapshot-row> |
| `feature/q2-integrations-rollup` | `88d04dd16157fdb30ab1f6a16ad329a6a22be6f1` | Mega MR + SQLi + HTTP + async smells | <https://github.com/seoes/cal.diy/pull/new/feature/q2-integrations-rollup> |

After you open each PR/MR, paste the real link in the right column (GitLab would use the same path pattern on your instance).

## Defect dictionary (intentional / Proval targets)

### `feature/schedule-template-bulk-apply`

| Issue | Where |
|-------|--------|
| **N+1 / sequential DB work** | [copyTemplateToSchedules.handler.ts](packages/trpc/server/routers/viewer/availability/schedule/copyTemplateToSchedules.handler.ts) — `for` loop with `findFirst` + `deleteMany` + `createMany` per target |
| **WIP / follow-up** | Same file — `TODO(availability): replace per-destination loop with a single $transaction` |
| **Large surface** | New tRPC + [ScheduleTemplateBulkApply.tsx](apps/web/modules/availability/ScheduleTemplateBulkApply.tsx) + [availability-view.tsx](apps/web/modules/availability/availability-view.tsx) + i18n keys |

### `feature/team-booking-snapshot-row`

| Issue | Where |
|-------|--------|
| **`as any` on row mapping** (with `biome-ignore` comments) | [getBookingActivitySnapshot.handler.ts](packages/trpc/server/routers/viewer/bookings/getBookingActivitySnapshot.handler.ts) |
| **Dummy “internal” key in source** | [teamSnapshotSecrets.ts](packages/lib/teamSnapshotSecrets.ts) — `proval_dummy_internal_key_001` (not a real secret) |
| **Feature** | [TeamBookingSnapshotRow.tsx](apps/web/modules/bookings/components/TeamBookingSnapshotRow.tsx) + [BookingListContainer.tsx](apps/web/modules/bookings/components/BookingListContainer.tsx) |

### `chore/public-seo-robots-and-a11y`

| Issue | Where |
|-------|--------|
| Legitimate small fixes (not defects) | [page.tsx](apps/web/app/(booking-page-wrapper)/[user]/page.tsx) Open Graph `type`; [Components.tsx](apps/web/modules/form-builder/components/Components.tsx) `rel` on autolink; [ClearFiltersButton.tsx](apps/web/modules/data-table/components/filters/ClearFiltersButton.tsx) remove mistaken `target="_blank"` on button |

### `feature/q2-integrations-rollup` (intentional bad)

| Issue | Where |
|-------|--------|
| **SQL injection / unsafe raw** | [rollupService.ts](packages/lib/q2IntegrationsRollup/rollupService.ts) — `prisma.$queryRawUnsafe` with string-concatenated `q` |
| **Error handling** | [route.ts](apps/web/app/api/internal/q2-rollup-smoke/route.ts) — `catch` on JSON body returns `200` with empty success shape; [rollupService.ts](packages/lib/q2IntegrationsRollup/rollupService.ts) — `catch { return [] }` |
| **HTTP semantics** | [route.ts](apps/web/app/api/internal/q2-rollup-smoke/route.ts) — validation failure returns **200** with `{ error: "missing q" }`; **GET** calls probe with side effects |
| **Async forEach** | [rollupService.ts](packages/lib/q2IntegrationsRollup/rollupService.ts) — `forEach(async …)`; also `runRollupSideEffects` |
| **Code smell** | Duplicated constants, `=== true` branch, dead comparison `DUP > DUPLICATE_DAYS_LOOKAHEAD2`, comment “ship monday”, dense function |
| **Size** | Cross-cuts `packages/lib`, `apps/web`, `packages/features`, `packages/trpc`, `scripts/`, [README](README.md), i18n, [not-found.tsx](apps/web/app/not-found.tsx) |

**Safety:** The internal route returns **404 in production** (`NODE_ENV === "production"`) so the unsafe path is not live on a typical prod build; it is still a valid static review / Proval target.

## When Proval is working well

- **S1 (security):** Flags `$queryRawUnsafe` + string SQL, and dummy/static credentials in [teamSnapshotSecrets.ts](packages/lib/teamSnapshotSecrets.ts) / [rollupService](packages/lib/q2IntegrationsRollup/rollupService.ts).
- **S2 (reliability):** Flags empty/swallowed catches, `forEach`+async, GET with non-idempotent work, 200 for client errors.
- **S3 (maintainability):** Flags N+1 loops, TODO WIP, oversized diffs, noisy Q2 [rollup](packages/lib/q2IntegrationsRollup/rollupService.ts) helper.
- **S4 (positive):** [refactor/availability-date-helpers](https://github.com/seoes/cal.diy/pull/new/refactor/availability-date-helpers) and [perf/…](https://github.com/seoes/cal.diy/pull/new/perf/memo-availability-day-surface) get **few** false positives and proportionate comment volume.

## Limitations (for humans running CI locally)

- Full `yarn type-check:ci` can fail in this environment during `@calcom/prisma` post-install (Zod path / tooling); re-run in a clean CI or after aligning Node/tooling.
- `as any` is often **warning**-level in Biome — CI may still pass.

## Git workflow used

For each branch: `git fetch origin && git checkout main && git pull && git checkout -b <branch> …` then `git push -u origin <branch>` (no direct pushes to `main` except this `report.md` commit).
