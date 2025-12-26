# 📚 Paperbase Research Hub

<p align="center">
  <img src="public/PB.png" alt="Paperbase Logo" width="120" />
</p>

<p align="center">
  <strong>An offline-first research paper organizer with AI-powered insights, annotations, and citation management.</strong>
</p>

<p align="center">
  Built for researchers, students, and academics who want clarity over chaos.
</p>

<p align="center">
  <!-- Build / Stack -->
  <img src="https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Backend-Express-black?style=flat-square&logo=express" />
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Styling-TailwindCSS-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" />
</p>

<p align="center">
  <!-- Auth / DB -->
  <img src="https://img.shields.io/badge/Auth-Clerk-6C47FF?style=flat-square&logo=clerk&logoColor=white" />
  <img src="https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Offline--First-IndexedDB-orange?style=flat-square" />
</p>

<p align="center">
  <!-- AI / Hosting -->
  <img src="https://img.shields.io/badge/AI-Google%20Gemini-4285F4?style=flat-square&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Hosting-Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white" />
</p>

<p align="center">
  <!-- Project Meta -->
  <img src="https://img.shields.io/badge/Architecture-Offline--First-blueviolet?style=flat-square" />
  <img src="https://img.shields.io/badge/Security-RLS%20Enabled-success?style=flat-square" />
  <img src="https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=flat-square" />
</p>

---

## ✨ What is Paperbase?

Paperbase is a full-stack research workspace designed to organize papers, extract knowledge, and scale research workflows — without losing control over your data.

It combines:

- 📄 **Local-first document storage**
- 🧠 **AI-powered analysis** (Gemini)
- 🔐 **Secure authentication** (Clerk)
- ☁️ **Durable cloud backup** (Supabase)
- 🚀 **Production-ready backend** (Express on Railway)

## 🚀 Feature Highlights

### 🗂️ Research Organization

- Project-centric research workflows
- Multiple documents per project
- Clean separation between projects
- Global file deduplication (SHA-256)

### 📄 PDF Reading & Annotation

- High-performance in-browser PDF viewer
- Persistent highlights & notes
- Page-linked and highlight-linked annotations
- Zoom, fullscreen, and navigation controls

### 🧠 AI-Powered Intelligence

- PDF metadata extraction using Google Gemini
- Automated citation generation
- Document-level and project-level insights
- Cached AI results to avoid reprocessing

### 📝 Notes & Highlights

- Color-coded highlights (Yellow, Green, Blue, Pink, Orange)
- Contextual notes tied to text or pages
- Sidebar navigation for quick access
- Restores seamlessly after document recovery

### 📚 Citation Management

**Formats supported:**
- APA
- IEEE
- MLA
- BibTeX

- Export as `.txt`, `.bib`, or `.rtf`
- Deterministic citation IDs (file-based reuse)
- Manual BibTeX editing supported

### 🗑️ Smart Trash System

- Soft delete with 10-day retention
- Restore documents with notes & highlights intact
- Storage-aware cleanup
- Safe hard-delete with reference checks

## 🧱 System Architecture

### High-Level Overview

```
Frontend (React + Vite)
│
├── IndexedDB / localStorage (Source of Truth)
│
├── Clerk (Authentication)
│
├── Supabase (Postgres + Storage + RLS)
│
└── Express Server (Railway)
    └── Gemini API (AI Processing)
```

### 🔑 Core Design Principles

- **Offline-first** → IndexedDB is primary
- **Non-blocking sync** → Backend mirrors local state
- **Deduplicated storage** → One file, many references
- **AI caching** → No repeated Gemini calls
- **Security by design** → Clerk + Supabase RLS
- **Recoverable by default** → Trash before hard delete

## 🛠️ Tech Stack

### Frontend

- **React 18** + **TypeScript**
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animation library
- **PDF.js / React-PDF** - PDF rendering
- **shadcn/ui + Radix UI** - Component library
- **TanStack Query** - Server state management

### Backend

- **Node.js**
- **Express**
- **Google Gemini API**
- **Multer** - File upload handling

### Auth & Storage

- **Clerk** — Authentication
- **Supabase** — PostgreSQL, Storage, RLS
- **Railway** — Backend hosting (Express)

## 🔐 Authentication & Security

- Clerk handles login, signup, sessions
- Clerk JWT → Supabase RLS authorization
- User isolation enforced at database level
- Backend routes protected via Clerk middleware
- No sensitive API keys exposed to frontend

## 📦 Data Storage Strategy

### Local (Primary)

- **IndexedDB** → documents, notes, highlights
- **localStorage** → metadata & fast access
- Instant UI response

### Cloud (Secondary)

- **Supabase Postgres** → durability & recovery
- **Supabase Storage** → PDF binaries
- Background sync (best-effort, non-blocking)

## 🚄 Hosting & Deployment

### Frontend

- **Railway**
- Static file server (Express) serving built Vite app
- Custom domain support (configure in Railway)

### Backend

- **Railway**
- Express server for:
  - Gemini API calls
  - AI caching
  - Deduplication logic
  - Rate limiting

### Database

- **Supabase**
- PostgreSQL + RLS
- File storage buckets

## ⚙️ Environment Variables

