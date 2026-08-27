# LPU MentorConnect Backend - Implementation & Verification Guide

This document details the architecture, data models, business rules, and API endpoints implemented for the **Lovely Professional University (LPU) Alumni Mentorship & Career Network (LPU MentorConnect)** backend.

---

## 1. System Architecture & Features

The backend is built as a production-grade **NestJS** application utilizing **MongoDB 7+ (via Mongoose)** as the primary database, and **Redis** for caching, queueing, and WebSockets.

### Core Modules Implemented
1.  **Clerk Authentication Guard**: Resolves JWTs from Clerk, matches users with MongoDB, and auto-onboards students and alumni on their first login.
2.  **AI matching & Vector Fallback**:
    *   Computes match scores between student target profiles and mentor credentials.
    *   Implements an in-memory **Cosine Similarity Vector Search** fallback in `MatchingService` so recommendations work smoothly on local standalone MongoDB environments (without Atlas-only `$vectorSearch` requirements).
3.  **Standalone Transaction Helper**: Includes a wrapper utility that seamlessly executes atomic queries sequentially if MongoDB is running as a standalone local server, preserving transaction safety on replica set nodes.
4.  **Google Calendar Integration**: Implements Google Calendar OAuth credential flows with encrypted storage for seamless session scheduling.
5.  **Notifications & Websockets**: Real-time event notifications and private cursored direct messaging via Socket.io/WebSockets.
6.  **Background Job Queues**: Uses BullMQ/Redis to process asynchronous jobs like avatar optimization and AI embedding computations.

---

## 2. MongoDB Data Models (Mongoose Schemas)

The database schema has 18 models defined under `src/database/schemas/`:

*   **User**: Handles core identity, profile status, and roles (`STUDENT`, `MENTOR`, `ADMIN`, `ALUMNI_OFFICER`, `PLACEMENT_OFFICER`).
*   **StudentProfile**: Stores student academic parameters, target industry, target role, current skills, and AI query vectors.
*   **MentorProfile**: Stores alumni graduation year, current designation, experience level, capacity metrics, and AI matching vectors.
*   **AlumniVerification**: Manages alumni documentation reviews.
*   **Availability**: Stores calendar schedule slots.
*   **MentorshipRequest & Mentorship**: Tracks mentorship invitations and active relationships.
*   **Session, Goal & ActionItem**: Manages schedules, milestone goals, and action tasks.
*   **Conversation & Message**: Direct messaging databases.
*   **Notification & Feedback**: Notification log and rating records.
*   **SystemConfig**: Platform weights for custom matching metrics.
*   **AuditLog**: Audit logging for sensitive administrative actions.

## 3. How to Run & Verify the Project

### Prerequisites
*   Node.js v18+ & npm
*   MongoDB Atlas Cloud cluster
*   Redis (running on port `6379`)

> [!NOTE]
> Redis can be run using the updated root `docker-compose.yml` file. If running docker locally, use `docker compose up -d` (without hyphen).

### Step-by-Step Instructions

1.  **Navigate to the backend directory**:
    ```bash
    cd backend
    ```
2.  **Verify or create `.env`**:
    Ensure `DATABASE_URL` is set to the MongoDB Atlas URI:
    DATABASE_URL="mongodb+srv://mentorconnect:mentorconnect@cluster0.iuja9rt.mongodb.net/mentorconnect?retryWrites=true&w=majority&appName=Cluster0"
    REDIS_URL="rediss://default:gQAAAAAAAVYOAAIgcDE0MWM3NTQ1ZDdkMDE0OTMyOGJjNDc4ZjQ1ZjY3MjdiMg@dynamic-cow-87566.upstash.io:6379"
    REDIS_HOST="dynamic-cow-87566.upstash.io"
    REDIS_PORT=6379
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Run the Database Seeder**:
    This deletes previous records and inserts realistic LPU taxonomic parameters, configuration values, and mock users:
    ```bash
    npm run seed
    ```
5.  **Start the NestJS dev server**:
    ```bash
    npm run start:dev
    ```
    The server starts at `http://localhost:3001` with Swagger docs available at `http://localhost:3001/api`.

6.  **Run the E2E Integration Tests**:
    The tests verify all 10 core business logic constraints (throttling requests, concurrent caps, overlapping calendar slots, unverified filters):
    ```bash
    npx jest --config jest.config.js
    ```

