# Paperbase Research Hub - System Overview

## 1. Core System Basics

### User Roles
**How many roles?** 1 role (Single-user system)

**What can each role do?**
- **User**: Full access to their own projects, documents, notes, highlights, and citations. Can create projects, upload PDFs, annotate documents, generate citations, and manage their research workspace.

**Note**: No admin/mentor/student roles. The system uses Clerk authentication with Supabase Row-Level Security (RLS) to ensure users can only access their own data. Each user is isolated at the database level.

### Main Workflows
**Top 3 most important flows:**

1. **Project Creation & Document Upload Flow**
   - User creates a project → Uploads PDF files → System computes SHA-256 hash → Checks global file store for duplicates → Saves to IndexedDB → Uploads to Supabase Storage → Extracts metadata via Gemini API → Generates citations → Syncs to backend

2. **Document Reading & Annotation Flow**
   - User selects document → PDF loads from IndexedDB/Supabase → User highlights text → Creates notes → System saves to IndexedDB → Syncs highlights/notes to Supabase → User can navigate between documents, notes, and highlights

3. **Citation Management Flow**
   - System auto-generates citations (APA, IEEE, MLA, BibTeX) from extracted metadata → User can view/edit BibTeX → Export citations → Citations are file-scoped and reusable across projects

### Deployment
**Where is it deployed?** Railway

**Single service or frontend + backend separately?**
- **Frontend**: Separate Railway service (serves built Vite React app via Express static server)
- **Backend**: Separate Railway service (Express server for PDF extraction API)
- **Database**: Supabase (PostgreSQL + Storage)

**Architecture**: 3-tier deployment (Frontend Railway → Backend Railway → Supabase)

---

## 2. Backend & API Details

### API Endpoints
**Rough count:** ~2 REST endpoints

**Examples:**
- `GET /health` - Health check endpoint (returns server status and Gemini API configuration)
- `POST /api/extract-pdf` - PDF metadata extraction (multipart/form-data, uses Google Gemini API)

**Note**: Most data operations happen client-side via Supabase client library (not REST endpoints). The Express server is primarily for AI processing.

### Database
**DB:** PostgreSQL (via Supabase) ✅

**How many main tables?** ~6 tables

**Tables:**
1. `projects` - User projects (id, user_id, name, description, created_at, last_accessed)
2. `documents` - Document metadata (id, project_id, file_hash, title, file_name, file_type, version, deleted_at, trash_until)
3. `notes` - User annotations (id, user_id, project_id, pdf_id, content, page_number, position, created_at, updated_at)
4. `highlights` - Text highlights (id, user_id, project_id, pdf_id, file_hash, page_number, position, color, created_at)
5. `citations` - Citation data (id, file_hash, format, content, source, created_at)
6. `files` - File storage metadata (id, file_hash, storage_url, size, created_at)

**Relationships:**
- `documents.project_id` → `projects.id` (FK)
- `documents.file_hash` → `files.file_hash` (reference)
- `notes.project_id` → `projects.id` (FK)
- `notes.pdf_id` → `documents.id` (FK)
- `highlights.project_id` → `projects.id` (FK)
- `highlights.file_hash` → `files.file_hash` (reference)
- `citations.file_hash` → `files.file_hash` (reference)

**Additional Storage:**
- Supabase Storage bucket `files` for PDF binaries (keyed by file_hash)

### SQL Usage
**Did you write raw SQL for:**

- **Joins?** No - Uses Supabase client library `.select()` with `.eq()` filters (Supabase handles joins internally)
- **Filters?** Yes - Extensive use of `.eq()`, `.in()`, `.order()` for filtering and querying
- **Pagination?** No explicit pagination - Uses `.order()` for sorting, but no limit/offset pagination implemented
- **Indexes?** Not explicitly defined in code - Relying on Supabase default indexes and RLS policies

**SQL Pattern:** Supabase PostgREST client library (not raw SQL)

---

## 3. Authentication & Security

### Auth Provider
**Clerk** ✅ (Confirmed)

**Integration Pattern:**
- Clerk handles login, signup, session management
- Clerk JWT tokens passed to Supabase via `accessToken` callback
- Supabase RLS policies enforce user isolation using `auth.jwt()->>'sub'`

### RBAC
**Enforced where?**

- **Frontend**: Protected routes via `<ProtectedRoute>` component (checks `isSignedIn` from Clerk)
- **Backend**: Supabase Row-Level Security (RLS) policies enforce user isolation at database level
- **Storage**: Supabase Storage RLS policies restrict file access to owner

**Example rule:**
- "Users can only access their own projects" - Enforced via RLS policy: `user_id = auth.jwt()->>'sub'`
- "Users can only upload/access files they own" - Enforced via Storage RLS

### Protected Actions
**Name 1-2 actions that are role-protected:**

1. **Project Access**: Users can only view/edit/delete their own projects (enforced by RLS on `projects` table)
2. **File Upload**: Users can only upload files to their own storage bucket (enforced by Storage RLS)

**Note**: Since it's a single-user system, all protection is user-isolation based (not role-based).

---

## 4. Features That Prove "Real System"

