import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import pLimit from 'p-limit';

const MAILGUN_API_URL = 'https://api.mailgun.net/v4/address/validate';
// Increase timeout for the API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', // Adjust as needed
    },
    responseLimit: false,
    externalResolver: true,
  },
};

// Configure axios with timeout
const axiosInstance = axios.create({
  timeout: 30000, // 30 seconds timeout
});

async function validateSingleEmail(email: string, apiKey: string) {
  try {
    const response = await axiosInstance.get(MAILGUN_API_URL, {
      params: { address: email },
      auth: {
        username: 'api',
        password: apiKey,
      },
    });
    return { email, ...response.data, success: true };
  } catch (error) {
    console.error(`Error validating email ${email}:`, error);
    if (axios.isAxiosError(error)) {
      return {
        email,
        error: error.message || 'Axios error occurred',
        status: error.response?.status,
        data: error.response?.data,
        success: false,
      };
    }
    return { email, error: 'Unknown error occurred', success: false };
  }
}

export default async function validateBulk(req: NextApiRequest, res: NextApiResponse) {
  console.log('Received request to /api/validateBulk');

  try {
    const { emails, apiKey } = req.body;

    if (!emails || !apiKey) {
      return res.status(400).json({ error: 'Missing required fields: emails or apiKey' });
    }

    // Split emails into smaller chunks
    const chunkSize = 50;
    const emailChunks = [];
    for (let i = 0; i < emails.length; i += chunkSize) {
      emailChunks.push(emails.slice(i, i + chunkSize));
    }

    const limit = pLimit(3); // Reduced concurrency to avoid rate limits
    const results = [];

    // Process chunks sequentially
    for (const chunk of emailChunks) {
      const chunkResults = await Promise.all(
        chunk.map((email: string) =>
          limit(() => validateSingleEmail(email, apiKey))
        )
      );
      results.push(...chunkResults);

      // Add a small delay between chunks to avoid rate limits
      if (emailChunks.indexOf(chunk) < emailChunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return res.status(200).json({ 
      results,
      totalProcessed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

  } catch (error) {
    console.error('Validation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Validation failed', details: errorMessage });
  }
}