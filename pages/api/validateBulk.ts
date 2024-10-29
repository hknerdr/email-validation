// pages/api/validateBulk.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { smtpValidator } from '../../utils/smtpValidator';
import type { 
  SESValidationResult, 
  ValidationStatistics, 
  BulkValidationResult 
} from '../../utils/types';
import { batchEmails } from '../../utils/batchEmails';

interface ValidationResponse {
  results: SESValidationResult[];
  stats: ValidationStatistics;
}

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
    const { emails } = req.body;

    const MAX_EMAILS = 500; // Define maximum emails per request

    // Validate request body
    if (!emails?.length) {
      console.error(`Bad Request: No emails provided`);
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'No emails provided'
      });
    }

    if (emails.length > MAX_EMAILS) {
      console.error(`Too many emails: ${emails.length}. Maximum allowed is ${MAX_EMAILS}.`);
      return res.status(400).json({
        error: `Too many emails. Maximum allowed is ${MAX_EMAILS}.`,
      });
    }

    console.log(`Starting bulk validation for ${emails.length} emails.`);

    const validationResults = await smtpValidator.validateBulk(emails);

    console.log(`Bulk validation completed. Success: ${validationResults.filter(r => r.is_valid).length}, Failed: ${validationResults.filter(r => !r.is_valid).length}`);

    // Calculate statistics
    const stats = {
      total: validationResults.length,
      verified: validationResults.filter(r => r.is_valid).length,
      failed: validationResults.filter(r => !r.is_valid).length,
      pending: 0,
      domains: {
        total: new Set(validationResults.map(r => r.email.split('@')[1])).size,
        verified: new Set(
          validationResults
            .filter(r => r.is_valid)
            .map(r => r.email.split('@')[1])
        ).size
      },
      dkim: {
        enabled: 0 // DKIM bilgisi olmadığından 0 olarak ayarlanır
      },
      deliverability: undefined, // Gelecekte eklenebilir
    };

    return res.status(200).json({
      results: validationResults,
      stats
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
