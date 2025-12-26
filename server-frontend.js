// Simple static file server for Railway deployment
// Serves the built Vite app with SPA routing support

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the dist directory
const distPath = join(__dirname, 'dist');

if (!existsSync(distPath)) {
  console.error('❌ Error: dist directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Serve static assets
app.use(express.static(distPath));

// Handle SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Frontend server running on port ${PORT}`);
  console.log(`📦 Serving files from: ${distPath}`);
});