### Frontend (`.env`)

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_API_URL=https://your-backend.up.railway.app
```

### Backend (`server/.env`)

```env
GEMINI_API_KEY=your_gemini_api_key
PORT=3001
```

## 📁 Project Structure

```
paperbase-research-hub-main/
├── src/
│   ├── pages/              # Page components (routes)
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   └── workspace/     # Workspace-specific components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   │   ├── sync/         # Backend synchronization
│   │   ├── storage/      # Local storage utilities
│   │   └── trash/        # Trash management
│   ├── lib/              # Library code
│   └── types/            # TypeScript definitions
│
├── server/                # PDF extraction server
│   ├── index.js
│   ├── routes/
│   └── services/
│
├── public/                # Static assets
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** (comes with Node.js)
- Accounts for:
  - [Clerk](https://clerk.com) - Authentication
  - [Supabase](https://supabase.com) - Backend storage
  - [Google AI Studio](https://aistudio.google.com/app/apikey) - Gemini API (optional)

### Installation

1. **Clone the repository**

```bash
git clone <YOUR_REPOSITORY_URL>
cd paperbase-research-hub-main
```

2. **Install dependencies**

```bash
# Frontend
npm install

# Backend (optional)
cd server
npm install
cd ..
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001
```

For the server, create `server/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
PORT=3001
```

4. **Get API Keys**

#### Clerk Setup

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application or select existing one
3. Navigate to **API Keys** in the sidebar
4. Copy the **Publishable Key**
5. Add it to your `.env` file

#### Supabase Setup

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or select existing one
3. Navigate to **Settings** → **API**
4. Copy the **Project URL** → `VITE_SUPABASE_URL`
5. Copy the **anon public** key → `VITE_SUPABASE_PUBLISHABLE_KEY`
6. Set up database tables and Storage buckets (see Supabase setup below)

#### Gemini API Key (Optional)

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key and add it to `server/.env`

## 🧪 Development

### Frontend

```bash
npm run dev
```

The application will be available at `http://localhost:8080` (default port configured in `vite.config.ts`).

### Backend

```bash
cd server
npm run dev
```

The server runs on `http://localhost:3001` by default.

### Running Both

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd server
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server

# Build
npm run build            # Build for production
npm run build:dev        # Build for development mode
npm run preview          # Preview production build

# Code Quality
npm run lint             # Lint code
```

## 🚢 Deployment

### Frontend (Railway)

1. Connect your repository to Railway
2. Create a new service for the frontend
3. **Root Directory:** Leave as root (`.`)
4. **Build Command:** `npm run build` (auto-detected)
5. **Start Command:** `npm start` (auto-detected)
6. Add environment variables:
   - `VITE_CLERK_PUBLISHABLE_KEY` (your Clerk publishable key)
   - `VITE_SUPABASE_URL` (your Supabase project URL)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (your Supabase anon key)
   - `VITE_API_URL` (your Railway backend URL, e.g., `https://your-backend.up.railway.app`)
   - `PORT` (optional, Railway sets this automatically)
7. Deploy

**Note:** Railway will automatically:
- Build the frontend (`npm run build`)
- Start the server (`npm start`)
- Serve the static files from `dist/` directory

### Backend (Railway)

1. Connect your repository to Railway
2. Create a new service for the backend
3. **Root Directory:** Set to `server/`
4. Add environment variables:
   - `GEMINI_API_KEY` (your Google Gemini API key)
   - `PORT` (optional, defaults to 3001)
5. Deploy

**Important:** After deploying both services:
- Copy your backend Railway URL
- Update `VITE_API_URL` in your frontend Railway service with the backend URL
- Redeploy the frontend service

### Database (Supabase)

1. Set up PostgreSQL tables (projects, documents, notes, highlights, citations)
2. Configure Row-Level Security (RLS) policies
3. Create Storage bucket for PDF files
4. Configure Storage policies for user access

## 🧠 Why Paperbase Exists

Research is fragmented:

- PDFs scattered
- Notes lost
- Citations inconsistent
- Insights repeated

Paperbase centralizes research into a single, scalable system — designed to grow from solo study to institutional workflows.

## 📚 Documentation

### API Reference

#### PDF Extraction Server

- `GET /health` - Health check endpoint
- `POST /api/extract-pdf` - Extract PDF metadata (multipart/form-data)

See [server/README.md](server/README.md) for detailed server documentation.

### Key Concepts

#### Projects

Projects are top-level containers that organize your research work. Each project can contain:
- Multiple PDF documents
- Notes (project-wide or document-specific)
- Highlights (per document)
- Citations (auto-generated from document metadata)

#### Documents

Documents are PDF files uploaded to a project. Each document:
- Has unique metadata (title, authors, abstract, etc.)
- Can have multiple highlights
- Can have multiple notes attached
- Generates citations automatically

#### Data Persistence

- **Local-first**: Data is stored in IndexedDB/localStorage for immediate access
- **Cloud backup**: Supabase provides durable storage and cross-device sync
- **User isolation**: All data is scoped to the authenticated user

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Commit: `git commit -m 'Add some feature'`
5. Push: `git push origin feature/your-feature-name`
6. Open a Pull Request

## 📝 License

MIT License
Copyright (c) 2025 ROHAN CHAWDA

## 🆘 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

<p align="center">
  <strong>Built with ❤️ for researchers and academics</strong>
</p>
