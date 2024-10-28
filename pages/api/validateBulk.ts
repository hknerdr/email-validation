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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emails, credentials } = req.body;

    const MAX_EMAILS = 500; // Define maximum emails per request

    // Validate request body
    if (!emails?.length || !credentials?.accessKeyId || !credentials?.secretAccessKey) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: !emails?.length ? 'No emails provided' : 'Invalid AWS credentials'
      });
    }

    if (emails.length > MAX_EMAILS) {
      return res.status(400).json({
        error: `Too many emails. Maximum allowed is ${MAX_EMAILS}.`,
      });
    }

    const validator = createHybridValidator({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: credentials.region || 'us-east-1'
    });

    const validationResult: BulkValidationResult = await validator.validateBulk(emails);

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
    return res.status(500).json({ 
      error: 'Validation failed', 
      details: errorMessage 
    });
  }
}
