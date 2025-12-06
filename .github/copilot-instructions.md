# Brindaria V2 - AI Coding Assistant Instructions

## Project Overview

**Brindaria** is a Node.js/Express/SQLite web application managing a digital catalog and authenticity system for an artisanal sacred art atelier. The core value proposition is **phygital authentication**: each physical piece has a unique 5-character Access Key (printed on the base) linked to a rich digital certificate showing provenance, prayer, and iconography.

### Architecture Pattern: Layered MVC
- **Controllers** (`src/controllers/`): Business logic, database queries, form handling
- **Routes** (`src/routes/`): HTTP endpoint definitions with middleware composition
- **Views** (`views/`): EJS templates with sandwich layout (layout-top/bottom)
- **Database** (`database/db.js`): SQLite singleton connection (better-sqlite3)
- **Middleware** (`src/middleware/auth.js`): Auth checks, user injection

### Critical Data Flows

1. **Public Catalog Flow**: `GET /pecas` → `publicController.getCatalogo()` → Query `figuras` table → Filter by `ativo=1` → Render EJS with rich content
2. **Authentication Flow**: `POST /admin/login` → SHA-256 hash comparison with `ADMIN_HASH` env var → Rate-limited (5 attempts/15min) → Session set
3. **Piece Creation Flow**: Form → `postNovaPeca()` → `keyGenerator.generateUniqueKey()` → INSERT into `pecas` table with generated chave_acesso

## Database Design (Key Context)

**Naming Convention (V2.1 Transition)**: 
- Table `figuras` = the sacred archetype (stays version-stable)
- Table `pecas` = physical materialization (linked 1:Many to figuras)
- Foreign key: `figura_id` in pecas (renamed from `modelo_id`)

**Schema Patterns**:
- All keys use `chave_acesso` (Crockford Base32, 5 chars, avoiding I/L/1/O/0)
- `figuras.ativo` (INTEGER 0/1) controls public visibility—always filter `WHERE ativo=1` in public routes
- `pecas.*_exibicao` columns now nullable post-V2.1 for "express entry" workflow
- Slugs are UNIQUE and immutable (security: changing slug breaks SEO & QR codes)

## Key Files & Patterns

### Entry Point
- **`app.js`**: Session config uses `process.env.SESSION_SECRET`, helmet CSP disabled (dev-only), compression middleware enabled

### Controllers
- **`adminController.js`** (current file): All admin CRUD—login, dashboard, figura CRUD, peca CRUD
- **`publicController.js`**: Home, catalog (filter `ativo=1`), detail pages, certificate validation by key
- **`systemController.js`**: Backup/restore logic

### Routes
- **`adminRoutes.js`**: Protected routes use `isAuthenticated` middleware; routes named consistently (`/figuras/novo`, `/pecas/nova`)
- **`publicRoutes.js`**: Key feature: `/v/:chave` (short QR code route), `/pecas/:categoria/:slug/:codigo?` (canonical detail page)

### Database Interaction
- **`database/db.js`**: Singleton pattern—import and call `.prepare().get()` or `.run()` directly
- **`keyGenerator.js`**: `generateUniqueKey(db)` checks both `pecas` and `chaves_reserva` tables

## Development Workflows

### Local Setup
```bash
npm install
node setup-db.js  # Initializes SQLite with schema
npm run dev       # Starts server with nodemon on :3000
npm run watch:css # In parallel: Tailwind watch (if editing styles)
```

### Database Management
```bash
npm run db:dump    # Export DB to JSON backup
npm run db:restore # Restore from backup
```

### CSS Build
```bash
npm run build:css  # Minified production build
npm run watch:css  # Development watch mode
```

### Production Deploy
- Uses PM2 process manager (see `deploy/setup.sh`)
- Nginx proxy reverse on `v2.brindaria.com.br`
- WAL mode disabled (ADR-02)—backup/restore use single `.db` file for stability

## Code Conventions & Anti-Patterns

### ✅ DO
- **Use `.prepare().get()` / `.run()`** for SQL (better-sqlite3 pattern, not async)
- **Filter public views by `ativo=1`** in all catalog queries
- **Check `isAuthenticated` middleware** for all protected routes
- **Validate session in controllers** before admin operations: `if (!req.session.admin) return res.redirect()`
- **Use slugify()** for URL-safe identifiers; store as UNIQUE in DB
- **Environment variables** for secrets: `ADMIN_HASH`, `SESSION_SECRET`, `PORT`, `NODE_ENV`, `DB_FILE`

### ❌ DON'T
- **Don't enable WAL mode** in database config (stability issue noted in ADR-02; single-file backup/restore is standard here)
- **Don't change existing slug columns** after creation (breaks SEO, QR codes, public links)
- **Don't expose `chaves_reserva` table** to public views
- **Don't use async/await with better-sqlite3** (it's synchronous by design)
- **Don't hardcode admin password** in code—always use SHA-256 hash in `ADMIN_HASH` env var

## Testing & Validation Patterns

- **No automated test suite**; manual testing is current practice
- **Test admin login**: Use curl or browser with 5+ failed attempts to verify rate limiter
- **Test public catalog**: Ensure only `figuras` with `ativo=1` appear in `/pecas`
- **Test key generation**: Create new peca, verify chave_acesso is unique and doesn't appear in `chaves_reserva`

## Integration Points & External Dependencies

- **express-rate-limit**: Protects `/admin/login` (15-min window, 5 attempts)
- **express-session**: Session storage in-memory (default; no persistent store configured)
- **helmet**: Security headers (CSP disabled for dev convenience)
- **slugify**: URL-safe slug generation
- **archiver**: Backup ZIP creation in admin panel
- **better-sqlite3**: Synchronous SQLite binding (no connection pooling needed—single process)

## Common Modifications & Locations

| Task | Location | Pattern |
|------|----------|---------|
| Add public page | `views/pages/` + route in `publicRoutes.js` + controller method | Filter by `ativo=1` if showing data |
| Add admin feature | `adminRoutes.js` + `adminController.js` + `views/admin/` | Check `isAuthenticated` middleware |
| Add DB column | `database/schema.sql` + create migration script in `scripts/` | Update queries in controllers; test backup/restore |
| Change slug behavior | `database/schema.sql` (UNIQUE constraint) + All queries using it | Risk: breaks external links—consider redirect |
| Modify access key length | `src/utils/keyGenerator.js` (KEY_LENGTH, ALPHABET) | Update documentation & rebuild reserve pool |

## File Organization Notes

- **V2.1 Refactor in Progress**: "modelos" → "figuras", "modelo_id" → "figura_id" (see `MASTER_PLAN_BRINDARIA_V2.md`)
- **Deployment State**: Data source of truth is production; code source of truth is GitHub
- **Backup Strategy**: Images stored in `public/uploads/figuras/`; DB backups as single `.db` file (no WAL)

---

**Last Updated**: December 2025 | **Version**: V2.0-Main | **Key Contact**: See MASTER_PLAN_BRINDARIA_V2.md for roadmap
