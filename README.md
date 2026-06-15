# 🛠️ MECMS Backend - Calibration & Preventive Maintenance API

Welcome to the backend service for the **Medical Equipment Calibration & Management System (MECMS)**. This system is built using the **NestJS** framework, providing a highly scalable, robust, and secure RESTful API to manage medical equipment, schedule maintenance, log calibrations, and coordinate alerts via a LINE chatbot.

---

## 🚀 Tech Stack Overview

- **Core Framework:** NestJS (v11) - Node.js progressive framework
- **Programming Language:** TypeScript (strict mode)
- **Database ORM:** TypeORM (v0.3.x)
- **Database Driver:** PostgreSQL (`pg`) & MySQL compatible
- **Authentication:** Passport.js, JWT (`@nestjs/jwt`, `@nestjs/passport`), Bcrypt hashing
- **Data Validation:** `class-validator` & `class-transformer`
- **API Documentation:** OpenAPI / Swagger (`@nestjs/swagger`)
- **File Uploads:** Multer with S3 Compatible Storage integration (MinIO/AWS S3)
- **AI Integrations:** Gemini API & Groq API for schedule analysis
- **Notification Services:** LINE Bot SDK (LINE Messaging API / Flex Cards)

---

## 📦 Core Feature Modules

The codebase is organized into isolated, domain-driven modules inside the `src` directory:

1. **`auth` & `user` & `role`:** Handles authentication, JWT strategy, registration, password hashing, and role-based access control (RBAC) (e.g. Admin, Technician, Approver).
2. **`equipment`:** Manages medical devices, active status, hospital locations, and tracking history.
3. **`pm-checklist`:** Configures Preventive Maintenance (PM) check categories and item templates.
4. **`task` & `calibration-process`:** Coordinates calibration jobs, updates task states, links calibrators (standard tools), tracks checklists, and saves calibration results. Uses ACID transactions to ensure database consistency.
5. **`standard-tool`:** Manages standard master calibrators and instruments used to perform calibrations.
6. **`hospital` & `section`:** Manages hospital details, branches, and specific department sections.
7. **`notification`:** Logs app notifications, manages background synchronization, and schedules automated alerts using NestJS `@nestjs/schedule` cron tasks.
8. **`line`:** Webhook controller and handler for the LINE Chatbot. Manages user account linkage with LINE User IDs and dispatches rich interactive Flex Cards to technicians.
9. **`gemini`:** Integrates the Google Gemini API to analyze technician workloads, highlight bottlenecks, and suggest optimized scheduling insights.
10. **`storage`:** Uploads files (e.g. calibration certificates, equipment images) to MinIO/S3 and returns pre-signed URLs.

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory. Below is the configuration structure:

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| **`PORT`** | Port number the backend server runs on | `3000` |
| **`HOST`** | Host address to bind the server to | `0.0.0.0` |
| **`DB_TYPE`** | Database system to connect to | `postgres` or `mysql` |
| **`DB_HOST`** | Database host hostname | `localhost` |
| **`DB_PORT`** | Database port | `5433` |
| **`DB_USERNAME`** | Database connection username | `postgres` |
| **`DB_PASSWORD`** | Database connection password | `yourpassword` |
| **`DB_DATABASE`** | Database name | `calibration` |
| **`DB_SYNCHRONIZE`** | Auto-sync database schema (Set to `false` in production) | `true` |
| **`JWT_SECRET`** | Secret key for signing JSON Web Tokens | `your-super-secret-key` |
| **`JWT_EXPIRES_IN`** | Expiration limit for JWTs | `1d` |
| **`FRONTEND_URL`** | Allowed CORS origin for the React app | `http://localhost:5173` |
| **`LINE_CHANNEL_ACCESS_TOKEN`** | Token from the LINE Developers console | `YOUR_LINE_ACCESS_TOKEN` |
| **`LINE_CHANNEL_SECRET`** | Secret key from the LINE Developers console | `YOUR_LINE_SECRET` |
| **`STORAGE_PROVIDER`** | File upload provider backend | `minio` or `s3` |
| **`S3_ENDPOINT`** | Endpoint URL for the S3 bucket service | `http://localhost:9002` |
| **`S3_ACCESS_KEY`** | Access key for S3 compatible store | `minioadmin` |
| **`S3_SECRET_KEY`** | Secret key for S3 compatible store | `minioadminpassword` |
| **`S3_BUCKET_NAME`** | Name of the bucket to store files | `calibration` |
| **`S3_REGION`** | Region parameter for AWS S3 | `us-east-1` |
| **`S3_PUBLIC_URL`** | Publicly accessible URL for uploaded resources | `http://localhost:9002/calibration` |
| **`GEMINI_API_KEY`** | API Key for Google Gemini API AI schedules | `YOUR_GEMINI_API_KEY` |
| **`GROQ_API_KEY`** | API Key for Groq API backup logic | `YOUR_GROQ_API_KEY` |

---

## 🛠️ Project Setup & Installation

### 1. Install Dependencies
```bash
$ npm install
```

### 2. Database Migrations
The database schema changes are managed via TypeORM migrations.

```bash
# Run pending migrations
$ npm run migration:run

# Revert the last run migration
$ npm run migration:revert
```

---

## 🏃 Running the Application

```bash
# Development (with watch mode)
$ npm run start:dev

# Debug mode
$ npm run start:debug

# Build production bundle
$ npm run build

# Run in production mode
$ npm run start:prod
```

---

## 🧪 Running Tests

```bash
# Run unit tests (Jest)
$ npm run test

# Run end-to-end integration tests (Supertest)
$ npm run test:e2e

# Check test coverage
$ npm run test:cov
```

---

## 📚 API Documentation (Swagger)

Once the application is running, you can explore, test, and view the API endpoints interactively:

- **Swagger UI Path:** [http://localhost:3000/api](http://localhost:3000/api) (Replace `3000` with your customized `PORT` variable).

---

## 🧑‍💻 Git Workflow (Multiple Remotes)

This project is set up with multiple Git remotes to support deployment/collaboration across both **GitLab** and **GitHub**:

- **GitLab (origin):** `https://gitlab.com/finish-line1/back_cal.git`
- **GitHub (github):** `https://github.com/Nunnaphat-View/mecms_backend.git`

To push updates to both repositories, run:

```bash
# Push current branch to GitLab
$ git push origin <branch-name>

# Push current branch to GitHub
$ git push github <branch-name>
```
