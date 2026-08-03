# FAZIA Housing — API Structure (v1.0)

---

## 1. Principles

1. **Thin route handlers** — no business logic in `app/api/**`.
2. **Versioned** — `/api/v1/...`.
3. **Zod at the boundary** — parse body/query before service.
4. **Authorize in service/policy** — never trust UI hiding alone.
5. **Consistent list envelope** for every collection endpoint.
6. **Idempotency** on posting financial/inventory mutations.

---

## 2. Standard Envelopes

### Success (single)

```json
{
  "data": { "id": "...", "...": "..." }
}
```

### Success (list)

```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1340,
    "totalPages": 67,
    "sort": "createdAt",
    "order": "desc"
  }
}
```

### Error

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Requested quantity exceeds available stock.",
    "details": [{ "materialId": "...", "available": 12, "requested": 20 }],
    "requestId": "req_..."
  }
}
```

### Common error codes

`UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `IDEMPOTENCY_CONFLICT`, `INSUFFICIENT_STOCK`, `INVALID_TRANSITION`, `OPTIMISTIC_LOCK`, `RATE_LIMITED`

---

## 3. Cross-Cutting Query Params

| Param | Description |
|---|---|
| `page`, `pageSize` | Pagination (max pageSize 100) |
| `sort`, `order` | Whitelisted fields only |
| `q` | Full-text-ish search on code/name |
| `status` | Enum filter |
| `projectId` | Scope (often required) |
| `from`, `to` | Date range |
| `includeDeleted` | Super Admin only |

---

## 4. Handler → Service Pattern

```
app/api/v1/grns/[id]/post/route.ts
  → requireSession()
  → parse(params/body)
  → grnService.post(actor, id, { idempotencyKey })
  → json(GrnDto)
```

Shared helpers in `src/lib/http/`:

- `ok`, `created`, `noContent`, `fail`
- `getActor`
- `parseBody(schema)`
- `parseQuery(schema)`

---

## 5. DTO Policy

- Services return DTOs (never raw Prisma graphs with secrets).
- Mappers live next to feature (`features/x/mappers.ts`).
- Decimal → string in JSON for money/qty precision.

---

## 6. Resource Groups

See `01-ARCHITECTURE.md` §4.2 for full endpoint map.

Grouped routers under:

```
src/app/api/v1/
  me/
  users/
  roles/
  permissions/
  org-units/
  projects/
  phases/
  sectors/
  blocks/
  house-types/
  houses/
  contractors/
  employees/
  boq-headers/
  activities/
  inspection-requests/
  daily-progress-reports/
  weekly-progress-reports/
  warehouses/
  materials/
  material-categories/
  grns/
  material-requisitions/
  demand-vouchers/
  material-issues/
  material-consumptions/
  material-returns/
  inventory/
  measurement-books/
  contractor-bills/
  budgets/
  payments/
  directives/
  documents/
  notifications/
  inbox/
  audit-logs/
  reports/
  dashboards/
  health/
```

---

## 7. Workflow Actions Convention

State changes are **explicit POST actions**, not PATCH of `status`:

```
POST /api/v1/{resource}/:id/submit
POST /api/v1/{resource}/:id/approve
POST /api/v1/{resource}/:id/reject
POST /api/v1/{resource}/:id/post      # inventory
```

Prevents illegal transitions and keeps audit intent clear.

---

## 8. Export Endpoints

```
POST /api/v1/reports/:reportKey/export
Body: { format: "pdf" | "xlsx" | "csv", filters: {...} }
→ 202 + jobId  OR  200 file stream for small sync exports
```

v1: synchronous for bounded result sets; async jobs if > threshold.

---

## 9. Realtime / Notifications

- `GET /api/v1/notifications?unreadOnly=true`
- `GET /api/v1/notifications/unread-count`
- Client polling via TanStack Query `refetchInterval`

Phase 2: SSE endpoint `/api/v1/events/stream`.

---

## 10. Rate Limiting

Applied in middleware / route wrapper:

| Surface | Limit (starting point) |
|---|---|
| Login | 10 / 15 min / IP |
| Mutations | 120 / min / user |
| Exports | 10 / 10 min / user |
| Reads | 300 / min / user |

---

## 11. OpenAPI

Generate OpenAPI from Zod schemas (e.g. `@asteasolutions/zod-to-openapi`) in Module 0/1 — used for contract tests and future clients.
