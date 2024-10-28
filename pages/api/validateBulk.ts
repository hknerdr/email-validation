// pages/api/validateBulk.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { createHybridValidator } from '../../utils/hybridValidator';
import type { SESValidationResult, ValidationStatistics, BulkValidationResult } from '../../utils/types';

// Define the shape of a successful validation response
interface ValidationResponse {
  results: SESValidationResult[];
  stats: ValidationStatistics;
  totalProcessed: number;
  successful: number;
  failed: number;
}

// Define the shape of an error response
interface ErrorResponse {
  error: string;
  details?: string;
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
    responseLimit: false,
    externalResolver: true,
  },
};

export default async function validateBulk(
  req: NextApiRequest,
  res: NextApiResponse<ValidationResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    console.error(`Invalid method: ${req.method}. Only POST is allowed.`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emails, credentials } = req.body;

    const MAX_EMAILS = 500; // Define maximum emails per request

    // Validate request body
    if (!emails?.length) {
      const missing = 'No emails provided.';
      console.error(`Bad Request: ${missing}`);
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: missing
      });
    }

    if (!credentials?.accessKeyId || !credentials?.secretAccessKey || !credentials?.region) {
      const missingCreds = 'Missing AWS credentials.';
      console.error(`Bad Request: ${missingCreds}`);
      return res.status(400).json({ 
        error: 'Missing AWS credentials',
        details: missingCreds
      });
    }

    if (emails.length > MAX_EMAILS) {
      console.error(`Too many emails: ${emails.length}. Maximum allowed is ${MAX_EMAILS}.`);
      return res.status(400).json({
        error: `Too many emails. Maximum allowed is ${MAX_EMAILS}.`,
      });
    }

    const validator = createHybridValidator(credentials);

    console.log(`Starting bulk validation for ${emails.length} emails.`);

    const validationResult: BulkValidationResult = await validator.validateBulk(emails);

    console.log(`Bulk validation completed. Success: ${validationResult.stats.verified}, Failed: ${validationResult.stats.failed}`);

    return res.status(200).json({
      results: validationResult.results,
      stats: validationResult.stats,
      totalProcessed: validationResult.results.length,
      successful: validationResult.results.filter(r => r.is_valid).length,
      failed: validationResult.results.filter(r => !r.is_valid).length
    });

  } catch (error) {
    console.error('Validation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';

    // Attempt to send detailed error response
    try {
      res.status(500).json({ 
        error: 'Validation failed', 
        details: errorMessage 
      });
    } catch (jsonError) {
      console.error('Failed to send JSON error response:', jsonError);
      res.status(500).end('Validation failed');
    }
  }
}
