# Evidence

Generated on 2026-11-06 from the local stack (API against MongoDB Atlas). The same reports are produced on every pipeline run and attached to the GitHub Actions run as artifacts (`backend-reports`, `frontend-build`, `docker-evidence`).

| File | What it shows |
|---|---|
| `backend-tests.txt` | Jest + supertest: 26 tests passing, with a coverage table |
| `frontend-tests.txt` | Vitest + React Testing Library: 9 tests passing |
| `eslint-backend.txt` / `.json` | Static analysis of the API (ESLint recommended + `eslint-plugin-security`) |
| `eslint-frontend.txt` / `.json` | Static analysis of the React client (same rule sets + React hooks rules) |
| `npm-audit-backend.txt` | Dependency scan of the API's production dependencies: 0 vulnerabilities |
| `npm-audit-frontend.txt` | Dependency scan of the client: 4 moderate, all in ESLint (dev tooling, never shipped) |
| `log-samples.jsonl` | One real log line for each event type the API records |

To add yourself before submitting: screenshots of a green GitHub Actions run, the CodeQL results (repo → **Security → Code scanning**), `docker compose ps` showing healthy containers, and the Newman summary.

## Static analysis results and what they mean

**Result: 0 errors, 7 warnings (backend) · 0 errors, 1 warning (frontend).** The pipeline fails on any ESLint error, so a build can only pass with zero errors.

Every warning was reviewed. None is a real vulnerability:

| Rule | Where | Why it is safe |
|---|---|---|
| `detect-object-injection` | `sanitize.middleware.js` 7, 9 | The keys come from `Object.keys(obj)` of the object being cleaned, and the code exists to *delete* `$`/`.` keys. Nothing is read from or written to a user-chosen property of another object. |
| `detect-object-injection` | `server.js` 12 | `process.env[name]` where `name` comes from a fixed list `['MONGO_URI', 'JWT_SECRET']`. |
| `detect-non-literal-fs-filename` | `server.js` 23, 24 | The certificate paths are built from `CERT_DIR` (server configuration) plus fixed file names, never from request data. |
| `detect-non-literal-fs-filename` | `logger.js` 19 | The log directory comes from `LOG_DIR` (server configuration), never from request data. |
| `detect-object-injection` | `tax.test.js` 42, `FreelancerDashboard.test.jsx` 36 | Test code that indexes a local array/object with a loop counter or a fixed URL. |

These rules are designed to over-report. Each warning is a place where a human should check that the key or path cannot come from a user. That check is done above. The rules that matter most for this codebase report **nothing**: `detect-eval-with-expression`, `detect-non-literal-regexp`, `detect-unsafe-regex` (ReDoS), `detect-child-process`, `detect-possible-timing-attacks`, `detect-no-csrf-before-method-override`, `detect-pseudoRandomBytes` and `detect-buffer-noassert`.

**CodeQL** (`security-and-quality` query suite) runs as a separate pipeline job and publishes its results to the repository's **Security → Code scanning** tab. It traces data flow from requests into database queries, HTML output and the file system, which ESLint cannot do.

**npm audit** fails the pipeline on any *high* or *critical* advisory. While this part was being built, the audit found 1 high and 1 critical advisory in production dependencies (`qs`, `follow-redirects`, among others). They were fixed with `npm audit fix` (no breaking upgrades), and the production audit is now clean.
