# HustleHub+ Architecture (Part 2 — Secure Stack)

This diagram shows the full MERN application as implemented in Part 2, with system boundaries and the security control applied at each stage a request passes through.

```mermaid
flowchart TB
    subgraph CLIENT["🌐 Client Layer — Browser"]
        UI["React Frontend (Vite)<br/>AuthContext + ProtectedRoute (role-aware UI)<br/>JWT in sessionStorage · CSP on built app<br/>React output escaping"]
    end

    UI -->|"/api/* via Vite proxy"| TLS

    subgraph TLSB[" "]
        TLS[["🔒 TLS Boundary<br/>HTTPS via locally-signed SSL cert<br/>credentials & tokens never sent in plaintext"]]
    end

    subgraph SERVER["🖥️ Application Server — Node.js + Express 5 (trust boundary)"]
        direction TB
        HEL["Helmet<br/>CSP · nosniff · frame-ancestors 'none'"]
        CORS["CORS<br/>only CLIENT_URL allowed"]
        RL["Rate limiting<br/>global · login · register · booking → 429"]
        BODY["express.json()<br/>10kb limit → 413"]
        SAN["NoSQL sanitiser<br/>strips $ / . keys"]
        VAL["express-validator + sanitize-html<br/>types, ranges, ObjectIds, tag stripping → 400"]
        GUARD{"JWT protect<br/>signature + expiry → 401"}
        RBAC{"RBAC authorize(role)<br/>wrong role → 403"}
        CTRL["Controllers<br/>auth · gigs · bookings · transactions<br/>ownership checks → 403<br/>queries scoped to req.user.id"]
        HASH["bcrypt (cost 12)"]
        ERR["Central Error Handler<br/>generic response only"]
    end

    TLS --> HEL --> CORS --> RL --> BODY --> SAN --> VAL
    VAL -->|"public: register, login, browse gigs"| CTRL
    VAL -->|"protected routes"| GUARD
    GUARD -->|"valid token"| RBAC
    GUARD -->|"invalid"| ERR
    RBAC -->|"allowed role"| CTRL
    RBAC -->|"denied"| ERR
    CTRL --> HASH
    CTRL -.->|"any thrown error"| ERR
    ERR -->|"generic error JSON"| TLS

    subgraph DB["🗄️ Database Layer — MongoDB Atlas (trust boundary)"]
        USERS[("Users<br/>passwordHash · role · totalIncome")]
        GIGS[("Gigs<br/>owner = freelancer")]
        BOOK[("Bookings")]
        TXN[("Transactions")]
    end

    CTRL -->|"Mongoose · sanitizeFilter"| USERS
    CTRL --> GIGS
    CTRL -->|"session.withTransaction:<br/>booking + transaction + income $inc"| BOOK
    CTRL --> TXN
```

## Boundaries and security features shown

- **Browser** — the React app hides actions the user's role cannot perform (e.g. the Book button is only shown to clients) and route guards redirect users away from dashboards for other roles. This is a usability layer only; every rule is enforced again on the server.
- **TLS boundary** — all API traffic is HTTPS. In development the Vite proxy forwards `/api` to the HTTPS backend.
- **Application server** — the security perimeter. Requests pass, in order, through security headers, the CORS whitelist, rate limiting, a body-size limit, NoSQL operator stripping and schema validation before any business logic runs.
- **JWT gate → RBAC gate → ownership check** — three separate decisions: *who are you* (401), *is your role allowed* (403), and *is this resource yours* (403). All data queries are additionally scoped to the authenticated user's id.
- **Database** — Atlas is only reachable through Mongoose, with `sanitizeFilter` as a second layer against operator injection. Bookings, transactions and income updates are written atomically in one MongoDB transaction.
- **Errors** — every failure path ends in the central error handler, which never leaks stack traces or internals.

## Booking flow

```mermaid
sequenceDiagram
    participant C as Client (React)
    participant API as Express API
    participant DB as MongoDB

    C->>API: POST /api/bookings { gigId } + Bearer JWT
    API->>API: rate limit → protect → authorize('client') → validate gigId
    API->>DB: find gig
    alt gig missing
        API-->>C: 404
    else gig found
        API->>DB: startTransaction
        API->>DB: create Booking (confirmed)
        API->>DB: create Transaction (TXN-uuid)
        API->>DB: $inc freelancer.totalIncome
        API->>DB: commit
        API-->>C: 201 { booking, transaction }
    end
```
