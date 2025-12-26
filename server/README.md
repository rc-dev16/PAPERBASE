# Paperbase Server - PDF Extraction API

Server-side API service for extracting PDF metadata and information using Google's Gemini API.

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3001
   ```

3. **Get Gemini API Key:**
   - Visit: https://aistudio.google.com/app/apikey
   - Create a new API key
   - Copy it to your `.env` file

## Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:3001` by default.

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and Gemini API configuration status.

### Extract PDF Information
```
POST /api/extract-pdf
Content-Type: multipart/form-data

Body:
  pdf: <PDF file>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Paper Title",
    "authors": ["Author 1", "Author 2"],
    "abstract": "Abstract text...",
    "keywords": ["keyword1", "keyword2"],
    "journal": "Journal Name",
    "doi": "10.1234/example",
    "year": 2024,
    ...
  },
  "fileName": "paper.pdf"
}
```

## Environment Variables

- `GEMINI_API_KEY` (required): Your Google Gemini API key
- `PORT` (optional): Server port (default: 3001)

## Frontend Configuration

Update your frontend `.env` or `vite.config.ts` to point to the server:

```env
VITE_API_URL=http://localhost:3001
```

Or update `src/utils/pdfExtraction.ts` to change the `API_BASE_URL`.


