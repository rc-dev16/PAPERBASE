import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

// Initialize Gemini API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY not found in environment variables');
}

// Initialize Gemini AI client
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// ✅ USE THESE AVAILABLE MODEL NAMES (based on your API key)
const modelsToTry = [
  'gemini-2.5-flash',      // Newest, fast, good for extracting text
  'gemini-2.0-flash',      // Stable 2.0 version
  'gemini-2.0-flash-exp',  // Experimental but works
  'gemini-2.5-pro',       // Newest, smarter, better for complex reasoning
];

// PDF extraction prompt
const EXTRACTION_PROMPT = `Extract all metadata and information from this PDF document. Return a JSON object with the following structure:

{
  "title": "Full title of the paper",
  "authors": ["Author 1", "Author 2", ...],
  "abstract": "Complete abstract text",
  "keywords": ["keyword1", "keyword2", ...],
  "journal": "Journal or conference name",
  "publisher": "Publisher name",
  "publicationDate": "Publication date (YYYY-MM-DD or YYYY)",
  "doi": "DOI if available",
  "isbn": "ISBN if available",
  "volume": "Volume number",
  "issue": "Issue number",
  "pages": "Page range (e.g., '1-10')",
  "language": "Language of the document",
  "itemType": "Type (e.g., 'journalArticle', 'conferencePaper', 'book', etc.)",
  "proceedingsTitle": "Proceedings title if conference paper",
  "conferenceName": "Conference name if applicable",
  "place": "Place of publication",
  "series": "Series name if applicable",
  "shortTitle": "Short title if available",
  "url": "URL if available",
  "rights": "Copyright or rights information",
  "year": "Publication year (number)",
  "pageCount": "Total number of pages (number)"
}

Extract as much information as possible. If a field is not available, use null. Return ONLY valid JSON, no additional text or markdown.`;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', geminiConfigured: !!genAI });
});

// PDF extraction endpoint
app.post('/api/extract-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({
        error: 'Gemini API not configured. Please set GEMINI_API_KEY environment variable.',
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    console.log(`📄 Processing PDF: ${req.file.originalname} (${req.file.size} bytes)`);

    // Convert PDF buffer to base64 (Standard for Node.js SDK)
    const base64Data = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    console.log('🤖 Sending request to Gemini API via SDK...');
    
    let text;
    let lastError = null;
    
    try {
      // Try each model until one works
      for (const modelName of modelsToTry) {
        try {
          console.log(`🔄 Trying model: ${modelName}`);
          
          // Get the model
          const model = genAI.getGenerativeModel({ model: modelName });

          // Call API with PDF and prompt
          // Format: [PDF part, text prompt]
          const result = await model.generateContent([
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            EXTRACTION_PROMPT,
          ]);

          const response = await result.response;
          text = response.text();
          
          console.log(`✅ Successfully used model: ${modelName}`);
          break; // Success! Exit the loop
          
        } catch (modelError) {
          console.error(`❌ Error with model ${modelName}:`, modelError.message);
          
          // Check specifically for Model Not Found
          if (modelError.message && (
            modelError.message.includes('404') ||
            modelError.message.includes('not found') ||
            modelError.message.includes('NOT_FOUND')
          )) {
            console.warn(`⚠️ Model ${modelName} not found. Trying next model...`);
            lastError = modelError;
            continue; // Try next model
          }
          
          // Check for rate limits
          if (modelError.message && (
            modelError.message.includes('429') ||
            modelError.message.includes('quota') ||
            modelError.message.includes('rate limit')
          )) {
            console.warn(`⚠️ Rate limit for ${modelName}. Trying next model...`);
            lastError = modelError;
            continue; // Try next model
          }
          
          // For other errors, throw immediately
          throw modelError;
        }
      }
      
      // If we get here and text is still undefined, all models failed
      if (!text) {
        const finalError = lastError || new Error('All models failed. Please check your API key and quota.');
        console.error('❌ All models failed:', finalError);
        throw finalError;
      }
      
    } catch (finalError) {
      console.error('❌ Gemini API error:', finalError);
      console.error('Error details:', {
        message: finalError.message,
        name: finalError.name,
        stack: finalError.stack,
      });
      
      // Check if it's an API key or authentication error
      if (finalError.message && (
        finalError.message.includes('API_KEY') ||
        finalError.message.includes('authentication') ||
        finalError.message.includes('401') ||
        finalError.message.includes('403')
      )) {
        throw new Error(`Gemini API authentication failed. Please check your GEMINI_API_KEY. Error: ${finalError.message}`);
      }
      
      throw new Error(`Gemini API error: ${finalError.message}`);
    }

    console.log('✅ Gemini extraction completed');
    console.log('📝 Raw response length:', text.length, 'characters');

    // Parse the JSON response
    let extractedData;
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response:', parseError);
      console.error('Raw response:', text);
      return res.status(500).json({
        error: 'Failed to parse extraction results',
        rawResponse: text,
      });
    }

    // Return the extracted data
    res.json({
      success: true,
      data: extractedData,
      fileName: req.file.originalname,
    });
  } catch (error) {
    console.error('❌ Error extracting PDF:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
    });
    res.status(500).json({
      error: 'Failed to extract PDF information',
      message: error.message,
      details: error.stack,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  if (!genAI) {
    console.warn('⚠️  Gemini API not configured. Set GEMINI_API_KEY environment variable.');
  } else {
    console.log('✅ Gemini API key configured');
    console.log('📋 Available models:', modelsToTry.join(', '));
  }
});
