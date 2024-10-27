// pages/api/validateBulk.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { hybridValidator } from '../../utils/hybridValidator';
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
    const { emails } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'No emails provided' });
    }

    if (emails.length > 5000) {
      return res.status(400).json({ error: 'Maximum 5000 emails allowed per request' });
    }

    // Validate emails using hybrid validator
    const results = await hybridValidator.validateBulk(emails, {
      useSmtp: true, // Enable SMTP validation
      cacheDuration: 24 * 60 * 60 * 1000 // 24 hours cache
    });

    // Calculate statistics
    const stats = {
      total: results.length,
      valid: results.filter(r => r.is_valid).length,
      invalid: results.filter(r => !r.is_valid).length,
      risk_levels: {
        high: results.filter(r => r.risk === 'high').length,
        medium: results.filter(r => r.risk === 'medium').length,
        low: results.filter(r => r.risk === 'low').length,
        none: results.filter(r => r.risk === 'none').length
      },
      errors: results
        .filter(r => !r.is_valid && r.reason)
        .map(r => `${r.email}: ${r.reason}`)
    };

    return res.status(200).json({
      results,
      stats
    });

  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}