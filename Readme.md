# DevPulse

A collaborative issue tracking API for software teams — report bugs, suggest features, and coordinate resolutions.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Issues](#issues)
  - [Metrics](#metrics)
- [Role & Permission Model](#role--permission-model)
- [Error Handling](#error-handling)
- [HTTP Status Codes](#http-status-codes)

---

## Tech Stack

| Technology     | Purpose                                      |
|----------------|----------------------------------------------|
| Node.js (LTS)  | Runtime                                      |
| TypeScript     | Strict typing throughout                     |
| Express.js     | Modular router architecture                  |
| PostgreSQL      | Relational database via native `pg` driver   |
| Raw SQL         | Direct `pool.query()` — no ORMs or JOINs    |
| bcryptjs       | Password hashing (rounds configurable)       |
| jsonwebtoken   | JWT generation and verification              |

---

## Project Structure

```
src/
├── config/
│   └── index.ts              # Environment config (port, DB, JWT, bcrypt)
├── db/
│   └── index.ts              # Connection pool + table initialisation
├── middleware/
│   ├── auth.ts               # JWT verification + role guard
│   ├── express.d.ts          # Express Request type augmentation
│   ├── globalErrorHandler.ts # Centralised error handler
│   └── logger.ts             # Request logger (console + logger.txt)
├── module/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.interface.ts
│   │   ├── auth.route.ts
│   │   └── auth.service.ts
│   ├── issue/
│   │   ├── issue.controller.ts
│   │   ├── issue.interface.ts
│   │   ├── issue.route.ts
│   │   └── issue.service.ts
│   └── metrics/
│       ├── metrics.controller.ts
│       ├── metrics.route.ts
│       └── metrics.service.ts
├── types/
│   └── index.ts              # Shared enums and types
├── utility/
│   ├── generateToken.ts      # JWT signing helper
│   └── sendResponse.ts       # Standardised response formatter
├── app.ts                    # Express app setup + route mounting
└── server.ts                 # Entry point — DB init then listen
```

---

## Getting Started

**Prerequisites:** Node.js 24+, PostgreSQL running locally or via connection string.

```bash
# 1. Clone and install
git clone <repo-url>
cd devpulse
npm install

# 2. Configure environment
cp .env.example .env
# edit .env with your values (see Environment Variables section)

# 3. Start development server
npm run dev

# 4. Build for production
npm run build
npm start
```

Tables are created automatically on first run via `initDB()` — no migration tool needed.

---

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
CONNECTIONSTRING=postgresql://user:password@localhost:5432/devpulse
JWT_SECRET=your_jwt_secret_here
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:3000
```

| Variable          | Required | Default                   | Description                          |
|-------------------|----------|---------------------------|--------------------------------------|
| `PORT`            | No       | `5000`                    | Port the server listens on           |
| `CONNECTIONSTRING`| Yes      | —                         | PostgreSQL connection string         |
| `JWT_SECRET`      | Yes      | —                         | Secret used to sign and verify JWTs  |
| `BCRYPT_ROUNDS`   | No       | `10`                      | bcrypt salt rounds (8–12 recommended)|
| `CORS_ORIGIN`     | No       | `http://localhost:3000`   | Allowed CORS origin                  |

---

## Database Schema

Tables are created automatically on startup. No foreign key constraints — reporter existence is validated in application logic.

### `users`

| Column       | Type          | Constraints                                      |
|--------------|---------------|--------------------------------------------------|
| `id`         | SERIAL        | PRIMARY KEY                                      |
| `name`       | VARCHAR(100)  | NOT NULL                                         |
| `email`      | VARCHAR(100)  | UNIQUE, NOT NULL                                 |
| `password`   | TEXT          | NOT NULL — bcrypt hash, never returned           |
| `role`       | VARCHAR(15)   | DEFAULT `contributor`, CHECK `contributor\|maintainer` |
| `created_at` | TIMESTAMP     | DEFAULT NOW()                                    |
| `updated_at` | TIMESTAMP     | DEFAULT NOW()                                    |

### `issues`

| Column        | Type         | Constraints                                             |
|---------------|--------------|---------------------------------------------------------|
| `id`          | SERIAL       | PRIMARY KEY                                             |
| `title`       | VARCHAR(150) | NOT NULL                                                |
| `description` | TEXT         | NOT NULL                                                |
| `type`        | VARCHAR(20)  | NOT NULL, CHECK `bug\|feature_request`                  |
| `status`      | VARCHAR(20)  | DEFAULT `open`, CHECK `open\|in_progress\|resolved`     |
| `reporter_id` | INT          | NOT NULL                                                |
| `created_at`  | TIMESTAMP    | DEFAULT NOW()                                           |
| `updated_at`  | TIMESTAMP    | DEFAULT NOW()                                           |

---

## API Reference

### Base URL

```
http://localhost:5000/api
```

### Authentication

Attach the JWT token directly in the `Authorization` header (no `Bearer` prefix):

```
Authorization: <token>
```

---

### Authentication

#### `POST /api/auth/signup`

Register a new user account.

**Access:** Public

**Request body:**

```json
{
  "name": "John Doe",
  "email": "john.doe@devpulse.com",
  "password": "securePassword123",
  "role": "contributor"
}
```

| Field      | Type   | Required | Notes                              |
|------------|--------|----------|------------------------------------|
| `name`     | string | Yes      |                                    |
| `email`    | string | Yes      | Must be unique                     |
| `password` | string | Yes      |                                    |
| `role`     | string | No       | `contributor` or `maintainer`, defaults to `contributor` |

**Response `201`:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@devpulse.com",
    "role": "contributor",
    "created_at": "2026-01-20T09:00:00Z",
    "updated_at": "2026-01-20T09:00:00Z"
  }
}
```

---

#### `POST /api/auth/login`

Authenticate and receive a JWT token.

**Access:** Public

**Request body:**

```json
{
  "email": "john.doe@devpulse.com",
  "password": "securePassword123"
}
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@devpulse.com",
      "role": "contributor",
      "created_at": "2026-01-20T09:00:00Z",
      "updated_at": "2026-01-20T09:00:00Z"
    }
  }
}
```

The token is valid for **24 hours**. The payload contains `id`, `name`, and `role`.

---

### Issues

#### `GET /api/issues`

Retrieve all issues. Supports optional filtering and sorting.

**Access:** Public

**Query parameters:**

| Param    | Values                          | Default   | Description         |
|----------|---------------------------------|-----------|---------------------|
| `sort`   | `newest`, `oldest`              | `newest`  | Sort by `created_at`|
| `type`   | `bug`, `feature_request`        | (none)    | Filter by type      |
| `status` | `open`, `in_progress`, `resolved` | (none)  | Filter by status    |

**Example:**

```
GET /api/issues?sort=oldest&type=bug&status=open
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Issues retrieved successfully",
  "data": [
    {
      "id": 45,
      "title": "Database connection timeout under load",
      "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
      "type": "bug",
      "status": "open",
      "reporter": {
        "id": 1,
        "name": "John Doe",
        "role": "contributor"
      },
      "created_at": "2026-01-20T10:30:00Z",
      "updated_at": "2026-01-20T14:45:00Z"
    }
  ]
}
```

Reporter details are fetched in a separate batched query (`WHERE id = ANY($1::int[])`), not a JOIN.

---

#### `GET /api/issues/:id`

Retrieve a single issue by ID.

**Access:** Public

**Response `200`:**

```json
{
  "success": true,
  "message": "Issue retrieved",
  "data": {
    "id": 45,
    "title": "Database connection timeout under load",
    "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
    "type": "bug",
    "status": "open",
    "reporter": {
      "id": 1,
      "name": "John Doe",
      "role": "contributor"
    },
    "created_at": "2026-01-20T10:30:00Z",
    "updated_at": "2026-01-20T14:45:00Z"
  }
}
```

---

#### `POST /api/issues`

Create a new bug report or feature request.

**Access:** Authenticated (`contributor`, `maintainer`)

**Headers:**

```
Authorization: <token>
```

**Request body:**

```json
{
  "title": "Database connection timeout under load",
  "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
  "type": "bug"
}
```

| Field         | Type   | Required | Validation                          |
|---------------|--------|----------|-------------------------------------|
| `title`       | string | Yes      | Max 150 characters                  |
| `description` | string | Yes      | Min 20 characters                   |
| `type`        | string | Yes      | `bug` or `feature_request`          |

`reporter_id` is extracted from the JWT — it is never accepted from the request body.

**Response `201`:**

```json
{
  "success": true,
  "message": "Issue created successfully",
  "data": {
    "id": 45,
    "title": "Database connection timeout under load",
    "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
    "type": "bug",
    "status": "open",
    "reporter_id": 1,
    "created_at": "2026-01-20T10:30:00Z",
    "updated_at": "2026-01-20T10:30:00Z"
  }
}
```

---

#### `PATCH /api/issues/:id`

Update an issue's title, description, type, or status.

**Access:**
- **Maintainer** — can update any issue, including `status`
- **Contributor** — can only update their own issues while `status` is `open`; cannot change `status`

**Headers:**

```
Authorization: <token>
```

**Request body** (all fields optional):

```json
{
  "title": "Updated: Database pool exhaustion fix needed",
  "description": "Updated description with reproduction steps...",
  "type": "bug",
  "status": "in_progress"
}
```

> `status` is silently ignored if the requester is a `contributor`.

**Response `200`:**

```json
{
  "success": true,
  "message": "Issue updated successfully",
  "data": {
    "id": 45,
    "title": "Updated: Database pool exhaustion fix needed",
    "description": "Updated description with reproduction steps...",
    "type": "bug",
    "status": "in_progress",
    "reporter_id": 1,
    "created_at": "2026-01-20T10:30:00Z",
    "updated_at": "2026-01-20T14:45:00Z"
  }
}
```

---

#### `DELETE /api/issues/:id`

Permanently delete an issue.

**Access:** Maintainer only

**Headers:**

```
Authorization: <token>
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Issue deleted successfully"
}
```

---

### Metrics

#### `GET /api/metrics`

Retrieve internal system statistics.

**Access:** Maintainer only

**Headers:**

```
Authorization: <token>
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Metrics retrieved successfully",
  "data": {
    "issues": {
      "total": 120,
      "by_status": {
        "open": 54,
        "in_progress": 31,
        "resolved": 35
      },
      "by_type": {
        "bug": 78,
        "feature_request": 42
      }
    },
    "users": {
      "total": 18,
      "by_role": {
        "contributor": 15,
        "maintainer": 3
      }
    }
  }
}
```

---

## Role & Permission Model

![Role Access Overview](./role_allow_to_acess.png)

| Action                         | contributor | maintainer |
|--------------------------------|:-----------:|:----------:|
| Register / login               | ✅          | ✅         |
| View all issues                | ✅          | ✅         |
| Create issue                   | ✅          | ✅         |
| Update own issue (status: open)| ✅          | ✅         |
| Update any issue               | ❌          | ✅         |
| Change issue status            | ❌          | ✅         |
| Delete any issue               | ❌          | ✅         |
| Access metrics                 | ❌          | ✅         |

---

## Error Handling

All errors follow the same shape:

```json
{
  "success": false,
  "message": "Description of what went wrong",
  "errors": "Optional detail"
}
```

Errors are caught in each controller and passed to the global error handler via `next(error)`. Unexpected errors return `500` without leaking stack traces.

---

## HTTP Status Codes

| Code  | Meaning               | When used                                                   |
|-------|-----------------------|-------------------------------------------------------------|
| `200` | OK                    | Successful GET, PATCH, DELETE                               |
| `201` | Created               | Successful POST (resource created)                          |
| `400` | Bad Request           | Validation error, invalid input, duplicate email            |
| `401` | Unauthorized          | Missing, expired, or invalid JWT                            |
| `403` | Forbidden             | Valid token but insufficient role/permissions               |
| `404` | Not Found             | Resource does not exist                                     |
| `409` | Conflict              | Contributor attempting to edit a non-open issue             |
| `500` | Internal Server Error | Unexpected server or database error                         |