| Feature | Status | Details |
|---------|--------|---------|
| **Pagination** | ❌ NO | No pagination implemented - loads all data at once |
| **Search** | ✅ YES | Project search (filters by name/description), document search in sidebar |
| **Filters** | ✅ YES | Active documents vs trash documents filter, project filtering by search query |
| **File uploads** | ✅ YES | PDF upload with drag-and-drop, file validation (size limit 50MB backend, 500MB frontend), MIME type checking |
| **Report generation** | ❌ NO | No report generation feature |
| **Email notifications** | ❌ NO | No email notifications |
| **Audit logs** | ❌ NO | No audit logging system |

**Additional Real Features:**
- ✅ **Soft delete with trash system** (10-day retention)
- ✅ **File deduplication** (SHA-256 hash-based)
- ✅ **AI-powered metadata extraction** (Google Gemini)
- ✅ **Citation generation** (APA, IEEE, MLA, BibTeX)
- ✅ **Offline-first architecture** (IndexedDB primary, Supabase backup)
- ✅ **Background sync** (non-blocking sync to Supabase)

---

## 5. Error Handling & Validation

### Input Validation
**Any input validation?** ✅ YES

**Examples:**
- **File upload validation**: File size limits (50MB backend, 500MB frontend), MIME type checking (PDF only on backend, PDF/Word/Markdown on frontend)
- **Project name validation**: Duplicate name checking, empty name prevention
- **BibTeX validation**: Required field validation, auto-fixing of malformed BibTeX entries
- **Required field validation**: Documents require `id`, `projectId`, `fileHash`, `title`, `fileName`, `fileType`

### Error Responses
**Any error responses (400/401/403)?** ✅ YES

**HTTP Status Codes Used:**
- `400` - Bad Request (e.g., "No PDF file provided")
- `401` - Unauthorized (handled by Clerk/Supabase RLS)
- `403` - Forbidden (handled by Supabase RLS)
- `500` - Internal Server Error (e.g., "Gemini API not configured", "Failed to parse extraction results")

**Error Handling Patterns:**
- Try-catch blocks around async operations
- Non-blocking error handling (sync failures don't stop app)
- User-friendly error messages via toast notifications
- Detailed error logging for debugging

### Specific Error Handling

**Invalid booking?** N/A (No booking system)

**Duplicate scheduling?** N/A (No scheduling system)

**Duplicate file upload?** ✅ Handled via SHA-256 hash deduplication - System checks if file hash exists before uploading

**Invalid PDF extraction?** ✅ Handled - Returns 500 error with error message, logs raw response for debugging

**Storage limit exceeded?** ✅ Handled - Checks storage usage before upload, returns error if limit reached

---

## 6. Testing / Dev Practices

### Postman Used?
**Postman used?** ❌ NO (No evidence of Postman collections or API testing setup)

### Test Cases Written?
**Any test cases written?** ❌ NO (No test files found - no `__tests__`, `*.test.ts`, `*.spec.ts` files)

### Separate Dev/Prod Env?
**Separate dev/prod env?** ✅ YES
- Frontend: Uses `.env` file for local development
- Environment variables: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_URL`
- Backend: Uses `dotenv` for environment variables (`GEMINI_API_KEY`, `PORT`)
- Railway handles production environment variables

### .env Variables?
**Yes** - Both frontend and backend use `.env` files (see `.env` file in root)

---

## 7. Numbers You Can Safely Claim

### System Metrics

| Metric | Count |
|--------|-------|
| **User Roles** | 1 (Single-user system) |
| **Database Tables** | 6 (projects, documents, notes, highlights, citations, files) |
| **API Endpoints** | 2 (GET /health, POST /api/extract-pdf) |
| **Core Features/Modules** | 8+ |
|   - Project Management | ✅ |
|   - Document Upload & Storage | ✅ |
|   - PDF Viewer | ✅ |
|   - Highlighting System | ✅ |
|   - Notes System | ✅ |
|   - Citation Generation | ✅ |
|   - AI Metadata Extraction | ✅ |
|   - Trash/Recovery System | ✅ |

### Additional Counts

- **Citation Formats Supported**: 4 (APA, IEEE, MLA, BibTeX)
- **Storage Layers**: 2 (IndexedDB primary, Supabase backup)
- **Authentication Providers**: 1 (Clerk)
- **Database Systems**: 1 (Supabase PostgreSQL)
- **Backend Services**: 1 (Express server)
- **File Size Limits**: 2 (50MB backend, 500MB frontend)
- **Trash Retention Period**: 10 days

---

## Summary

**Architecture**: Offline-first React app with Express backend and Supabase database
**Auth**: Clerk + Supabase RLS
**Database**: PostgreSQL (6 tables)
**API**: 2 REST endpoints (health check + PDF extraction)
**Features**: 8+ core modules (projects, documents, notes, highlights, citations, AI extraction, trash system, file deduplication)
**Deployment**: Railway (frontend + backend separately) + Supabase
**Security**: RLS at database level, protected routes at frontend level
**Error Handling**: Comprehensive validation and error responses (400, 401, 403, 500)
