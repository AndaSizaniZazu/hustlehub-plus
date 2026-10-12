# HustleHub+ — Test Cases (Part 2)

Results recorded on 2026-10-12 against the local stack (API `https://localhost:5000`, frontend `http://localhost:5173`, MongoDB Atlas).

**Status key:** ✅ Pass (executed and observed) · ⬜ To run before submission

---

## 1. Automated test summary

| Suite | Command | Result |
|---|---|---|
| API — Postman/Newman | `cd backend && npm run test:api` | ✅ 53 requests, **102 assertions, 0 failed** |
| Frontend — Vitest + RTL | `cd frontend && npm test` | ✅ 2 files, **6 tests passed** |
| Frontend lint | `cd frontend && npm run lint` | ✅ 0 errors |

Evidence: screenshot of the Newman summary table, `postman/reports/newman-report.html`, and the Vitest output.

---

## 2. API test cases (Newman)

### Authentication
| ID | Test case | Input | Expected | Status |
|---|---|---|---|---|
| API-01 | Register freelancer | valid name/email/password, `role: freelancer` | 201, role = freelancer, no `passwordHash` | ✅ |
| API-02 | Register client | valid data, `role: client` | 201, role = client | ✅ |
| API-03 | Duplicate email | existing email | 400 `Registration failed` (generic) | ✅ |
| API-04 | Invalid email | `not-an-email` | 400 | ✅ |
| API-05 | Short password | 5 chars | 400 | ✅ |
| API-06 | Self-assign admin | `role: admin` | 400, error on `role` field | ✅ |
| API-07 | Login valid | correct credentials | 200 + JWT | ✅ |
| API-08 | Login wrong password | wrong password | 401 `Invalid credentials` | ✅ |
| API-09 | Login unknown email | unregistered email | 401, same message as API-08 | ✅ |
| API-10 | Protected route, no token | no header | 401 | ✅ |
| API-11 | Protected route, garbage token | `Bearer garbage.token.here` | 401 | ✅ |
| API-12 | Forged JWT role | client token edited to `role: freelancer` | 401 (signature invalid) | ✅ |
| API-13 | Protected route, valid token | valid JWT | 200, own profile, no hash | ✅ |

### Gigs & RBAC
| ID | Test case | Input | Expected | Status |
|---|---|---|---|---|
| API-14 | Freelancer creates gig | valid gig | 201, owner = token user | ✅ |
| API-15 | Owner spoofing | body `freelancer: <other id>` | 201, owner still = token user | ✅ |
| API-16 | Invalid gig input | empty title, price -5 | 400, errors on title + price | ✅ |
| API-17 | Client creates gig | client token | 403 | ✅ |
| API-18 | Create gig without token | — | 401 | ✅ |
| API-19 | Browse gigs (public) | — | 200, no freelancer emails exposed | ✅ |
| API-20 | Get gig by id | valid id | 200 | ✅ |
| API-21 | Get gig invalid id | `123` | 400 | ✅ |
| API-22 | Get gig not found | valid but unknown id | 404 | ✅ |
| API-23 | My gigs | freelancer token | 200, only own gigs | ✅ |
| API-24 | My gigs as client | client token | 403 | ✅ |
| API-25 | Owner updates gig | price → 750 | 200, price updated | ✅ |
| API-26 | Non-owner updates gig | freelancer B token | 403 | ✅ |
| API-27 | Non-owner deletes gig | freelancer B token | 403 | ✅ |

### Bookings, transactions & income
| ID | Test case | Input | Expected | Status |
|---|---|---|---|---|
| API-28 | Client books gig | `gigId` | 201, booking `confirmed`, transaction linked to booking, amount = price, `TXN-` reference | ✅ |
| API-29 | Freelancer books gig | freelancer token | 403 | ✅ |
| API-30 | Invalid gig id | `not-an-id` | 400 | ✅ |
| API-31 | Gig not found | unknown id | 404 | ✅ |
| API-32 | Client views bookings | client token | 200, contains booking, no emails | ✅ |
| API-33 | Freelancer views bookings received | freelancer token | 200, contains booking | ✅ |
| API-34 | Other freelancer views bookings | freelancer B token | booking **not** visible | ✅ |
| API-35 | Client hits freelancer bookings | client token | 403 | ✅ |
| API-36 | Client transactions | client token | contains transaction | ✅ |
| API-37 | Freelancer transactions | freelancer token | contains transaction | ✅ |
| API-38 | Other freelancer transactions | freelancer B token | transaction **not** visible | ✅ |
| API-39 | Freelancer income | freelancer token | totalIncome = gig price, bookings = 1 | ✅ |
| API-40 | Other freelancer income | freelancer B token | 0 | ✅ |
| API-41 | Client hits income | client token | 403 | ✅ |

