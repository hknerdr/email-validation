// pages/api/validateBulk.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createHybridValidator } from '../../utils/hybridValidator';

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
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emails, credentials } = req.body;

    if (!emails?.length || !credentials?.accessKeyId || !credentials?.secretAccessKey) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: !emails?.length ? 'No emails provided' : 'Invalid AWS credentials'
      });
    }

    const validator = createHybridValidator({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: credentials.region || 'us-east-1'
    });

    const validationResult = await validator.validateBulk(emails);

    return res.status(200).json({
      results: validationResult.results,
      stats: validationResult.stats,
      totalProcessed: validationResult.results.length,
      successful: validationResult.results.filter(r => r.is_valid).length,
      failed: validationResult.results.filter(r => !r.is_valid).length
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