---

## 4. API Endpoints Reference

All requests must include a Bearer JWT Token (`Authorization: Bearer <clerk_token>`) except mock endpoints.

### Authentication & Users (`/me`)
*   `GET /me` - Get logged-in user context.
*   `PATCH /me` - Update basic details (`firstName`, `lastName`, `avatar`).
*   `GET /me/profile` - Get student or mentor role profile data.

### Student Career Profiles (`/students`)
*   `GET /students/me` - Read student profile.
*   `PATCH /students/me` - Update study parameters and skills.
*   `PATCH /students/me/career` - Update student career settings.

### Mentor & Alumni Directories (`/mentors`)
*   `GET /mentors` - Paginated query list with filters (`skills`, `experienceMin`, `search`).
*   `GET /mentors/me` - Get logged-in mentor profile.
*   `PATCH /mentors/me` - Update designation, biography, and mentee limits.
*   `GET /mentors/:id` - Detailed public profile card.
*   `GET /mentors/:id/availability` - Fetch scheduled appointment windows.

### AI Recommendations (`/recommendations`)
*   `GET /recommendations/mentors` - Fetch recommended mentors.
*   `GET /recommendations/mentors/:id` - Get specific cosine similarity metrics for a mentor.
*   `POST /recommendations/recalculate` - Invalidate cached recommendations.

### Mentorship Request Management (`/requests`)
*   `POST /requests` - Request a mentor. *Enforces 3 pending request cap.*
*   `GET /requests` - List incoming/outgoing requests.
*   `GET /requests/:id` - Read request details.
*   `POST /requests/:id/accept` - Accept request. *Enforces capacity constraints.*
*   `POST /requests/:id/decline` - Decline request.
*   `POST /requests/:id/cancel` - Cancel request.

### Active Mentorship Relationships (`/mentorships`)
*   `GET /mentorships` - List active relationships.
*   `GET /mentorships/:id` - Relationship dashboard (mentorship record, student profile, goals).
*   `PATCH /mentorships/:id` - Pause, Resume, or Complete mentorship status.

### Scheduled Sessions (`/mentorships/:id/sessions`)
*   `GET /mentorships/:id/sessions` - List scheduled calls.
*   `POST /mentorships/:id/sessions` - Book meeting slot. *Enforces overlap conflict prevention.*
*   `PATCH /sessions/:id` - Reschedule session.
*   `DELETE /sessions/:id` - Cancel session.

### Milestone Tracking (`/mentorships/:id/goals`)
*   `GET /mentorships/:id/goals` - Fetch milestone list.
*   `POST /mentorships/:id/goals` - Add mentorship goal.
*   `PATCH /goals/:id` - Update goal progress.
*   `DELETE /goals/:id` - Delete milestone.

### Action Items (`/mentorships/:id/action-items`)
*   `GET /mentorships/:id/action-items` - List tasks.
*   `POST /mentorships/:id/action-items` - Assign action task.
*   `PATCH /action-items/:id` - Check/uncheck task status.

### Direct Messaging (`/conversations`)
*   `GET /conversations` - List active conversations with metadata.
*   `GET /conversations/:id/messages` - Paginated cursored history.
*   `POST /conversations/:id/messages` - Send text message.

### Notifications & Feedback (`/notifications` & `/mentorships/:id/feedback`)
*   `GET /notifications` - Unread alerts.
*   `PATCH /notifications/:id/read` - Dismiss alert.
*   `POST /notifications/read-all` - Dismiss all alerts.
*   `POST /mentorships/:id/feedback` - Submit mentor rating and feedback.
*   `GET /mentorships/:id/feedback` - View reviews.

### Alumni Verification (`/verification`)
*   `POST /verification` - Upload graduation document link for verification.
*   `GET /verification` - List all submissions (*Admin/Alumni Officer only*).
*   `PATCH /verification/:id/approve` - Verify alumnus status (*Admin/Alumni Officer only*).
*   `PATCH /verification/:id/reject` - Reject submission (*Admin/Alumni Officer only*).

### Admin Settings & Config (`/admin`)
*   `GET /admin/dashboard` - Detailed counts.
*   `GET /admin/users` - Platform user list.
*   `GET /admin/matching/config` - Get AI weights.
*   `PATCH /admin/matching/config` - Dynamically updates matching weights. *Requires weights sum to exactly 100.*