### Security
| ID | Test case | Input | Expected | Status |
|---|---|---|---|---|
| API-42 | Security headers | GET `/api/health` | CSP with `frame-ancestors 'none'`, `nosniff`, no `X-Powered-By` | ✅ |
| API-43 | XSS in gig | `<script>alert(1)</script>Web scraping`, `<img onerror>` | 201, tags stripped, title = `Web scraping` | ✅ |
| API-44 | NoSQL injection login | `{"email":{"$gt":""},"password":{"$gt":""}}` | 400, no token | ✅ |
| API-45 | Oversized payload | 12kb description | 413, generic error | ✅ |
| API-46 | Unknown route | `/api/does-not-exist` | 404 `Not found` | ✅ |
| API-47 | Owner deletes gig | owner token | 204, then 404 on GET | ✅ |
| API-48 | Login brute force | 6+ failed logins | 429 + `RateLimit` header | ✅ |
| API-49 | Booking flood | 11+ booking requests | 429 | ✅ |

---

## 3. Frontend automated tests (Vitest)

| ID | Component | Test | Status |
|---|---|---|---|
| FE-01 | GigCard | Renders title, price (`R 500.00`) and freelancer name | ✅ |
| FE-02 | GigCard | Book button hidden when user cannot book | ✅ |
| FE-03 | GigCard | Clicking Book calls handler with the gig id | ✅ |
| FE-04 | LoginPage | Renders email and password fields | ✅ |
| FE-05 | LoginPage | Empty submit shows "required" error, API not called | ✅ |
| FE-06 | LoginPage | Bad credentials show generic "Invalid email or password" | ✅ |

---

## 4. Manual UI test cases (browser)

| ID | Test case | Steps | Expected | Status |
|---|---|---|---|---|
| UI-01 | Register freelancer | Register page → fill form, role Freelancer → Register | Redirect to Login with "Account created" | ✅ |
| UI-02 | Freelancer login | Log in | Freelancer dashboard, income R 0.00 | ✅ |
| UI-03 | Gig form validation | New gig → submit empty | "Title/Description/Category is required" | ✅ |
| UI-04 | Create gig + XSS | Title `<script>alert(1)</script>Logo design`, price 750 | Gig listed as "Logo design", no alert | ✅ |
| UI-05 | Text displays correctly | Description containing `I'll` | Shows `I'll` (not `&#x27;`) | ✅ |
| UI-06 | Register + login client | Register as Client → log in | Lands on Browse gigs, Book buttons visible | ✅ |
| UI-07 | Book gig | Click Book | "Booking confirmed. Reference: TXN-…" | ✅ |
| UI-08 | Client dashboard | My bookings | Booking (confirmed, R 750.00) + transaction with same TXN reference | ✅ |
| UI-09 | Role guard | Client opens `/freelancer` | Redirected to `/gigs` | ✅ |
| UI-10 | Income tracked | Log in as freelancer | Total income and booking count increased by the gig price; client listed under Bookings received | ✅ |
| UI-11 | Freelancer cannot book | Browse gigs as freelancer | No Book button | ⬜ |
| UI-12 | Edit gig | Dashboard → Edit → change price | New price shown | ⬜ |
| UI-13 | Delete gig | Dashboard → Delete → confirm | Gig removed | ⬜ |
| UI-14 | Wrong password | Log in with wrong password | "Invalid email or password" | ⬜ |
| UI-15 | Login rate limit | 5 failed logins | "Too many attempts. Please try again later." | ⬜ |
| UI-16 | Duplicate email | Register with existing email | "Registration failed" | ⬜ |
| UI-17 | Logged-out guard | Log out → open `/client` | Redirected to Login | ⬜ |
| UI-18 | Server down message | Stop API → try login | "Cannot reach the server" | ⬜ |
