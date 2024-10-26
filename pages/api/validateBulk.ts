import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios';
import pLimit from 'p-limit';

const MAILGUN_BULK_API_URL = 'https://api.mailgun.net/v4/address/validate/bulk';
const MAILGUN_BULK_CHECK_URL = 'https://api.mailgun.net/v4/address/validate/bulk/LIST_ID';
const MAX_RETRIES = 3;
const CHUNK_SIZE = 250;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
    responseLimit: false,
    externalResolver: true,
  },
};

const axiosInstance = axios.create({
  timeout: 180000,
});

interface BulkValidationResponse {
  id: string;
  message: string;
}

interface ValidationResult {
  address: string;
  is_valid: boolean;
  reason?: string;
}

async function submitBulkValidation(
  emails: string[], 
  apiKey: string, 
  retryCount = 0
): Promise<BulkValidationResponse> {
  try {
    const response = await axiosInstance.post<BulkValidationResponse>(
      MAILGUN_BULK_API_URL,
      { addresses: emails },
      {
        auth: {
          username: 'api',
          password: apiKey,
        },
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return submitBulkValidation(emails, apiKey, retryCount + 1);
    }
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        throw new Error('Invalid API key or unauthorized access');
      }
      if (axiosError.response?.status === 504) {
        throw new Error('Gateway timeout - request took too long. Please try with a smaller batch.');
      }
      
      // Try to extract error message from response
      const errorData = axiosError.response?.data;
      const errorMessage = typeof errorData === 'object' && errorData !== null 
        ? JSON.stringify(errorData)
        : typeof errorData === 'string' 
          ? errorData
          : axiosError.message;
          
      throw new Error(`API Error (${axiosError.response?.status}): ${errorMessage}`);
    }
    throw new Error(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function checkBulkValidationStatus(
  listId: string, 
  apiKey: string, 
  retryCount = 0
): Promise<any> {
  try {
    const checkUrl = MAILGUN_BULK_CHECK_URL.replace('LIST_ID', listId);
    const response = await axiosInstance.get(checkUrl, {
      auth: {
        username: 'api',
        password: apiKey,
      },
      headers: {
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return checkBulkValidationStatus(listId, apiKey, retryCount + 1);
    }
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const errorData = axiosError.response?.data;
      const errorMessage = typeof errorData === 'object' && errorData !== null 
        ? JSON.stringify(errorData)
        : typeof errorData === 'string' 
          ? errorData
          : axiosError.message;
          
      throw new Error(`Status check failed (${axiosError.response?.status}): ${errorMessage}`);
    }
    throw error;
  }
}

async function waitForValidationResults(
  listId: string, 
  apiKey: string, 
  maxAttempts = 20
): Promise<ValidationResult[]> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const status = await checkBulkValidationStatus(listId, apiKey);
      
      if (status.status === 'completed') {
        return status.results;
      }
      
      if (status.status === 'failed') {
        throw new Error('Bulk validation failed: ' + (status.error || 'Unknown error'));
      }
      
      // Exponential backoff with max delay of 10 seconds
      const delay = Math.min(2000 + (attempt * 1000), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      if (attempt === maxAttempts - 1) throw error;
    }
  }
  
  throw new Error('Validation timed out after maximum attempts');
}

export default async function validateBulk(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emails, apiKey } = req.body;

    if (!emails?.length || !apiKey) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: !emails?.length ? 'No emails provided' : 'No API key provided'
      });
    }

    // Validate API key format
    if (!apiKey.startsWith('key-') || apiKey.length < 10) {
      return res.status(400).json({
        error: 'Invalid API key format',
        details: 'API key should start with "key-" and be at least 10 characters long'
      });
    }

    const emailChunks = [];
    for (let i = 0; i < emails.length; i += CHUNK_SIZE) {
      emailChunks.push(emails.slice(i, i + CHUNK_SIZE));
    }

    const limit = pLimit(1);
    const allResults: ValidationResult[] = [];
    const errors: string[] = [];

    for (let i = 0; i < emailChunks.length; i++) {
      const chunk = emailChunks[i];
      try {
        console.log(`Processing chunk ${i + 1}/${emailChunks.length}`);
        
        const bulkSubmission = await limit(async () => {
          const submission = await submitBulkValidation(chunk, apiKey);
          const results = await waitForValidationResults(submission.id, apiKey);
          return results;
        });
        
        allResults.push(...bulkSubmission);

        // Add delay between chunks to avoid rate limiting
        if (i < emailChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 8000));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Chunk ${i + 1} error: ${errorMessage}`);
        console.error(`Error processing chunk ${i + 1}:`, errorMessage);
        
        // Longer delay after error
        await new Promise(resolve => setTimeout(resolve, 15000));
      }
    }

    if (allResults.length === 0 && errors.length > 0) {
      return res.status(500).json({
        error: 'All validation attempts failed',
        details: errors
      });
    }

    return res.status(200).json({
      results: allResults.map(result => ({
        email: result.address,
        is_valid: result.is_valid,
        reason: result.reason,
        success: true
      })),
      totalProcessed: allResults.length,
      successful: allResults.filter(r => r.is_valid).length,
      failed: allResults.filter(r => !r.is_valid).length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Validation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      error: 'Validation failed', 
      details: errorMessage 
    });
  }
}