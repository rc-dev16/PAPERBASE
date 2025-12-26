// Utility for extracting PDF metadata using Gemini API

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ExtractedPDFData {
  title?: string | null;
  authors?: string[] | null;
  abstract?: string | null;
  keywords?: string[] | null;
  journal?: string | null;
  publisher?: string | null;
  publicationDate?: string | null;
  doi?: string | null;
  isbn?: string | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
  language?: string | null;
  itemType?: string | null;
  proceedingsTitle?: string | null;
  conferenceName?: string | null;
  place?: string | null;
  series?: string | null;
  shortTitle?: string | null;
  url?: string | null;
  rights?: string | null;
  year?: number | null;
  pageCount?: number | null;
}

export interface ExtractionResponse {
  success: boolean;
  data?: ExtractedPDFData;
  fileName?: string;
  error?: string;
  message?: string;
}

/**
 * Extract PDF metadata and information using Gemini API
 * @param file - The PDF File object
 * @returns Extracted PDF data
 */
export const extractPDFInfo = async (file: File): Promise<ExtractedPDFData> => {
  try {const formData = new FormData();
    formData.append('pdf', file);

    const response = await fetch(`${API_BASE_URL}/api/extract-pdf`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result: ExtractionResponse = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Extraction failed');
    }return result.data;
  } catch (error) {throw error;
  }
};

/**
 * Check if the extraction API is available
 */
export const checkExtractionAPI = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === 'ok' && data.geminiConfigured === true;
  } catch (error) {return false;
  }
};


