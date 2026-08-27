# LPU MentorConnect Backend API

Lovely Professional University (LPU) Alumni Mentorship & Career Network. This is the production-grade NestJS backend designed to integrate with the existing Next.js frontend.

## Architecture & Subsystems

The backend utilizes a **Modular Monolith** architecture:
*   **Framework**: NestJS (TypeScript) with class-validator/DTO request parsing.
*   **Database**: PostgreSQL with Prisma ORM and the `pgvector` extension for semantic recommendations.
*   **Caching & Jobs Queue**: Redis with BullMQ for background email deliveries, vector calculations, timeout triggers, and overdue action items.
*   **Authentication**: Clerk OAuth token verification with database user resolution and Role-Based Access Control (RBAC).
*   **Real-time messaging**: Socket.IO WebSockets namespace matching private conversation channels.
*   **Observability**: Health checks (`/health`), structured logging, and request correlation IDs.

```
       [ Next.js Frontend ]
               │ (HTTPS / WSS)
               ▼
   [ NestJS Gateway & Router ]
               │
        ┌──────┼──────┐
        ▼      ▼      ▼
     [Auth] [Chat] [Recs]  (Modular Subsystems)
        │      │      │
        └──────┬──────┘
               ▼
   [ PostgreSQL + pgvector ] <── [ Redis + BullMQ Jobs ]
```

---

## 1. Prerequisites

Ensure you have the following installed on your system:
*   **Node.js** (v18 or higher)
*   **PostgreSQL** (v15 or higher) with the **pgvector** extension installed
*   **Redis** (v7 or higher)

---

## 2. Installation & Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment variables by copying `.env.example` to `.env`:
    ```bash
    cp .env.example .env
    ```

---

## 3. Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Local server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://somesh:@localhost:5432/mentorconnect` |
| `REDIS_HOST` | Redis host for queues & cache | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `CLERK_JWKS_URL` | Clerk JSON Web Key Set URL | `https://api.clerk.com/v1/jwks` |
| `GEMINI_API_KEY` | Gemini AI key for embeddings | `(optional - fallbacks to dummy)` |
| `RESEND_API_KEY` | Resend API key for notification emails | `(optional - fallbacks to console log)` |
| `AWS_ACCESS_KEY_ID` | S3-compatible key | `(optional - fallbacks to local mock)` |
| `TOKEN_ENCRYPTION_KEY` | Hex key for encrypting OAuth tokens | `32_character_hex_key` |

---

## 4. Database Setup & Seeding

1.  **Run Migrations**: Create all schema tables, enums, and indexes:
    ```bash
    npx prisma migrate dev --name init
    ```
2.  **Generate Client**: Compile Prisma type definitions:
    ```bash
    npx prisma generate
    ```
3.  **Seed Data**: Populate database with Indian student/mentor records, LPU programs, goals, and matching weights:
    ```bash
    npm run prisma:seed
    ```

---

## 5. Running the Application

*   **Development Watch Mode**:
    ```bash
    npm run start:dev
    ```
*   **Production Build & Run**:
    ```bash
    npm run build
    npm run start:prod
    ```

Swagger interactive API documentation will be available locally at:
👉 **[http://localhost:3001/docs](http://localhost:3001/docs)**

---

## 6. Integrations Configuration

### AI Recommendations (pgvector)
1.  Provides a **hybrid recommendation model**:
    *   *Semantic similarity (35%)*: Generated using Gemini `text-embedding-004` (automatically projects/pads to 1536-dims).
    *   *Deterministic matching (65%)*: Skills overlap (15%), target role (10%), industry (10%), career goals (20%), and availability (10%).
2.  **Fallback Pipeline**: If Gemini/OpenAI endpoints fail or are down, the matching engine uses standard deterministic metrics and marks the results with `matchType: "FALLBACK"`.

### Calendar (Google / Outlook)
*   Integrates with Google Calendar using OAuth 2.0 (Google APIs).
*   Stored credentials (access/refresh tokens) are encrypted at rest using AES-256-CBC.
*   *Resilient*: Calendar connection failures set sync status to `FAILED` and log errors without blocking core session scheduling.

### Email (Resend)
*   Utilizes Resend to trigger transactional notifications.
*   All email operations are queued in **BullMQ** so that slow SMTP relays never block database writes. If Resend keys are missing, emails print directly to the server terminal as structured log payloads.

---

## 7. Running the Test Suite

We have built E2E integration tests matching the 10 critical business rules:
1.  **TEST 1**: Enforces mentor capacity rules (prevents accepting requests when full).
2.  **TEST 2**: Prevents concurrency race conditions (simultaneous acceptances lock & check limits).
3.  **TEST 3**: Limits students to 3 active pending requests.
4.  **TEST 4**: Rejects accepting expired requests.
5.  **TEST 5**: Screens out unverified mentors from searches.
6.  **TEST 6**: Validates resource ownership (returns `403 Forbidden` if student accesses other records).
7.  **TEST 7**: Asserts recommended endpoints return verified, active mentors.
8.  **TEST 8**: Verifies matching fallback operates when AI is down.
9.  **TEST 9**: Detects and rejects overlapping session bookings.
10. **TEST 10**: Scrubs private mentor contact information (email, tokens, addresses) from public profiles.

To execute tests:
```bash
npm run test
```

---

## 8. Docker & Compose Setup

To deploy the entire stack locally in docker containers (PostgreSQL, Redis, and NestJS API):
```bash
docker compose up --build
```
This maps:
*   NestJS API to `http://localhost:3001`
*   PostgreSQL (with pgvector) to host port `5432`
*   Redis cache to host port `6379`
