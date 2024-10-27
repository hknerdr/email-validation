// pages/api/validateBulk.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createHybridValidator } from '../../utils/hybridValidator';
import type { BulkValidationResult } from '../../utils/types';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
    responseLimit: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BulkValidationResult | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emails, credentials } = req.body;

    if (!emails?.length) {
      return res.status(400).json({ error: 'No emails provided' });
    }

    if (!credentials?.accessKeyId || !credentials?.secretAccessKey) {
      return res.status(400).json({ error: 'AWS credentials are required' });
    }

    // Create validator instance
    const validator = createHybridValidator(credentials);

    // Validate emails
    const validationResults = await validator.validateBulk(emails);

    // Calculate statistics
    const stats = {
      total: validationResults.totalProcessed,
      verified: validationResults.successful,
      failed: validationResults.failed,
      domains: {
        total: new Set(validationResults.results.map(r => r.email.split('@')[1])).size,
        verified: new Set(validationResults.results.filter(r => r.details.domain_status.verified)
                        .map(r => r.email.split('@')[1])).size
      },
      dkim: {
        enabled: validationResults.results.filter(r => r.details.domain_status.has_dkim).length
      }
    };

    return res.status(200).json({
      results: validationResults.results,
      stats
    });

  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}